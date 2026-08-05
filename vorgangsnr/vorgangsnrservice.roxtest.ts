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

    // Variant that allows setting the current instance's createdAt date on the environment
    async function performVorgangsNrTestWithEnvDate(
      bpmnXmlPath: string,
      bpmnTaskId: string,
      instances: IInstanceDetails[],
      targetField: string,
      expression: string,
      envDate: Date,
      filter?: string,
    ): Promise<IServiceTaskEnvironment> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId);
      env.instances.getAllInstancesForProcess = () => Promise.resolve(instances);
      env.instanceDetails.createdAt = envDate;
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

    it("treats missing fields as undefined in filters", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${totalInstanceNumber}";
      const filter = "field['MissingField'] === undefined";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { Other: "x" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { MissingField: "value" }),
        createInstance(new Date("October 13, 2018 11:15:00"), { Other: "y" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      // Only two instances have MissingField === undefined
      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-2");
    });

    it("throws FILTER_ERROR for invalid filter syntax", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${totalInstanceNumber}";
      // Intentionally broken filter
      const filter = "field['CAPA notwendig?'] ===";

      const instances: IInstanceDetails[] = [createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" })];

      try {
        await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);
        assert.fail("Expected FILTER_ERROR to be thrown");
      } catch (err) {
        assert.include(String(err), "FILTER_ERROR");
      }
    });

    it("handles month/year boundary correctly", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${monthlyInstanceNumber}-${instanceMonth + 1}-${instanceYear}";
      const filter = "";

      const instances: IInstanceDetails[] = [
        // One from Dec 31, 2018
        createInstance(new Date("December 31, 2018 23:59:00"), { "CAPA notwendig?": "Ja" }),
        // One from Jan 1, 2019
        createInstance(new Date("January 1, 2019 00:01:00"), { "CAPA notwendig?": "Ja" }),
        // Another from Jan 1, 2019
        createInstance(new Date("January 1, 2019 12:00:00"), { "CAPA notwendig?": "Ja" }),
      ];

      // Set environment date to Jan 1, 2019 so instanceMonth/instanceYear are Jan 2019
      const env = await performVorgangsNrTestWithEnvDate(
        "./testfiles/vorgangsnr-test-process.bpmn",
        "ServiceTask_508AF9C8EEE3A181",
        instances,
        targetFieldName,
        expression,
        new Date("January 1, 2019 12:00:00"),
        filter,
      );

      // Only two instances are in January 2019
      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "CAPA-2-1-2019");
    });

    it("supports numeric and boolean filters", async () => {
      const targetFieldName = "target";
      const expression = "COUNT-${totalInstanceNumber}";
      const filter = "field['Amount'] > 10 && field['Flag']['Test'] === true";

      const instances: IInstanceDetails[] = [
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
            fieldContents: { Amount: { type: "ProcessHubNumber", value: 5 }, Flag: { type: "ProcessHubChecklist", value: { Test: false } } },
          },
          createdAt: new Date("October 13, 2018 11:13:00"),
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
            fieldContents: { Amount: { type: "ProcessHubNumber", value: 15 }, Flag: { type: "ProcessHubChecklist", value: { Test: true } } },
          },
          createdAt: new Date("October 13, 2018 11:14:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "COUNT-1");
    });

    it("returns numeric expression results as strings", async () => {
      const targetFieldName = "target";
      const expression = "${dailyInstanceNumber}";
      const filter = "";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { A: "x" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { A: "y" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "2");
    });

    it("handles field names with special characters", async () => {
      const targetFieldName = "target";
      const expression = "FOUND-${totalInstanceNumber}";
      const filter = "field['Name.with[chars]*'] === 'Yes'";

      const instances: IInstanceDetails[] = [
        createInstance(new Date("October 13, 2018 11:13:00"), { "Name.with[chars]*": "Yes" }),
        createInstance(new Date("October 13, 2018 11:14:00"), { "Name.with[chars]*": "No" }),
      ];

      const env = await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "FOUND-1");
    });

    it("reports errors for invalid expression calls", async () => {
      const targetFieldName = "target";
      const expression = "ERR-${nonExistingFunction()}";
      const filter = "";

      const instances: IInstanceDetails[] = [createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" })];

      try {
        await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);
        assert.fail("Expected expression evaluation error");
      } catch (err) {
        assert.include(String(err), "Unable to resolve expression placeholder");
      }
    });

    it("throws when placeholder references no allowed variables", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${1+1}"; // Does not reference any allowed variable
      const filter = "";

      const instances: IInstanceDetails[] = [createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" })];

      try {
        await performVorgangsNrTest("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName, expression, filter);
        assert.fail("Expected variable-reference error to be thrown");
      } catch (err) {
        assert.include(String(err), "Expression placeholder must reference at least one of:");
        assert.include(String(err), "dailyInstanceNumber");
      }
    });

    it("prevents filters from modifying instanceDetails", async () => {
      const targetFieldName = "target";
      const expression = "CAPA-${totalInstanceNumber}";
      // Filter tries to mutate the environment (should not be allowed)
      const filter = "instanceDetails.extras.fieldContents['target'] = 'HACK'; true";

      const instances: IInstanceDetails[] = [createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" })];

      const env = createEnvironment("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181");
      env.instances.getAllInstancesForProcess = () => Promise.resolve(instances);

      try {
        await serviceLogic(
          { processId: "", workspaceId: "", displayName: "", description: "", extras: { instances: [] }, type: "backend" },
          env,
          targetFieldName,
          expression,
          filter,
        );
        assert.fail("Expected FILTER_ERROR to be thrown when filter attempts mutation");
      } catch (err) {
        assert.include(String(err), "FILTER_ERROR");
        // Ensure target was not added/modified on the environment
        assert.isUndefined(env.instanceDetails.extras.fieldContents![targetFieldName]);
      }
    });

    it("prevents expressions from modifying instanceDetails", async () => {
      const targetFieldName = "target";
      // Expression tries to mutate the environment via instanceDetails (should throw)
      const expression = "CAPA-${(instanceDetails.extras.fieldContents['target'] = 'HACK', totalInstanceNumber)}";
      const filter = "";

      const instances: IInstanceDetails[] = [createInstance(new Date("October 13, 2018 11:13:00"), { "CAPA notwendig?": "Ja" })];

      const env = createEnvironment("./testfiles/vorgangsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181");
      env.instances.getAllInstancesForProcess = () => Promise.resolve(instances);

      try {
        await serviceLogic(
          { processId: "", workspaceId: "", displayName: "", description: "", extras: { instances: [] }, type: "backend" },
          env,
          targetFieldName,
          expression,
          filter,
        );
        assert.fail("Expected expression placeholder resolution to throw when trying to mutate environment");
      } catch (err) {
        assert.include(String(err), "Unable to resolve expression placeholder");
        // Ensure target was not added/modified on the environment
        assert.isUndefined(env.instanceDetails.extras.fieldContents![targetFieldName]);
      }
    });
  });
});
