import { expect } from "chai";
import { service1, service1Config, service2, service2Config } from "./main.js";
import * as fs from "fs";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";

describe("services", () => {
  describe("servicetemplate", () => {
    // Create a mock service environment
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string, field1Value: string, field2Value: string): IServiceTaskEnvironment {
      const env = createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.instanceDetails.extras.fieldContents = { Field1: { type: "ProcessHubNumber", value: field1Value }, Field2: { type: "ProcessHubNumber", value: field2Value } };

      return env;
    }

    // Uncomment the following line in real service
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function performService1Test(bpmnXmlPath: string, bpmnTaskId: string, feld1Value: string, feld2Value: string): Promise<void> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId, feld1Value, feld2Value);
      await service1(env);

      // Then test if the environment changes as expected with asserts
    }

    // Uncomment the following line in real service
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function performService2Test(bpmnXmlPath: string, bpmnTaskId: string, feld1Value: string, feld2Value: string): Promise<void> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId, feld1Value, feld2Value);
      await service2(env);

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

  describe("bundle test", () => {
    it("should check for bundled methods", () => {
      expect(typeof service1).to.equal("function");
      expect(typeof service1Config).to.equal("function");
      expect(typeof service2).to.equal("function");
      expect(typeof service2Config).to.equal("function");
    });
  });
});
