import { expect } from "chai";
import { executeQuery, executeQueryConfig, executeQueryNoReturnConfig, executeQueryNoReturn } from "./main.js";

describe("services", () => {
  describe("mssql", () => {
    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof executeQuery).to.equal("function");
        expect(typeof executeQueryConfig).to.equal("function");

        expect(typeof executeQueryNoReturn).to.equal("function");
        expect(typeof executeQueryNoReturnConfig).to.equal("function");
      });
    });
  });
});
