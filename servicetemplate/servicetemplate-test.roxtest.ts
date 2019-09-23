// Uncomment the following line in real service
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { assert } from "chai";
import * as PH from "processhub-sdk";
import * as Service1 from "./service1-service";
import * as Service2 from "./service2-service";
import * as fs from "fs";

describe("services", () => {
  describe("servicetemplate", () => {

    // Create a mock service environment
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string, field1Value: string, field2Value: string): PH.ServiceTask.ServiceTaskEnvironment {
      const env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.fieldContents = { "Field1": { type: "ProcessHubNumber", value: field1Value }, "Field2": { type: "ProcessHubNumber", value: field2Value } };
      env.instanceDetails.extras.fieldContents = env.fieldContents;

      return env;
    }

    // Uncomment the following line in real service
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function performService1Test(bpmnXmlPath: string, bpmnTaskId: string, feld1Value: string, feld2Value: string): Promise<void> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId, feld1Value, feld2Value);
      await Service1.serviceLogic(env);

      // Then test if the environment changes as expected with asserts
    }

    // Uncomment the following line in real service
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function performService2Test(bpmnXmlPath: string, bpmnTaskId: string, feld1Value: string, feld2Value: string): Promise<void> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId, feld1Value, feld2Value);
      await Service2.serviceLogic(env);

      // Then test if the environment changes as expected with asserts
    }

    // Execute tests with it()
    it("execute service1 test_guid", async () => {
      // Uncomment this line in real service
      // await performService1Test("path", "id", "field1", "field");
    });

    it("execute service 2 test_guid", async () => {
      // Uncomment this line in real service
      // await performService2Test("path", "id", "field1", "field");
    });
  });
});