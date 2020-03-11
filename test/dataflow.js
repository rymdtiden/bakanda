const dataflow = require("../src/dataflow");
const eventlog = require("@rymdtiden/eventlog");
const logger = require("../src/logger");
const EventEmitter = require("events");
const registry = require("../src/registry");
const { generateId } = require("../src/utils");

describe("dataflow.js", () => {
  it("should handle full command->event->memProjections->query flow", () => {
    const log = logger();
    const { add, consume } = eventlog();
    const projectionEmitter = new EventEmitter();
    const { reg } = dataflow({
      add,
      consume,
      log,
      projectionEmitter
    });

    reg.projectors["UserRegistered"] = (event, { meta, state }) => {
      return {
        users: [
          ...(state.users || []),
          {
            email: event.email,
            fullName: event.fullName
          }
        ]
      };
    };

    reg.validators["UserRegistered"] = (event, { meta, reg }) => {
      return reg.queries
        .userByEmail({ email: event.email })
        .catch(err => null)
        .then(user => {
          if (user) throw new Error("User exists.");
        });
    };

    reg.queries.userByEmail = ({ email }, { log, state }) => {
      const user =
        state.users && state.users.find(user => user.email === email);
      log("result", user);
      if (!user) throw new Error("User does not exist");
      return user;
    };

    reg.commands.registerUser = (args, { addEvent, reg }) => {
      addEvent({ id: generateId(), ...args });
      return () => reg.queries.userByEmail({ email: "johndoe@example.org" });
    };

    return reg.commands
      .registerUser({
        type: "UserRegistered",
        email: "johndoe@example.org",
        fullName: "John Doe"
      })
      .then(user => {
        expect(user.fullName).to.equal("John Doe");
      })
      .then(() => {
        return reg.queries
          .userByEmail({
            email: "johndoe@example.org"
          })
          .then(user => {
            expect(user.fullName).to.equal("John Doe");
          });
      });
  });
});
