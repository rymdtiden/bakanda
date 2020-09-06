const Deferred = require("./deferred");
const EventEmitter = require("events");
const eventlog = require("@rymdtiden/eventlog");
const events = new EventEmitter();
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

  const historyLoaded = new Deferred();
  const onSync = () => {
    // A bit silly that this happens on every sync.
    // Could probably be optimized so it would only resolve once.
    historyLoaded.resolve();
  };

  const { reg } = dataflow({
    add,
    consume,
    log,
    projectionEmitter,
    onSync
  });
  const { middleware } = gql({ log, reg });

  return {
    addEvent: add,
    historyLoaded: historyLoaded.promise,
    middleware,
    reg
  };
}

module.exports = bakanda;
module.exports.__proto__ = {
  ...require("./testtools"),
  ...require("./utils"),
  CustomError
};
