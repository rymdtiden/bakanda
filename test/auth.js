const {
  createToken,
  extrapolateAuthorization,
  integrationInfo,
  parseToken,
  validatePasshash,
  passhasher
} = require("../src/auth");

const { SessionTokenError } = require("../src/errors");

describe("auth.js", () => {
  describe("passhasher()", () => {
    it("should return a hash of the password", () => {
      return passhasher("userid", "topsecret")
        .then(hash => {
          expect(hash).to.be.a("string");
          expect(hash.length).to.equal(255);
        });
      });
  });

  describe("validatePasshash()", () => {
    it("should validate a correct passhash", () => {
      return passhasher("userid", "topsecret")
        .then(hash => {
          return validatePasshash("userid", "topsecret", hash)
        })
        .then(valid => {
          expect(valid).to.equal(true);
        });

    });
    it("should not validate if password is wrong", () => {
      return passhasher("userid", "topsecret")
        .then(hash => {
          return validatePasshash("userid", "WRONG PW", hash)
        })
        .then(valid => {
          expect(valid).to.equal(false);
        });

    });
    it("should not validate if user salt is wrong", () => {
      return passhasher("userid", "topsecret")
        .then(hash => {
          return validatePasshash("WRONG ID", "topsecret", hash)
        })
        .then(valid => {
          expect(valid).to.equal(false);
        });

    });
    it("should not validate if user salt and password is wrong", () => {
      return passhasher("userid", "topsecret")
        .then(hash => {
          return validatePasshash("WRONG ID", "WRONG PW", hash)
        })
        .then(valid => {
          expect(valid).to.equal(false);
        });

    });
  });

  describe("createToken() and parseToken()", () => {
    it("should be able to encrypt and decrypt JWT tokens", () => {
      const secret = "abc123";
      const token = createToken({ test: 1337 }, secret);
      expect(token).to.be.a("string");

      return parseToken(token).then(data => {
        expect(data.test).to.equal(1337);
      });
    });
  });

  describe("parseToken()", () => {
    it("should reject on invalid JWT token", () => {
      return parseToken("thisisaninvalidtoken")
        .catch(err => err)
        .then(err => {
          expect(err).to.be.instanceof(SessionTokenError);
        });
    });
  });

});
