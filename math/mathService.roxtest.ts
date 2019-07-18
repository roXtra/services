// import { assert } from "chai";
// import fs = require("fs");
// import * as PH from "processhub-sdk";
// import { createTestObjects, getTestApiContext, testWorkspace } from "../../test/roxtestobjects";
// import { getFileStore } from "../../server/sfilestore/filestore";
// import { createProcess, getProcessDetails, updateProcess } from "../../server/sprocess/processes";
// import { startWebserver } from "../../server/webserver";
// import { getInstanceDetails } from "../../server/sinstance/instances";
// import { executeInstance, resumeInstance } from "../../server/sinstance/engine/engine";
// import { getTodosForInstance } from "../../server/stodo/todos";

// describe("server", () => {
//   before(async () => {
//     await createTestObjects();
//     await startWebserver(true);
//   });

//   describe("sinstance", () => {
//     describe("engine", () => {
//       describe("shapes", () => {
//         describe("tasks", () => {
//           describe("servicetask", () => {

//             const testMathService: PH.Process.ProcessDetails = {
//               description: "This is a test process",
//               displayName: "math-service",
//               extras: {},
//               fullUrl: "/@testworkspace/p/math-service",
//               previewUrl: undefined,
//               processId: PH.Tools.createId(),
//               processXmlHash: PH.Tools.createId(),
//               urlName: "math-service",
//               userRights: PH.Process.ProcessAccessRights.EditProcess,
//               workspaceId: testWorkspace.workspaceId,
//             };

//             before(async () => {
//               testMathService.workspaceId = testWorkspace.workspaceId;
//               await createProcess(getTestApiContext(), testMathService);
//               const bpmn: string = fs.readFileSync("./src/test/testfiles/math-service.bpmn", "utf8");
//               await getFileStore().createFile(testWorkspace.workspaceId, testMathService.processId, "process.bpmn", bpmn, "private");
//               const process: PH.Process.ProcessDetails = await getProcessDetails(getTestApiContext(),
//                 testMathService.processId,
//                 PH.Process.ProcessExtras.ExtrasProcessRolesWithMemberNames | PH.Process.ProcessExtras.ExtrasBpmnXml);
//               const bpmnProcess: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
//               await bpmnProcess.loadXml(process.extras.bpmnXml);
//               process.extras.processRoles = PH.Process.getProcessRoles(process.extras.processRoles, bpmnProcess, testWorkspace);
//               await updateProcess(getTestApiContext(), process);
//             });

//             async function performMathProcessTest(fieldInput1: number, fieldInput2: number, result: number, operator: number) {
//               const initialFieldContents: PH.Data.FieldContentMap = {
//                 ["Feld_1"]: {
//                   type: "ProcessHubNumber",
//                   value: fieldInput1,
//                 },
//                 ["Feld_2"]: {
//                   type: "ProcessHubNumber",
//                   value: fieldInput2,
//                 }
//               };

//               const instanceId: string = await executeInstance(
//                 getTestApiContext(),
//                 testMathService.processId,
//                 PH.Tools.createId(),
//                 false,
//                 initialFieldContents);
//               assert(PH.Tools.isId(instanceId));

//               let todos = await getTodosForInstance(getTestApiContext(), testWorkspace.workspaceId, instanceId);
//               assert(todos.length === 1);

//               let process = await getProcessDetails(getTestApiContext(), testMathService.processId, PH.Process.ProcessExtras.ExtrasBpmnXml);
//               let bpmnProcess = new PH.Process.BpmnProcess();
//               await bpmnProcess.loadXml(process.extras.bpmnXml);
//               let decisionTasks: PH.Todo.DecisionTask[] = bpmnProcess.getDecisionTasksForTask(todos.last().bpmnTaskId);

//               assert(todos.length === 1);
//               assert(decisionTasks != null);
//               assert(decisionTasks.length > 1);

//               let instanceId2 = await resumeInstance(getTestApiContext(), { completedTodoId: todos[0].todoId, choosenTask: decisionTasks[operator], instanceId: instanceId } as PH.Instance.ResumeInstanceDetails);

//               let instanceAfterResume = await getInstanceDetails(getTestApiContext(), instanceId2, true, PH.Instance.InstanceExtras.ExtrasFieldContents);

//               assert.closeTo((instanceAfterResume.extras.fieldContents["Ergebnis"] as PH.Data.FieldValue).value as number, result, 0.0001);
//             }

//             // Addition Tests
//             it("executes addition_0e3de84d-416f-4a32-ae16-eecea2953ef2", async () => {
//               await performMathProcessTest(1, 2, 3, 0);
//             });
            
//             it("executes addition with zero_2cb121a6-dea2-4109-b874-5f29aac15707", async () => {
//               await performMathProcessTest(1, 0, 1, 0);
//             });

//             it("executes addition with negative numbers_f39ae5b6-1539-41af-bdaa-b4eb0add2353", async () => {
//               await performMathProcessTest(-1, -2, -3, 0);
//             });

//             it("executes addition with rational numbers_446e7b15-cc6a-42f8-8fd4-3de2fa0f5777", async () => {
//               await performMathProcessTest(1.5, 2.3, 3.8, 0);
//             });

//             // Substraktion Tests
//             it("executes subtraktion with positiv result_e2c1b147-709a-4428-8980-627a8fe12a0f", async () => {
//               await performMathProcessTest(3, 2, 1, 1);
//             });

//             it("executes subtraktion with negative result_b703c6b9-7a6f-4289-80a7-54b6d658d043", async () => {
//               await performMathProcessTest(2, 3, -1, 1);
//             });

//             it("executes subtraktion with zero result_658c2969-4a58-4e87-ba63-17571dafec57", async () => {
//               await performMathProcessTest(3, 3, 0, 1);
//             });

//             it("executes subtraktion with zero_0123af2a-0327-4166-9d26-566c66441823", async () => {
//               await performMathProcessTest(3, 0, 3, 1);
//             });

//             it("executes subtraktion with negative numbers_d6b02308-d1ea-4dce-b1a3-59bd1c82317a", async () => {
//               await performMathProcessTest(-3, -2, -1, 1);
//             });

//             it("executes subtraktion with rational numbers_1c29a0b4-07fb-4349-9fb5-9cfaafd016ee", async () => {
//               await performMathProcessTest(3.5, 2.3, 1.2, 1);
//             });

//             // Multiplikation Tests
//             it("executes multiplikation with positive numbers_d95dbbeb-1205-4097-ab26-c1f493b56f62", async () => {
//               await performMathProcessTest(2, 3, 6, 2);
//             });

//             it("executes multiplikation with negative numbers_bbe7b362-711a-49ba-80a3-e6805fe27874", async () => {
//               await performMathProcessTest(-2, -3, 6, 2);
//             });

//             it("executes multiplikation with negative and postive numbers_b8bbf4d1-6db5-40fe-b595-d1eb4276c3e2", async () => {
//               await performMathProcessTest(-2, 3, -6, 2);
//             });

//             it("executes multiplikation with zero_67e3d265-c943-45aa-b82b-8c278871db36", async () => {
//               await performMathProcessTest(0, 3, 0, 2);
//             });

//             it("executes multiplikation with rational numbers_4a1148b5-e083-4403-a0ac-8a68d5447dde", async () => {
//               await performMathProcessTest(2.5, 3, 7.5, 2);
//             });

//             // Division Tests
//             it("executes division with whole result_9d68f60b-fa04-414f-90e3-059a0b5d696e", async () => {
//               await performMathProcessTest(6, 2, 3, 3);
//             });

//             it("executes division with rational result_5b45e1af-e7df-4e21-8ced-9afd4f5de7e5", async () => {
//               await performMathProcessTest(1, 2, 0.5, 3);
//             });

//             it("executes division with zero as result_73f864d8-4836-4358-8228-1ed4783bbf24", async () => {
//               await performMathProcessTest(0, 2, 0, 3);
//             });

//             it("executes division with negative number_2b88f895-7f96-42ca-9d07-9bc6e785ca63", async () => {
//               await performMathProcessTest(-1, 2, -0.5, 3);
//             });

//             it("executes division with negative numbers_a12cd727-1d36-45aa-84b3-6511d4c94172", async () => {
//               await performMathProcessTest(-1, -2, 0.5, 3);
//             });

//             it("executes division with rational numbers_68f27e3f-1721-4fd2-9885-7bc713312a4f", async () => {
//               await performMathProcessTest(2.5, 2, 1.25, 3);
//             });
//           });
//         });
//       });
//     });
//   });
// });