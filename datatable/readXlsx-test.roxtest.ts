import { readXlsx, readXlsxConfig, readXlsxFile } from "./main.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { assert, expect } from "chai";
import fs from "fs";
import { DataTableErrorCode, readFileData } from "./common.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";

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

    describe("readFileData", () => {
      it("should throw an error if cell data cannot be converted to number", () => {
        const environment = createEmptyTestServiceEnvironment(fs.readFileSync("./testfiles/datatableservice.bpmn", "utf8"));
        try {
          readFileData(
            environment,
            "en-US",
            "",
            {
              columns: [{ name: "Adresse", type: "numeric", id: "abc" }],
              conditionBuilderMode: true,
              conditionExpression: "",
              validationBuilderMode: true,
              validationExpression: "",
            },
            "",
            "./testfiles/liste.xlsx",
          );
          assert.fail("Expected an error");
        } catch (error) {
          expect(error).to.be.instanceOf(BpmnError);
          const bpmnError = error as BpmnError;
          expect(bpmnError.errorCode).to.equal(DataTableErrorCode.DATA_ERROR);
        }
      });

      it("should not throw an error for different valid number values", () => {
        const environment = createEmptyTestServiceEnvironment(fs.readFileSync("./testfiles/datatableservice.bpmn", "utf8"));

        const fieldValue = readFileData(
          environment,
          "en-US",
          "",
          {
            columns: [{ name: "Kostenstelle", type: "numeric", id: "abc" }],
            conditionBuilderMode: true,
            conditionExpression: "",
            validationBuilderMode: true,
            validationExpression: "",
          },
          "",
          "./testfiles/validnumbers.xlsx",
        );
        expect(fieldValue).to.not.be.undefined;
        console.log(fieldValue.rows);
        expect(fieldValue.rows.length).to.equal(19);
        const numbers = fieldValue.rows.map((r) => r.data.Kostenstelle);
        expect(numbers).to.deep.equal([1001, 1002, 1003, 0, 1005, 1007, 1008, 1009, 3.1456, 1011, 1012, 1013, 1014, -12, 100.54543, 1017, 1018, 1019, 1020]);
      });
    });
  });
});
