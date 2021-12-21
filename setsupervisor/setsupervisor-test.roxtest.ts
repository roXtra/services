import { expect } from "chai";
import { setsupervisor, setsupervisorConfig } from "./main";

describe("services", () => {
  describe("bundle test", () => {
    it("should check for bundled methods", () => {
      expect(typeof setsupervisor, "setsupervisor").to.equal("function");
      expect(typeof setsupervisorConfig, "setsupervisorConfig").to.equal("function");
    });
  });
});
