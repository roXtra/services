// Tests for csvreader
import { expect } from "chai";
import { csvreaderConfig, csvreader } from "./main";

describe("services", () => {
  describe("csv", () => {
    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof csvreader).to.equal("function");
        expect(typeof csvreaderConfig).to.equal("function");
      });
    });
  });
});
