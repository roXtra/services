import { expect } from "chai";
import { executeQuery, executeQueryConfig } from "../main";

describe("services", () => {
  describe("mysql", () => {
    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof executeQuery).to.equal("function");
        expect(typeof executeQueryConfig).to.equal("function");
      });
    });
  });
});
