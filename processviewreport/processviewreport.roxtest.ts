import { expect } from "chai";
import { processviewreportConfig, processviewreport } from "./main.js";

describe("services", () => {
  it("bundle test", () => {
    expect(typeof processviewreportConfig === "function").to.equal(true);
    expect(typeof processviewreport === "function").to.equal(true);
  });
});
