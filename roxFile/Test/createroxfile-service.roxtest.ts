import * as fs from "fs";
import { expect } from "chai";
import { IRoXtraFileApi } from "../iroxtrafileapi";
import { ICreateFileRequestBody } from "../roxtrafileapitypes";
import { serviceLogicCreateroxfile, createRoxFile, createRoxFileConfig } from "../main";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools";

describe("services", () => {
  describe("roxfile", () => {
    describe("createroxfile-service", () => {
      describe("serviceLogic", () => {
        it("creates a roxFile", async () => {
          const newRoxFileId = "1000";

          const testApi: IRoXtraFileApi = {
            setFileFieldsCall: async () => {
              // Do nothing
            },
            getFileDetailsCall: () => {
              return Promise.resolve({ Fields: [] });
            },
            // eslint-disable-next-line @typescript-eslint/require-await
            getSelectionsCall: async () => [],
            // eslint-disable-next-line @typescript-eslint/require-await
            createRoxFileCall: async (apiUrl: string, body: ICreateFileRequestBody) => {
              expect(body.DestinationID).to.equal("100");
              expect(body.DestinationType).to.equal("1");
              expect(body.DocTypeID).to.equal("105");
              expect(body.FileData.Filename).to.equal("Das ist ein Titel.docx");
              expect(body.FileData.Base64EncodedData.length).to.be.greaterThan(0);
              return {
                Fields: [{ Value: newRoxFileId }],
              };
            },
          };
          const environment: IServiceTaskEnvironment = createEmptyTestServiceEnvironment(fs.readFileSync("./Test/Testfiles/createroxfile-service.bpmn", "utf8"));
          environment.bpmnTaskName = "createroxfile";
          environment.bpmnTaskId = "ServiceTask_712C1B34834A21B9";

          environment.fileStore.getPhysicalPath = () => {
            return "./Test/Testfiles/doc.docx";
          };

          environment.roxApi.getApiToken = () => "";
          environment.instanceDetails.extras.fieldContents = {
            Anlagen: {
              type: "ProcessHubFileUpload",
              value: ["http://localhost:1080/modules/files/ZG9jLmRvY3g"],
            },
            Titel: {
              type: "ProcessHubTextInput",
              value: "Das ist ein Titel",
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Feld_1: {
              type: "ProcessHubTextInput",
              value: "Beschreibung",
            },
          };

          const instance = await serviceLogicCreateroxfile(environment, testApi);
          expect(instance.extras.fieldContents?.["CreatedRoxFileId"]).not.to.be.undefined;
          expect((instance.extras.fieldContents?.["CreatedRoxFileId"] as IFieldValue).value).to.equal(newRoxFileId);
        });
      });

      describe("bundle test", () => {
        it("should check for bundled methods", () => {
          expect(typeof createRoxFile).to.equal("function");
          expect(typeof createRoxFileConfig).to.equal("function");
        });
      });
    });
  });
});
