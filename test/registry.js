const logger = require("../src/logger");
const registry = require("../src/registry");

describe("registry.js", () => {
  describe("registry()", () => {
    it("should return an object with extend fn and category arrays", () => {
      const log = logger({ namespace: "test" });
      const reg = registry({ categories: ["commands", "queries"], log });

      expect(reg).to.be.an("object");
      expect(reg.commands).to.be.an("object");
      expect(reg.queries).to.be.an("object");
      expect(reg.queries.nonexisting).to.be.an("undefined");
    });
  });

  it("should expose fns we add to it", () => {
    const log = logger({ namespace: "test" });
    const reg = registry({ categories: ["commands", "queries"], log });
    let counter = 0;
    reg.commands.myTestCommand = () => counter++;
    reg.commands.myTestCommand();
    reg.commands.myTestCommand();
    reg.commands.myTestCommand();
    expect(counter).to.equal(3);
  });

  it("should wrap fns we add to it with custom wrapper", () => {
    const log = logger({ namespace: "test" });
    const reg = registry({
      categories: ["commands", "queries"],
      log,
      fnModifier: ({ fn }) => (...args) => {
        wrapCounter++;
        return fn(...args);
      }
    });
    let counter = 0;
    let wrapCounter = 0;

    const myTestCommand = () => counter++;
    reg.commands.myTestCommand = myTestCommand;
    expect(Object.keys(reg.commands)).to.deep.equal(["myTestCommand"]);

    reg.commands.myTestCommand();
    reg.commands.myTestCommand();
    reg.commands.myTestCommand();
    expect(counter).to.equal(3);
    expect(wrapCounter).to.equal(3);
  });

  it("should keep track of call order in logs", () => {
    const logarr = [];
    const log = logger({ logarr, namespace: "test" });
    const reg = registry({
      categories: ["commands", "queries"],
      log
    });

    reg.commands.one = (args, { log }) => log("ett");
    reg.commands.two = (args, { log, reg }) => {
      log("två");
      reg.commands.one();
    };
    reg.commands.three = (args, { log, reg }) => {
      log("tre");
      reg.commands.two();
      reg.queries.four();
      reg.commands.one();
    };
    reg.queries.four = (args, { log, reg }) => {
      log("fyra");
    };

    reg.commands.one();
    reg.commands.two();
    reg.commands.three();
    reg.queries.four();
    expect(logarr).to.deep.equal([
      { msg: ["ett"], namespace: "test:(commands)one" },
      { msg: ["två"], namespace: "test:(commands)two" },
      { msg: ["ett"], namespace: "test:(commands)two:(commands)one" },
      { msg: ["tre"], namespace: "test:(commands)three" },
      { msg: ["två"], namespace: "test:(commands)three:(commands)two" },
      {
        msg: ["ett"],
        namespace: "test:(commands)three:(commands)two:(commands)one"
      },
      { msg: ["fyra"], namespace: "test:(commands)three:(queries)four" },
      { msg: ["ett"], namespace: "test:(commands)three:(commands)one" },
      { msg: ["fyra"], namespace: "test:(queries)four" }
    ]);
  });
});
