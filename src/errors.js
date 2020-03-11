const { ApolloError } = require("apollo-server-express");

class CustomError extends ApolloError {
  constructor(data) {
    super("", "", {});
    const className = this.constructor.name;
    const humanReadableClassName =
      className
        .replace(/(.)([A-Z])/g, "$1 $2")
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase()) + ".";

    const message = (() => {
      if (typeof data === "string" && data.trim() !== "") return data;
      return humanReadableClassName;
    })();

    if (typeof data === "object")
      this.extensions = {
        ...data,
        ...this.extensions
      };

    this.extensions.code = className;
    this.message = message;
  }
}

class BakandaError extends CustomError {}

class FunctionNameAlreadyExists extends BakandaError {}
class PasswordTooShort extends BakandaError {}
class SessionTokenError extends BakandaError {}

module.exports = {
  CustomError,
  BakandaError,

  FunctionNameAlreadyExists,
  PasswordTooShort,
  SessionTokenError
};
