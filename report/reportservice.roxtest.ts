
import * as PH from "processhub-sdk";
import * as CreateReport from "./createReport-service";
import * as fs from "fs";
import { UploadAttachmentReply } from "processhub-sdk/lib/instance";
import { assert } from "chai";

describe("services", () => {
    describe("servicetemplate", () => {

        // create a mock service environment
        function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string): PH.ServiceTask.ServiceTaskEnvironment {
            let env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
            env.bpmnTaskId = bpmnTaskId;
            env.fieldContents = { "UploadField": { type: "ProcessHubFileUpload", value: null }};
            env.instanceDetails.extras.fieldContents = env.fieldContents;

            return env;
        }

        async function performReportTest(bpmnXmlPath: string, bpmnTaskId: string, url: string): Promise<string> {
            let env = createEnvironment(bpmnXmlPath, bpmnTaskId);

            await CreateReport.initReportUploadField(url, env.instanceDetails, "UploadField");

            return (env.instanceDetails.extras.fieldContents["UploadField"] as PH.Data.FieldValue).value as string;
        }

        it("execute report service test with correct result_8fd1ba08-f8a1-4caa-b685-27b3ee946037", async () => {
            const testStr = await performReportTest("report/testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB", "test/test");
            assert.equal(testStr, "test/test");
        });

        it("execute report service test with incorrect result_eba2198c-e8ae-4503-addf-c4aa22253297", async () => {
            const testStr = await performReportTest("report/testfiles/report-pdf-test.bpmn", "ServiceTask_F269D56AEDCBE5BB", "test/test");
            assert.notEqual(testStr, "not equal");
        });
    });
});