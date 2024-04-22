import { expect } from "chai";
import { loopCount, loopCountConfig, transactionTimeout, transactionTimeoutConfig } from "./main.js";

describe("services", () => {
  describe("systemsettings", () => {
    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof loopCount).to.equal("function");
        expect(typeof loopCountConfig).to.equal("function");

        expect(typeof transactionTimeout).to.equal("function");
        expect(typeof transactionTimeoutConfig).to.equal("function");
      });
    });
  });
});
