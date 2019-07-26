import { assert } from "chai";
import * as PH from "processhub-sdk";
import * as Service1 from "./service1-service";
import * as Service2 from "./service2-service";
import fs = require("fs");

describe("services", () => {
    describe("servicetemplate", () => {

        // create a mock service environment
        function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string, field1Value: string, field2Value: string): PH.ServiceTask.ServiceTaskEnvironment {
            let env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
            env.bpmnTaskId = bpmnTaskId;
            env.fieldContents = { "Field1": { type: "ProcessHubNumber", value: field1Value }, "Field2": { type: "ProcessHubNumber", value: field2Value } };
            env.instanceDetails.extras.fieldContents = env.fieldContents;

            return env;
        }

        async function performService1Test(bpmnXmlPath: string, bpmnTaskId: string, feld1Value: string, feld2Value: string) {
            let env = createEnvironment(bpmnXmlPath, bpmnTaskId, feld1Value, feld2Value);
            await Service1.serviceLogic(env);

            // then test if the environment changes as expected with asserts
        }

        async function performService2Test(bpmnXmlPath: string, bpmnTaskId: string, feld1Value: string, feld2Value: string) {
            let env = createEnvironment(bpmnXmlPath, bpmnTaskId, feld1Value, feld2Value);
            await Service2.serviceLogic(env);

            // then test if the environment changes as expected with asserts
        }

        // execute tests with it()
        it("execute service1 test_guid", async () => {
            await performService1Test("path", "id", "field1", "field");
        });

        it("execute service 2 test_guid", async () => {
            await performService2Test("path", "id", "field1", "field");
        });
    });
});