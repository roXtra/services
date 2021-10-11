import { expect } from "chai";
import { loopCount, loopCountConfig } from "./main";

describe("services", () => {
  describe("systemsettings", () => {
    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof loopCount).to.equal("function");
        expect(typeof loopCountConfig).to.equal("function");
      });
    });
  });
});
