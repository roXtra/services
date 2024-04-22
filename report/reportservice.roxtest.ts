import { initReportUploadField, createReportConfig } from "./main.js";
import * as fs from "fs";
import { assert, expect } from "chai";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";

describe("services", () => {
  describe("servicetemplate", () => {
    // Create a mock service environment
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string): IServiceTaskEnvironment {
      const env = createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.instanceDetails.extras.fieldContents = { UploadField: { type: "ProcessHubFileUpload", value: undefined } };

      return env;
    }

    function performReportTest(bpmnXmlPath: string, bpmnTaskId: string, url: string): string {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId);

      initReportUploadField(url, env.instanceDetails, "UploadField");

      return (env.instanceDetails.extras.fieldContents?.["UploadField"] as IFieldValue).value as string;
    }

    it("execute report service test with correct result_8fd1ba08-f8a1-4caa-b685-27b3ee946037", () => {
      const testStr = performReportTest("./testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB", "test/test");
      assert.equal(testStr, "test/test");
    });

    it("execute report service test with incorrect result_eba2198c-e8ae-4503-addf-c4aa22253297", () => {
      const testStr = performReportTest("./testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB", "test/test");
      assert.notEqual(testStr, "not equal");
    });

    describe("bundle test", () => {
      it("should check for bundled methods", () => {
        expect(typeof initReportUploadField).to.equal("function");
        expect(typeof createReportConfig).to.equal("function");
      });
    });
  });
});
