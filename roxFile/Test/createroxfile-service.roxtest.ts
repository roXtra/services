import * as PH from "processhub-sdk";
import * as fs from "fs";
import { expect } from "chai";
import { IRoXtraFileApi } from "../iroxtrafileapi";
import { ICreateFileRequestBody } from "../roxtrafileapitypes";
import { serviceLogic } from "../createroxfile-service";
import { MockServer } from "./mockServer";

describe("services", () => {
  describe("roxfile", () => {
    describe("createroxfile-service", () => {
      describe("serviceLogic", () => {

        before(async function () {
          await MockServer.initMockServer();
        });

        after(async function () {
          await MockServer.stopMockServer();
        });

        it("creates a roxFile", async () => {
          const newRoxFileId = "1000";

          const testApi: IRoXtraFileApi = {
            setFileFieldsCall: async () => {
              // Do nothing
            },
            getFileDetailsCall: async () => {
              // Do nothing
            },
            // eslint-disable-next-line @typescript-eslint/require-await
            getSelectionsCall: async () => [],
            // eslint-disable-next-line @typescript-eslint/require-await
            createRoxFileCall: async (APIUrl: string, body: ICreateFileRequestBody) => {
              expect(body.DestinationID).to.equal("100");
              expect(body.DestinationType).to.equal("1");
              expect(body.DocTypeID).to.equal("105");
              expect(body.FileData.Filename).to.equal("Das ist ein Titel.docx");
              expect(body.FileData.Base64EncodedData.length).to.be.greaterThan(0);
              return {
                Fields: [{ Value: newRoxFileId }]
              };
            }
          };
          const environment: PH.ServiceTask.IServiceTaskEnvironment = PH.Test.createEmptyTestServiceEnvironment(
            fs.readFileSync("./Test/Testfiles/createroxfile-service.bpmn", "utf8")
          );
          environment.bpmnTaskName = "createroxfile";
          environment.bpmnTaskId = "ServiceTask_712C1B34834A21B9";
          environment.fieldContents = {
            "Anlagen": {
              type: "ProcessHubFileUpload",
              value: ["http://localhost:1080/modules/files/doc.docx"],
            },
            "Titel": {
              type: "ProcessHubTextInput",
              value: "Das ist ein Titel",
            },
            "Feld_1": {
              type: "ProcessHubTextInput",
              value: "Beschreibung",
            }
          };
          environment.instanceDetails.extras.fieldContents = environment.fieldContents;

          const instance = await serviceLogic(environment, testApi);
          expect(PH.Data.isFieldValue(instance.extras.fieldContents["CreatedRoxFileId"])).to.equal(true);
          expect((instance.extras.fieldContents["CreatedRoxFileId"] as PH.Data.IFieldValue).value).to.equal(newRoxFileId);
        });
      });

    });
  });
});