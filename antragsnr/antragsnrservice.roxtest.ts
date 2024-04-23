/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as fs from "fs";
import { assert } from "chai";
import { serviceLogic } from "./main.js";
import { IProcessDetails } from "processhub-sdk/lib/process/processinterfaces.js";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";

describe("services", () => {
  describe("servicetemplate", () => {
    // Create a mock service environment
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string): IServiceTaskEnvironment {
      const env = createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.instanceDetails.extras.fieldContents = {};
      env.instanceDetails.createdAt = new Date("October 13, 2018 11:13:00");
      return env;
    }

    function performAntragsnrTest(bpmnXmlPath: string, bpmnTaskId: string, instances: IInstanceDetails[], tragetField: string): IServiceTaskEnvironment {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId);
      const processDetails: IProcessDetails = {
        processId: "",
        workspaceId: "",
        displayName: "",
        description: "",
        extras: { instances: instances },
        type: "backend",
      };

      serviceLogic(processDetails, env, tragetField);

      return env;
    }

    it("execute antragsnr service test_8fd1ba08-f8a1-4caa-b685-27b3ee946038", () => {
      const targetFieldName = "target";

      const instances: IInstanceDetails[] = [
        // Current instance
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
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
          },
          createdAt: new Date("October 13, 2014 11:13:00"),
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
          },
          createdAt: new Date("October 13, 2015 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
      ];

      const env = performAntragsnrTest("./testfiles/antragsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "2018/01");
    });

    it("execute antragsnr service test_8fd1ba08-f8a1-4caa-b685-27b3ee946038", () => {
      const targetFieldName = "target";

      const instances: IInstanceDetails[] = [
        // Current instance
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
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
          },
          createdAt: new Date("October 13, 2015 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
      ];

      const env = performAntragsnrTest("./testfiles/antragsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "2018/02");
    });

    it("execute antragsnr service test_8fd1ba08-f8a1-4caa-b685-27b3ee946038", () => {
      const targetFieldName = "target";

      const instances: IInstanceDetails[] = [
        // Current instance
        {
          title: "",
          instanceId: "",
          workspaceId: "",
          processId: "",
          extras: {
            instanceState: undefined,
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
          },
          createdAt: new Date("October 11, 2018 11:13:00"),
          takenStartEvent: "",
          reachedEndEvents: [],
        },
      ];

      const env = performAntragsnrTest("./testfiles/antragsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName);

      assert.equal((env.instanceDetails.extras.fieldContents![targetFieldName] as IFieldValue).value as string, "2018/03");
    });
  });
});
