const EventEmitter = require("events");
const registry = require("./registry");
const utils = require("./utils");

function dataflow({
  add,
  consume,
  initialState,
  log,
  onSync,
  projectionEmitter,
}) {
  let state = initialState || {};

  const reg = registry({
    categories: ["commands", "queries", "validators", "projectors"],
    log,
    fnModifier: ({ category, fn }) => {
      return (args, deps) => {
        /* Will it even happen?
        if (typeof deps === "undefined") deps = {}; */

        const { log } = deps;
        log("arg: %o", args);

        try {
          return Promise.resolve(
            (() => {
              if (category === "commands") {
                const events = [];
                return Promise.resolve(
                  fn(args, {
                    ...deps,
                    state,
                    addEvent: (event) => {
                      return Promise.resolve()
                        .then(() => {
                          const { validators } = reg.scope({ log });
                          if (typeof validators[event.type] !== "undefined") {
                            return validators[event.type](event, utils);
                          }
                        })
                        .then(() => {
                          const promise = new Promise((resolve, reject) => {
                            const { id } = add(event);
                            projectionEmitter.once(id, (err) =>
                              err ? reject(err) : resolve()
                            );
                          });
                          events.push(promise);
                          return promise;
                        });
                    },
                  })
                )
                  .then((result) =>
                    events.length > 0
                      ? Promise.all(events).then(() => result)
                      : result
                  )
                  .then((result) =>
                    typeof result === "function" ? result() : result
                  );
              } else if (category === "queries") {
                const data = fn(args, { ...deps, state });
                return data;
              } else if (category === "projectors") {
                const newState = fn(args, { ...deps, state });
                if (typeof newState.then === "undefined") {
                  state = newState;
                  log("New state: %O", state);
                  return newState;
                } else {
                  return newState.then((newState) => {
                    state = newState;
                    log("New state: %O", state);
                  });
                }
              } else if (category === "validators") {
                return fn(args, { ...deps, state });
              }
            })()
          );
        } catch (err) {
          return Promise.reject(err);
        }
      };
    },
  });

  consume(
    (event, meta) =>
      ((log) => {
        const { validators, projectors } = reg.scope({ log });
        return Promise.resolve(log("Event from consumer: %O %o", event, meta))
          .then(() => {
            if (typeof validators[event.type] !== "undefined") {
              return validators[event.type](event, { ...utils, meta });
            }
          })
          .then(() => {
            log("Event validated.");
            if (typeof projectors[event.type] === "undefined") {
              log("No projector for event type %s", event.type);
              return;
            }
            return projectors[event.type](event, { ...utils, meta })
              .then(
                () => projectionEmitter && projectionEmitter.emit(meta.id, null)
              )
              .catch((err) => {
                log("Error during projection. %O", err);
                projectionEmitter.emit(meta.id, err);
              });
          })
          .catch((err) => {
            log("Did not validate. %O", err);
            projectionEmitter.emit(meta.id, err);
          });
      })(log.extend(`(event)${meta.pos}`)),
    0,
    onSync
  );

  const timeout = (fn, ms) => setTimeout(() => fn({ reg, state }), ms);

  return { reg, timeout };
}

module.exports = dataflow;
