const { FunctionNameAlreadyExists } = require("./errors");
const utils = require("./utils");

function registry({ categories, fns, log, fnModifier, deps }) {
  if (typeof fns === "undefined") {
    fns = categories.reduce((acc, category) => {
      return {
        ...acc,
        [category]: {}
      };
    }, {});
  }

  function scope({ log, deps }) {
    return registry({ categories, fns, log, fnModifier, deps });
  }

  const reg = categories.reduce(
    (acc, category) => {
      return {
        ...acc,
        [category]: new Proxy(
          {},
          {
            get: (obj, prop) => {
              if (!fns[category] || !fns[category][prop]) {
                log("no such fn: %s.%s", category, prop);
                return;
              }
              const regDeps = deps;
              return (args, deps) => {
                const newLog = log.extend(`(${category})${prop}`);
                deps = {
                  ...(regDeps || {}),
                  ...utils,
                  ...(deps ? deps : {}),
                  log: newLog,
                  reg: scope({ log: newLog, deps })
                };
                if (deps.context) {
                  deps = {
                    ...(deps.context),
                    ...deps
                  }
                }
                return fns[category][prop](args, deps);
              };
            },
            getOwnPropertyDescriptor: (target, prop) =>
              Object.getOwnPropertyDescriptor(fns[category], prop),
            has: (obj, prop) => typeof fns[category][prop] !== "undefined",
            ownKeys: target => {
              const a = Object.keys(fns[category]);
              return a;
            },
            set: (obj, prop, value) => {
              if (typeof value === "function") {
                if (typeof fns[category][prop] !== "undefined")
                  throw new FunctionNameAlreadyExists();
                fns[category][prop] = (() => {
                  if (fnModifier) {
                    return fnModifier({
                      category,
                      fnName: prop,
                      fn: value
                    });
                  } else {
                    return value;
                  }
                })();
              }
            }
          }
        )
      };
    },
    { scope }
  );
  return reg;
}

module.exports = registry;
