import { expect } from "chai";
import { setRoleViaCSVConfig, setRoleViaCSV } from "./main.js";

describe("services", () => {
  describe("bundle test", () => {
    it("should check for bundled methods", () => {
      expect(typeof setRoleViaCSV, "setRoleViaCSV").to.equal("function");
      expect(typeof setRoleViaCSVConfig, "setRoleViaCSVConfig").to.equal("function");
    });
  });
});
