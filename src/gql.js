const fs = require("fs");
const { ApolloServer, gql } = require("apollo-server-express");
const { makeExecutableSchema } = require("graphql-tools");
const { generateId } = require("./ids");

module.exports = ({ log, reg }) => {
  function middleware({ schemaFile }) {
    const typeDefs = gql(fs.readFileSync(schemaFile, "utf8"));
    const server = new ApolloServer({
      context: ({ req, res }) => {
        const requestId =
          (req && req.headers && req.headers["x-request-id"]) || generateId();
        const reqLog = log.extend("req(" + requestId + ")");
        reqLog("Request id: %s", requestId);
        const scopedReg = reg.scope({ log: reqLog });

        return Promise.resolve(
          (() => {
            if (
              req &&
              req.headers["authorization"] &&
              typeof scopedReg.queries.session === "function"
            ) {
              try {
                return scopedReg.queries.session({
                  token: req.headers["authorization"]
                });
              } catch (err) {
                return {}; 
              }
            }
          })()
        ).then(session => {
          // TODO: Tests to be written: Not logged in requests from graphql should
          // have an empty object as session. But when calling registry functions
          // from within the codebase, session should be undefined.

          return {
            req,
            res,
            log: reqLog,
            reg: scopedReg,
            requestId,
            session: typeof session === "object" ? session : {}
          };
        });

      },
      schema: makeExecutableSchema({
        resolvers: {
          Mutation: Object.keys(reg.commands).reduce((acc, commandName) => {
            return {
              ...acc,
              [commandName]: (obj, args, context, info) =>
                context.reg.commands[commandName](args, { obj, context, info })
            };
          }, {}),
          Query: Object.keys(reg.queries).reduce((acc, queryName) => {
            return {
              ...acc,
              [queryName]: (obj, args, context, info) => {
                return context.reg.queries[queryName](args, {
                  obj,
                  context,
                  info
                });
              }
            };
          }, {})
        },
        typeDefs
      }),
      formatError: err => {
        console.log(JSON.stringify(err));
        /*
        if (err.message.match(/^[A-Z][a-zA-Z]+: /,
        const errClass = err.message.replace(/:.+$/, "");
        err.extensions.code = ;
        */
        return err;
      }
    });
    return server.getMiddleware();
  }
  return { middleware };
};
