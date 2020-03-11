const { generateId, timestampFromId } = require("../src/utils");

describe("utils.js", () => {
  describe("generateId()", () => {
    it("should generate an id that is 16 chars long", () => {
      // Test 10000 times:
      [...Array(10000)].forEach(() => {
        const id = generateId();
        expect(id.length).to.equal(16);
      });
    });
    it("should always return the same id if provided timestamp and seedStr", () => {
      expect(
        generateId(new Date("1979-05-25T01:02:03.004").getTime(), "alfreds")
      ).to.equal("fLKqjdrOYg5J3Fjl");
    });
  });

  describe("timestampFromId()", () => {
    it("should return the same timestamp as the id was generated with", () => {
      // Test 10000 times:
      let time = new Date().getTime();
      [...Array(10000)].forEach(() => {
        const id = generateId(time);
        expect(timestampFromId(id)).to.equal(time);
        time++;
      });
    });
  });
});
