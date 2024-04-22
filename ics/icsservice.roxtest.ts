import { expect } from "chai";
import { generateConfig, generate } from "./main.js";

describe("services", () => {
  describe("ics", () => {
    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof generate).to.equal("function");
        expect(typeof generateConfig).to.equal("function");
      });
    });
  });
});
