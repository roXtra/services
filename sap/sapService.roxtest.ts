// Import { assert } from "chai";
// import * as fs from "fs";
// import * as PH from "processhub-sdk.js";
// import { createTestObjects, getTestApiContext, testWorkspace } from "../../test/roxtestobjects.js";
// import { getFileStore } from "../../server/sfilestore/filestore.js";
// import { createProcess, getProcessDetails, updateProcess } from "../../server/sprocess/processes.js";
// import { startWebserver } from "../../server/webserver.js";
// import { getInstanceDetails } from "../../server/sinstance/instances.js";
// import { executeInstance } from "../../server/sinstance/engine/engine.js";
// import Methods from "./sapServiceMethods.js";

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

//             const testMathService: ProcessDetails = {
//               description: "This is a test process",
//               displayName: "math-service",
//               extras: {},
//               fullUrl: "/@testworkspace/p/math-service",
//               previewUrl: undefined,
//               processId: PH.Tools.createId(),
//               processXmlHash: PH.Tools.createId(),
//               urlName: "math-service",
//               userRights: ProcessAccessRights.EditProcess,
//               workspaceId: testWorkspace.workspaceId,
//             };

//             before(async () => {
//               testMathService.workspaceId = testWorkspace.workspaceId;
//               await createProcess(getTestApiContext(), testMathService);
//               const bpmn: string = fs.readFileSync("./src/test/testfiles/math-service.bpmn", "utf8");
//               await getFileStore().createFile(testWorkspace.workspaceId, testMathService.processId, "process.bpmn", bpmn, "private");
//               const process: ProcessDetails = await getProcessDetails(getTestApiContext(),
//                 testMathService.processId,
//                 ProcessExtras.ExtrasProcessRolesWithMemberNames | ProcessExtras.ExtrasBpmnXml);
//               const bpmnProcess: BpmnProcess = new BpmnProcess();
//               await bpmnProcess.loadXml(process.extras.bpmnXml);
//               process.extras.processRoles = getProcessRoles(process.extras.processRoles, bpmnProcess, testWorkspace);
//               await updateProcess(getTestApiContext(), process);
//             });

//             async function performSAPProcessTest(rows: any, targetFieldName1: string, targetFieldName2: string) {
//               let newValue: IFieldValue = {
//                 value: "",
//                 type: "ProcessHubTextArea"
//               };

//               const instanceId: string = await executeInstance(
//                 getTestApiContext(),
//                 testMathService.processId,
//                 PH.Tools.createId(),
//                 false,
//                 {});
//               assert(PH.Tools.isId(instanceId));

//               let instance = await getInstanceDetails(getTestApiContext(), instanceId);

//               await Methods.serviceOutputLogic(rows, newValue, getTestApiContext().user.extras.accessToken, instance, targetFieldName1, targetFieldName2);

//               // test results
//               const keys = Object.keys(instance.extras.fieldContents);

//               assert.equal(keys[0], targetFieldName1);
//               assert.equal(keys[1], targetFieldName2);
//               assert((instance.extras.fieldContents[targetFieldName2] as IFieldValue).value.toString().endsWith("results.csv"));
//               assert.equal((instance.extras.fieldContents[targetFieldName1] as IFieldValue).value.toString(), generateTable(rows));
//             }

//             function generateTable(rows: any): string {
//               const keys = Object.keys(rows[0]);
//               let table = "<table><tr>";
//               keys.forEach((key: any) => {
//                 table += "<th>" + key + "</th>";
//               });
//               table += "</tr>";
//               rows.forEach((row: any) => {
//                 table += "<tr>";
//                 keys.forEach(key => {
//                   table += "<th>" + row[key] + "</th>";
//                 });
//                 table += "</tr>";
//               });
//               return table += "</table>";
//             }

//             // Addition Tests
//             it("executes SAP Service Logic_21536499-bad6-40f9-a893-fae8eb822bb0", async () => {
//               await performSAPProcessTest([{ name: "Peanut", group: "Nuts", subgroup: "Nuts" },
//               { name: "Common beet", group: "Vegetables", subgroup: "Leaf vegetables" },
//               { name: "Pineapple", group: "Fruits", subgroup: "Tropical fruits" },
//               { name: "Brazil nut", group: "Nuts", subgroup: "Nuts" }], "Ergebnis", "CSV");
//             });
//           });
//         });
//       });
//     });
//   });
// });
