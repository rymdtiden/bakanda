const EventEmitter = require("events");
const eventlog = require("@rymdtiden/eventlog");
const { CustomError } = require("./errors");
const dataflow = require("./dataflow");
const gql = require("./gql");
const logger = require("./logger");
const projectionEmitter = new EventEmitter();
const registry = require("./registry");

function bakanda({ eventlogPath, namespace }) {
  const log = logger({ namespace });
  const packageJson = require("../package.json");
  log("%s %s", packageJson.name, packageJson.version);

  const { add, consume } = eventlog({ filename: eventlogPath });

  const { reg } = dataflow({
    add,
    consume,
    log,
    projectionEmitter
  });
  const { middleware } = gql({ log, reg });

  return {
    middleware,
    reg
  };
}

module.exports = bakanda;

module.exports = bakanda;
module.exports.__proto__ = {
  ...require("./testtools"),
  ...require("./utils"),
  CustomError
};
