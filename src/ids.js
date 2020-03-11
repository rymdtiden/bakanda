const base62 = require("base62/lib/ascii");
const crypto = require("crypto");
//
// Random string generator:
function randStr(len) {
  return [...crypto.randomBytes(len)]
    .map(n => Math.floor(n < 248 ? n / 4 : Math.random() * 61))
    .map(n => String.fromCharCode(n + (n > 9 ? (n < 36 ? 55 : 61) : 48)))
    .join("");
}

function generateId(millisecondEpoch, seedStr) {
  const seed = (() => {
    if (typeof seedStr === "undefined") return randStr(8);
    return crypto
      .createHash("sha512")
      .update(seedStr)
      .digest("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .substr(0, 8);
  })();
  const modifier = seed[0];
  const time = (
    "00000000000000" + (millisecondEpoch || new Date().getTime())
  ).substr(-14);
  const modifiedTime = parseInt(
    time
      .split("")
      .map((digit, index) => {
        const val = (parseInt(digit) + modifier.charCodeAt(0) + index) % 10;
        return "" + val;
      })
      .join("")
  );
  const timeByteArray = ("00000000" + base62.encode(modifiedTime))
    .slice(-8)
    .split("");
  const randomness = modifier + seed.substr(1, 7);
  return randomness
    .split("")
    .map((randChar, index) => {
      return timeByteArray[7 - index] + randChar;
    })
    .join("");
}

function timestampFromId(id) {
  const modifierCharCode = id.charCodeAt(1);
  const modifiedTime = (
    "00000000000000" +
    base62.decode(
      id
        .split("")
        .filter((_, index) => index % 2 === 0)
        .reverse()
        .join("")
    )
  ).slice(-14);
  return parseInt(
    (modifiedTime + "")
      .split("")
      .map((digit, index) => {
        return (
          (10 - (Math.abs(parseInt(digit) - (modifierCharCode + index)) % 10)) %
          10
        );
      })
      .join("")
  );
}

function validIdFormat(id) {
  if (typeof id !== "string") return false;
  if (!id.match(/^[0-9a-zA-Z]{16}$/)) return false;
  return true;
}

module.exports = {
  randStr,
  generateId,
  timestampFromId,
  validIdFormat
};
