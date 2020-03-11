const debug = require("debug");

module.exports = opts => {
  const namespace = (opts && opts.namespace) || require("../package.json").name;
  const logarr = opts && opts.logarr ? opts.logarr : undefined;
  const debugLogFn = debug(namespace);
  const log = (...args) => {
    debugLogFn(...args);

    if (logarr && Array.isArray(logarr)) {
      logarr.push({ namespace, msg: args });
    }
  };
  log.extend = subnamespace => {
    return module.exports({
      logarr,
      namespace: namespace + ":" + subnamespace
    });
  };
  return log;
};
