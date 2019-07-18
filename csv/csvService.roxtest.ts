// import { assert } from "chai";
// import fs = require("fs");
// import * as PH from "processhub-sdk";
// import { createTestObjects, getTestApiContext, testWorkspace } from "../../test/roxtestobjects";
// import { getFileStore } from "../../server/sfilestore/filestore";
// import { createProcess, getProcessDetails, updateProcess } from "../../server/sprocess/processes";
// import { startWebserver } from "../../server/webserver";
// import { getInstanceDetails } from "../../server/sinstance/instances";
// import { executeInstance } from "../../server/sinstance/engine/engine";

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

//             const testCSVProjectReaderService: PH.Process.ProcessDetails = {
//               description: "This is a test process",
//               displayName: "CSVProjectReader",
//               extras: {},
//               fullUrl: "/@testworkspace/p/CSVProjectReader",
//               previewUrl: undefined,
//               processId: PH.Tools.createId(),
//               processXmlHash: PH.Tools.createId(),
//               urlName: "CSVProjectReader",
//               userRights: PH.Process.ProcessAccessRights.EditProcess,
//               workspaceId: testWorkspace.workspaceId,
//             };

//             before(async () => {
//               testCSVProjectReaderService.workspaceId = testWorkspace.workspaceId;
//               await createProcess(getTestApiContext(), testCSVProjectReaderService);
//               const bpmn: string = fs.readFileSync("./src/test/testfiles/csvprojectreader.bpmn", "utf8");
//               await getFileStore().createFile(testWorkspace.workspaceId, testCSVProjectReaderService.processId, "process.bpmn", bpmn, "private");
//               const process: PH.Process.ProcessDetails = await getProcessDetails(getTestApiContext(),
//                 testCSVProjectReaderService.processId,
//                 PH.Process.ProcessExtras.ExtrasProcessRolesWithMemberNames | PH.Process.ProcessExtras.ExtrasBpmnXml);
//               const bpmnProcess: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
//               await bpmnProcess.loadXml(process.extras.bpmnXml);
//               process.extras.processRoles = PH.Process.getProcessRoles(process.extras.processRoles, bpmnProcess, testWorkspace);
//               await updateProcess(getTestApiContext(), process);
//             });

//             async function performCSVProjectReaderProcessTest(filePath: string, PSP: string): Promise<PH.Instance.InstanceDetails> {
//               const initialFieldContents: PH.Data.FieldContentMap = {
//                 ["PSP"]: {
//                   type: "ProcessHubTextArea",
//                   value: PSP,
//                 }
//               };

//               const instanceId: string = await executeInstance(
//                 getTestApiContext(),
//                 testCSVProjectReaderService.processId,
//                 PH.Tools.createId(),
//                 false,
//                 initialFieldContents);
//               assert(PH.Tools.isId(instanceId));

//               return await getInstanceDetails(getTestApiContext(), instanceId);
//             }

//             it("executes CSV ProjectReader service test_99bac7df-530a-4adb-a1b7-78b5708d11d9", async () => {
//               const instance = await performCSVProjectReaderProcessTest("./src/test/testfiles/Projekte.XLSX/", "D.20.04260");
//               assert.equal(((instance.extras.fieldContents["PSP"] as PH.Data.FieldValue).value as string), "D.20.04260", "wrong PSP");
//               assert.equal(((instance.extras.fieldContents["Bezeichnung"] as PH.Data.FieldValue).value as string), "Bezeichnung 1", "wrong Bezeichnung");
//               assert.equal(((instance.extras.fieldContents["WE"] as PH.Data.FieldValue).value as string), "WE500", "wrong WE");
//               assert.equal(((instance.extras.fieldContents["Kostenstelle"] as PH.Data.FieldValue).value as string), "9433010", "wrong Kostenstelle");
//               assert.equal(((instance.extras.fieldContents["Overheadanteil"] as PH.Data.FieldValue).value as string), "0", "wrong Overheadanteil");
//               assert.isUndefined(instance.extras.fieldContents["Info"] as PH.Data.FieldValue);
//             });

//             it("executes CSV ProjectReader service test_c5da3095-8a57-48b6-942d-b5686c70709b", async () => {
//               const instance = await performCSVProjectReaderProcessTest("./src/test/testfiles/Projekte.XLSX/", "D.20.07154");
//               assert.equal(((instance.extras.fieldContents["PSP"] as PH.Data.FieldValue).value as string), "D.20.07154", "wrong field PSP");
//               assert.equal(((instance.extras.fieldContents["Bezeichnung"] as PH.Data.FieldValue).value as string), "Bezeichnung 5", "wrong field Bezeichnung");
//               assert.equal(((instance.extras.fieldContents["WE"] as PH.Data.FieldValue).value as string), "WE540", "wrong field WE");
//               assert.equal(((instance.extras.fieldContents["Kostenstelle"] as PH.Data.FieldValue).value as string), "9664650", "wrong field Kostenstelle");
//               assert.equal(((instance.extras.fieldContents["Overheadanteil"] as PH.Data.FieldValue).value as string), "2", "wrong field Overheadanteil");
//               assert.isUndefined(instance.extras.fieldContents["Info"] as PH.Data.FieldValue);
//             });

//             it("executes CSV ProjectReader service test_876bfaf7-640d-48f0-bef2-7dbfa7bca8aa", async () => {
//               const instance = await performCSVProjectReaderProcessTest("./src/test/testfiles/Projekte.XLSX/", "D.20.07839");
//               assert.equal(((instance.extras.fieldContents["PSP"] as PH.Data.FieldValue).value as string), "D.20.07839", "wrong field PSP");
//               assert.equal(((instance.extras.fieldContents["Bezeichnung"] as PH.Data.FieldValue).value as string), "Bezeichnung 7", "wrong field Bezeichnung");
//               assert.equal(((instance.extras.fieldContents["WE"] as PH.Data.FieldValue).value as string), "WE560", "wrong field WE");
//               assert.equal(((instance.extras.fieldContents["Kostenstelle"] as PH.Data.FieldValue).value as string), "9780470", "wrong field Kostenstelle");
//               assert.equal(((instance.extras.fieldContents["Overheadanteil"] as PH.Data.FieldValue).value as string), "5", "wrong field Overheadanteil");
//               assert.isUndefined(instance.extras.fieldContents["Info"] as PH.Data.FieldValue);
//             });

//             it("executes CSV ProjectReader service test_f1ae9ac4-8c43-44c7-8a05-1d710e2be70a", async () => {
//               const instance = await performCSVProjectReaderProcessTest("qwert", "D.20.07839");
//               assert.equal(((instance.extras.fieldContents["PSP"] as PH.Data.FieldValue).value as string), "D.20.07839", "wrong field PSP");
//               assert.isUndefined(instance.extras.fieldContents["Bezeichnung"] as PH.Data.FieldValue);
//               assert.isUndefined(instance.extras.fieldContents["WE"] as PH.Data.FieldValue);
//               assert.isUndefined(instance.extras.fieldContents["Kostenstelle"] as PH.Data.FieldValue);
//               assert.isUndefined(instance.extras.fieldContents["Overheadanteil"] as PH.Data.FieldValue);
//               assert.equal(((instance.extras.fieldContents["Info"] as PH.Data.FieldValue).value as string), "Keine Datei mit diesem Pfad gefunden", "wrong field Info");
//             });

//             it("executes CSV ProjectReader service test_8d872c20-d26a-4059-9eea-c2504fbf574b", async () => {
//               const instance = await performCSVProjectReaderProcessTest("./src/test/testfiles/Projekte.XLSX/", "qwert");
//               assert.equal(((instance.extras.fieldContents["PSP"] as PH.Data.FieldValue).value as string), "qwert", "wrong field PSP");
//               assert.isUndefined(instance.extras.fieldContents["Bezeichnung"] as PH.Data.FieldValue);
//               assert.isUndefined(instance.extras.fieldContents["WE"] as PH.Data.FieldValue);
//               assert.isUndefined(instance.extras.fieldContents["Kostenstelle"] as PH.Data.FieldValue);
//               assert.isUndefined(instance.extras.fieldContents["Overheadanteil"] as PH.Data.FieldValue);
//               assert.equal(((instance.extras.fieldContents["Info"] as PH.Data.FieldValue).value as string), "Kein Projekt mit dieser PSP gefunden", "wrong field Info");
//             });
//           });
//         });
//       });
//     });
//   });
// });