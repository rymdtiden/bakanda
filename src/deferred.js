// https://stackoverflow.com/questions/26150232/resolve-javascript-promise-outside-function-scope

class Deferred {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

module.exports = Deferred;
