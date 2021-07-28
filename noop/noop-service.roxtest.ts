import { noop, noopConfig } from "./main";
import { expect } from "chai";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools";

describe("services", () => {
  describe("noop", () => {
    it("execute service", async () => {
      const env = createEmptyTestServiceEnvironment("");
      const result = await noop(env);
      expect(result).to.equal(true);
    });

    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof noop).to.equal("function");
        expect(typeof noopConfig).to.equal("function");
      });
    });
  });
});
