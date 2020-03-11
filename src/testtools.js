const fetch = require("node-fetch");
const { randStr } = require("./ids");

function graphqlTester() {
  const devServer = "http://localhost:4000";
  const server = process.env.SERVER || devServer;
  const graphqlUrl = server + "/graphql";
  const previewId = randStr(32);
  const previewHeader = {
    "X-Preview": previewId
  };

  function expectError(errors, className) {
    if (!Array.isArray(errors)) {
      console.log(errors);
      throw new Error("Not an error.");
    }
    const found = errors.reduce((result, error) => {
      if (error.extensions.code === className) {
        return true;
      }
      return result;
    }, false);
    if (!found) {
      console.error(errors);
      throw new Error("Error does not match expected error class " + className);
    }
  }

  let authHeader = {};

  function request(query) {
    return fetch(graphqlUrl, {
      method: "POST",
      headers: {
        ...previewHeader,
        ...authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    })
      .then(res => res.json())
      .then(data => {
        if (data.errors) {
          return Promise.reject(data.errors);
        } else {
          return data.data;
        }
      })
  }

  function setAuthToken(bearer) {
    if (!bearer) {
      authHeader = {};
    } else {
      authHeader = { Authorization: "Bearer " + bearer };
    }
  }

  return {
    expectError,
    request,
    setAuthToken
  };

}

module.exports = {
  graphqlTester
};
