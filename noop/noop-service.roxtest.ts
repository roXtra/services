import * as PH from "processhub-sdk";
import { noop } from "./noop-service";
import { expect } from "chai";

describe("services", () => {
  describe("noop", () => {
    it("execute service", async () => {
      const env = PH.Test.createEmptyTestServiceEnvironment("");
      const result = await noop(env);
      expect(result).to.equal(true);
    });
  });
});
