import * as PH from "processhub-sdk";
import * as CreateReport from "./createReport-service";
import * as fs from "fs";
import { assert } from "chai";

describe("services", () => {
  describe("servicetemplate", () => {
    // Create a mock service environment
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string): PH.ServiceTask.IServiceTaskEnvironment {
      const env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.fieldContents = { UploadField: { type: "ProcessHubFileUpload", value: null } };
      env.instanceDetails.extras.fieldContents = env.fieldContents;

      return env;
    }

    function performReportTest(bpmnXmlPath: string, bpmnTaskId: string, url: string): string {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId);

      CreateReport.initReportUploadField(url, env.instanceDetails, "UploadField");

      return (env.instanceDetails.extras.fieldContents["UploadField"] as PH.Data.IFieldValue).value as string;
    }

    it("execute report service test with correct result_8fd1ba08-f8a1-4caa-b685-27b3ee946037", () => {
      const testStr = performReportTest("./testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB", "test/test");
      assert.equal(testStr, "test/test");
    });

    it("execute report service test with incorrect result_eba2198c-e8ae-4503-addf-c4aa22253297", () => {
      const testStr = performReportTest("./testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB", "test/test");
      assert.notEqual(testStr, "not equal");
    });
  });
});
