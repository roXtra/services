import { readXlsx, readXlsxConfig, readXlsxFile } from "./main.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { expect } from "chai";
import fs from "fs";

describe("services", () => {
  describe("datatable", () => {
    it("should check for bundled methods", () => {
      expect(typeof readXlsxConfig).to.equal("function");
      expect(typeof readXlsx).to.equal("function");
    });

    describe("readXlsx", () => {
      it("should read data from an excel file", async () => {
        const environment = createEmptyTestServiceEnvironment(fs.readFileSync("./testfiles/datatableservice.bpmn", "utf8"));
        environment.bpmnTaskId = "ServiceTask_88CD77E856071A65";
        const fieldValue = await readXlsxFile(environment);
        expect(fieldValue).to.not.be.undefined;
        expect(fieldValue.rows.length).to.equal(20);
        for (const row of fieldValue.rows) {
          expect(row.selected).to.equal(false);
          expect(typeof row.data.Name).to.equal("string");
          expect(typeof row.data.Adresse).to.equal("string");
          expect(typeof row.data.Telefonnummer).to.equal("string");
          expect(typeof row.data.Kostenstelle).to.equal("number");
        }
      });
    });
  });
});
