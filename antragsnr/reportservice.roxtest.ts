
import * as PH from "processhub-sdk";
import * as Antragsnr from "./antragsnr-service";
import * as fs from "fs";
import { assert } from "chai";

describe("services", () => {
    describe("servicetemplate", () => {

        // create a mock service environment
        function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string): PH.ServiceTask.ServiceTaskEnvironment {
            let env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
            env.bpmnTaskId = bpmnTaskId;
            env.fieldContents = {};
            env.instanceDetails.extras.fieldContents = env.fieldContents;
            env.instanceDetails.createdAt = new Date("October 13, 2018 11:13:00");
            return env;
        }

        async function performAntragsnrTest(bpmnXmlPath: string, bpmnTaskId: string, instances: PH.Instance.InstanceDetails[], tragetField: string): Promise<PH.ServiceTask.ServiceTaskEnvironment> {
            let env = createEnvironment(bpmnXmlPath, bpmnTaskId);
            let processDetails: PH.Process.ProcessDetails = {
                processId: "",
                workspaceId: "",
                displayName: "",
                description: "",
                extras: { instances: instances },
            }

            await Antragsnr.serviceLogic(processDetails, env, tragetField);

            return env;
        }

        it("execute antragsnr service test_8fd1ba08-f8a1-4caa-b685-27b3ee946038", async () => {
            let targetFieldName = "target";

            const instances: PH.Instance.InstanceDetails[] = [
                // current instance
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 13, 2018 11:13:00"),
                },

                // older instances
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 13, 2014 11:13:00"),
                },
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 13, 2015 11:13:00"),
                }
            ];

            let env = await performAntragsnrTest("./antragsnr/testfiles/antragsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName);

            assert.equal(((env.fieldContents[targetFieldName] as PH.Data.FieldValue).value as string), "2018/01");
        });

        it("execute antragsnr service test_8fd1ba08-f8a1-4caa-b685-27b3ee946038", async () => {
            let targetFieldName = "target";

            const instances: PH.Instance.InstanceDetails[] = [
                // current instance
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 13, 2018 11:13:00"),
                },

                // older instances
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 12, 2018 11:13:00"),
                },
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 13, 2015 11:13:00"),
                }
            ];

            let env = await performAntragsnrTest("./antragsnr/testfiles/antragsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName);

            assert.equal(((env.fieldContents[targetFieldName] as PH.Data.FieldValue).value as string), "2018/02");
        });

        it("execute antragsnr service test_8fd1ba08-f8a1-4caa-b685-27b3ee946038", async () => {
            let targetFieldName = "target";

            const instances: PH.Instance.InstanceDetails[] = [
                // current instance
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 13, 2018 11:13:00"),
                },

                // older instances
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 12, 2018 11:13:00"),
                },
                {
                    instanceId: "",
                    workspaceId: "",
                    processId: "",
                    extras: {
                        instanceState: null
                    },
                    createdAt: new Date("October 11, 2018 11:13:00"),
                }
            ];

            let env = await performAntragsnrTest("./antragsnr/testfiles/antragsnr-test-process.bpmn", "ServiceTask_508AF9C8EEE3A181", instances, targetFieldName);

            assert.equal(((env.fieldContents[targetFieldName] as PH.Data.FieldValue).value as string), "2018/03");
        });
    });
});