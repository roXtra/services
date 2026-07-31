import * as fs from "fs";
import { assert } from "chai";
import { serviceLogic } from "./main.js";
import { IProcessDetails } from "processhub-sdk/lib/process/processinterfaces.js";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";

describe("Tests", () => {
  describe("vorgangsnr", () => {
    // Create a mock service environment
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string): IServiceTaskEnvironment {
      const env = createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.instanceDetails.extras.fieldContents = {};
      env.instanceDetails.createdAt = new Date("October 13, 2018 11:13:00");
      return env;
    }

    function createInstance(createdAt: Date, fieldContents: Record<string, string>): IInstanceDetails {
      return {
        title: "",
        instanceId: "",
        workspaceId: "",
        processId: "",
        extras: {
          instanceState: undefined,
          fieldContents: Object.fromEntries(Object.entries(fieldContents).map(([fieldName, value]) => [fieldName, { type: "ProcessHubTextInput", value }])),
        },
        createdAt,
        takenStartEvent: "",
        reachedEndEvents: [],
      };
    }

    async function performVorgangsNrTest(
      bpmnXmlPath: string,
      bpmnTaskId: string,
      instances: IInstanceDetails[],
      targetField: string,
      expression: string,
      filter?: string,
    ): Promise<IServiceTaskEnvironment> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId);
      env.instances.getAllInstancesForProcess = () => Promise.resolve(instances);
      const processDetails: IProcessDetails = {
        processId: "",
        workspaceId: "",
        displayName: "",
        description: "",
        extras: { instances: [] },
        type: "backend",
      };

      await serviceLogic(processDetails, env, targetField, expression, filter);

      return env;
    }

    it("counts instances for a specific year with filter set", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${yearlyInstanceNumber < 10 ? 0 : ''}${yearlyInstanceNumber}-${instanceYear}";
      const filter = "field['CAPA notwendig?'] === 'Ja'";

      const instances: IInstanceDetails[] = [
        // Current instance
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
            fieldContents: { "CAPA notwendig?": { type: "ProcessHubTextInput", value: "Ja" } },
          },
          createdAt: new Date("October 13, 2018 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },

        // Older instances
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
            fieldContents: { "CAPA notwendig?": { type: "ProcessHubTextInput", value: "Ja" } },
          },
          createdAt: new Date("October 12, 2018 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
            fieldContents: { "CAPA notwendig?": { type: "ProcessHubTextInput", value: "Nein" } },
          },
          createdAt: new Date("October 13, 2017 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-02-2018");
    });

    it("counts instances for a specific month with empty filter", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${monthlyInstanceNumber < 10 ? 0 : ''}${monthlyInstanceNumber}-${instanceMonth + 1}-${instanceYear}";
      const filter = "";
      const instances: IInstanceDetails[] = [
        // Current instance
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
            fieldContents: { "CAPA notwendig?": { type: "ProcessHubTextInput", value: "Ja" } },
          },
          createdAt: new Date("October 13, 2018 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },

        // Older instances
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
            fieldContents: { "CAPA notwendig?": { type: "ProcessHubTextInput", value: "Ja" } },
          },
          createdAt: new Date("October 12, 2018 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
            fieldContents: { "CAPA notwendig?": { type: "ProcessHubTextInput", value: "Ja" } },
          },
          createdAt: new Date("September 13, 2018 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-02-10-2018");
    });

    it("counts instances based on the filter", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${dailyInstanceNumber < 10 ? 0 : ''}${dailyInstanceNumber}-${instanceMonth + 1}-${instanceYear}";
      const filter = "field['CAPA notwendig?'] === 'Nein' && field['Test erfolgreich?'] === 'Ja'";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Nein", "Test erfolgreich?": "Ja" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { "CAPA notwendig?": "Nein", "Test erfolgreich?": "Ja" }),
        createInstance(new Date("October 11, 2018 11:15:00"), { "CAPA notwendig?": "Ja", "Test erfolgreich?": "Ja" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-02-10-2018");
    });

    it("counts all instances when the filter is empty", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${dailyInstanceNumber < 10 ? 0 : ''}${dailyInstanceNumber}-${instanceMonth + 1}-${instanceYear}";
      const filter = "";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { "CAPA notwendig?": "Nein" }),
        createInstance(new Date("October 13, 2018 11:15:00"), { "CAPA notwendig?": "Ja" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-03-10-2018");
    });

    it("throws when the expression is empty", async () => {
      const targetFieldName = "target";
      const expression = "";
      const filter = "field['CAPA notwendig?'] === 'Ja'";

      const instances: IInstanceDetails[] = [createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" })];

      try {
        await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);
        assert.fail("Expected serviceLogic to throw for an empty expression");
      } catch (error) {
        assert.include(String(error), "Expression is empty");
      }
    });

    it("returns zero when the filter matches no instances", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${yearlyInstanceNumber}-${instanceYear}";
      const filter = "field['CAPA notwendig?'] === 'Ja'";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Nein" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { "CAPA notwendig?": "Nein" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-0-2018");
    });

    it("uses totalInstanceNumber with the filter applied", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${totalInstanceNumber}";
      const filter = "field['CAPA notwendig?'] === 'Ja'";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { "CAPA notwendig?": "Nein" }),
        createInstance(new Date("October 13, 2018 11:15:00"), { "CAPA notwendig?": "Ja" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-2");
    });

    it("multi-field filter condition works as expected", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${dailyInstanceNumber < 10 ? 0 : ''}${dailyInstanceNumber}-${instanceMonth + 1}-${instanceYear}";
      const filter = "field['CAPA notwendig?'] === 'Ja' && field['Test erfolgreich?'] === 'Ja'";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja", "Test erfolgreich?": "Ja" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { "CAPA notwendig?": "Ja", "Test erfolgreich?": "Nein" }),
        createInstance(new Date("October 13, 2018 11:15:00"), { "CAPA notwendig?": "Ja", "Test erfolgreich?": "Ja" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-02-10-2018");
    });

    it("returns all potential variables with filter set", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${yearlyInstanceNumber}-${instanceYear}-${monthlyInstanceNumber}-${instanceMonth + 1}-${dailyInstanceNumber}-${instanceDay}";
      const filter = "field['CAPA notwendig?'] === 'Ja'";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { "CAPA notwendig?": "Nein" }),
        createInstance(new Date("October 13, 2018 11:15:00"), { "CAPA notwendig?": "Ja" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-2-2018-2-10-2-13");
    });
  });
});
