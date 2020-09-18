const { PasswordTooShort, SessionTokenError } = require("./errors");

const crypto = require("crypto");
const debug = require("debug");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");
const { promisify } = require("util");
const { randStr } = require("./ids");

const jwtSecretsFile = path.resolve(
  process.mainModule.paths[0].split("node_modules")[0].slice(0, -1),
  ".jwtsecrets"
);

// Generate JWT keypair:
const defaultJwtSecret =
  "When the seagulls follow the trawler, " +
  "it is because they think sardines will be thrown into the sea";
const [jwtPublicKey, jwtPrivateKey] = (() => {
  try {
    const data = fs.readFileSync(jwtSecretsFile);
    const keys = JSON.parse(data);
    const { publicKey, privateKey } = keys;
    return [publicKey, privateKey];
  } catch (err) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 1024,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: process.env.JWTSECRET || defaultJwtSecret,
      },
    });
    fs.writeFileSync(jwtSecretsFile, JSON.stringify({ publicKey, privateKey }));
    return [publicKey, privateKey];
  }
})();

// For salt:
const saltSecret = process.env.SALTSECRET || "topsecret";

// Creates hashes from passwords:
function passhasher(uniqueUserSalt, password) {
  if (password.length < 5) throw new PasswordTooShort();
  const nonce = randStr(54);
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      [uniqueUserSalt, saltSecret, nonce].join(";"),
      10000,
      100,
      "sha512",
      (err, hash) => {
        if (err) return reject(err);
        resolve(hash.toString("hex") + ";" + nonce);
      }
    );
  });
}

// Creates hashes from passwords:
function passhasherSync(uniqueUserSalt, password) {
  if (password.length < 5) throw new PasswordTooShort();
  const nonce = randStr(54);
  const hash = crypto.pbkdf2Sync(
    password,
    [uniqueUserSalt, saltSecret, nonce].join(";"),
    10000,
    100,
    "sha512"
  );
  return hash.toString("hex") + ";" + nonce;
}

// Validates hashes matching password, resolves true/false:
function validatePasshash(uniqueUserSalt, password, passhash) {
  const [hash, nonce] = passhash.split(";");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      [uniqueUserSalt, saltSecret, nonce].join(";"),
      10000,
      100,
      "sha512",
      (err, h) => {
        if (err) return reject(err);
        resolve(h.toString("hex") === hash);
      }
    );
  });
}

// Create a JWT token with the given data:
function createToken(data) {
  const token = jwt.sign(
    data,
    {
      key: jwtPrivateKey,
      passphrase: process.env.JWTSECRET || defaultJwtSecret,
    },
    {
      algorithm: "RS256",
      expiresIn: "336h",
    }
  );
  return token;
}

// Parse a JWT token:
function parseToken(token) {
  if (!token) return Promise.reject(new SessionTokenError());
  return new Promise((resolve, reject) => {
    jwt.verify(
      token.replace(/^Bearer /, "").trim(),
      jwtPublicKey,
      {
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  }).catch((err) => {
    throw new SessionTokenError();
  });
}

module.exports = {
  createToken,
  jwtPublicKey,
  parseToken,
  passhasher,
  passhasherSync,
  validatePasshash,
};
