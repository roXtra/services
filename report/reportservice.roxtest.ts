import { initReportUploadField, createReportConfig, uploadReport } from "./main.js";
import * as fs from "fs";
import { assert, expect } from "chai";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import Sinon from "sinon";

describe("services", () => {
  // Create a mock service environment
  function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string): IServiceTaskEnvironment {
    const env = createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
    env.instances.generateInstanceReport = Sinon.stub().returns(Promise.resolve({ doc: "test", fileName: "test.pdf" }));
    env.bpmnTaskId = bpmnTaskId;
    env.instanceDetails.extras.fieldContents = { UploadField: { type: "ProcessHubFileUpload", value: undefined } };

    return env;
  }

  describe("uploadReport", () => {
    it("should throw an error if a field for the filename was configured but does not exist", async () => {
      const env = createEnvironment("./testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB");

      try {
        await uploadReport(env, "draft_123", "pdf", "FileName");
        assert.fail("Expected error was not thrown");
      } catch (ex) {
        expect(ex).to.be.instanceOf(Error);
      }
    });

    it("should read the report filename from field contents", async () => {
      const env = createEnvironment("./testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB");
      env.instanceDetails.extras.fieldContents!["FileName"] = {
        type: "ProcessHubTextInput",
        value: "Report.pdf",
      };
      const uploadAttachmentStub = Sinon.stub(env.instances, "uploadAttachment").returns(Promise.resolve("http://localhost/abc"));
      await uploadReport(env, "draft_123", "pdf", "FileName");
      expect(uploadAttachmentStub.calledOnce).to.equal(true);
      expect(uploadAttachmentStub.getCall(0).args[1]).to.equal("Report.pdf");
    });

    ["", undefined].forEach((filename) => {
      it("should use default filename if the report filename field is not configured", async () => {
        const env = createEnvironment("./testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB");
        env.instanceDetails.extras.fieldContents!["FileName"] = {
          type: "ProcessHubTextInput",
          value: "Report.pdf",
        };
        const uploadAttachmentStub = Sinon.stub(env.instances, "uploadAttachment").returns(Promise.resolve("http://localhost/abc"));
        await uploadReport(env, "draft_123", "pdf", filename);
        expect(uploadAttachmentStub.calledOnce).to.equal(true);
        expect(uploadAttachmentStub.getCall(0).args[1]).to.equal("test.pdf");
      });
    });
  });

  describe("initReportUploadField", () => {
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
  });

  describe("bundle test", () => {
    it("should check for bundled methods", () => {
      expect(typeof initReportUploadField).to.equal("function");
      expect(typeof createReportConfig).to.equal("function");
    });
  });
});
