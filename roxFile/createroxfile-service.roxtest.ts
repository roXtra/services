import * as PH from "processhub-sdk";
import * as fs from "fs";
import { expect } from "chai";
import { IRoXtraFileApi } from "./iroxtrafileapi";
import { ICreateFileRequestBody } from "./roxtrafileapitypes";
import { serviceLogic } from "./createroxfile-service";

describe("services", () => {
  describe("roxfile", () => {
    describe("createroxfile-service", () => {

      describe("serviceLogic", () => {
        it("creates a roxFile", async () => {
          const newRoxFileId = "1000";

          const testApi: IRoXtraFileApi = {
            setFileFieldsCall: async () => { },
            getFileDetailsCall: async () => { },
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
            fs.readFileSync("./testfiles/createroxfile-service.bpmn", "utf8")
          );
          environment.bpmnTaskName = "createroxfile";
          environment.bpmnTaskId = "ServiceTask_712C1B34834A21B9";
          environment.fieldContents = {
            "Anlagen": {
              type: "ProcessHubFileUpload",
              value: ["http://localhost/eformulare/files/doc.docx"],
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
          environment.fileStore = {} as PH.FileStore.IFileStore;
          // eslint-disable-next-line @typescript-eslint/unbound-method
          environment.fileStore.getPhysicalPath = () => "./testfiles/doc.docx";
          const instance = await serviceLogic(environment, testApi);
          expect(PH.Data.isFieldValue(instance.extras.fieldContents["CreatedRoxFileId"])).to.equal(true);
          expect((instance.extras.fieldContents["CreatedRoxFileId"] as PH.Data.IFieldValue).value).to.equal(newRoxFileId);
        });
      });

    });
  });
});