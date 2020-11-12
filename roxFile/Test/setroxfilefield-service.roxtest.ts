import { serviceLogic, errorState } from "../setroxfilefield-service";
import * as PH from "processhub-sdk";
import * as fs from "fs";
import { expect } from "chai";
import { ERRORCODES, ISetFileFieldsObject } from "../roxtrafileapitypes";
import { IRoXtraFileApi } from "../iroxtrafileapi";

describe("services", () => {
  describe("roxfile", () => {
    describe("setroxfilefield-service", () => {
      describe("serviceLogic", () => {
        it("sets a rox file field", async () => {
          let bodyFromSetCall: ISetFileFieldsObject[] | undefined;

          const testApi: IRoXtraFileApi = {
            createRoxFileCall: async () => {
              // Do nothing
            },
            // eslint-disable-next-line @typescript-eslint/require-await
            setFileFieldsCall: async (url, body) => {
              bodyFromSetCall = body;
            },
            // eslint-disable-next-line @typescript-eslint/require-await
            getFileDetailsCall: async () => {
              return {
                Fields: [
                  {
                    FieldCaption: "roXtraFeld",
                    Id: "roXtraFeld",
                    IsWFWritable: true,
                    IsWritable: true,
                    RoxFieldType: 0,
                    RoxSelection: "",
                    RoxType: "date",
                    Value: "2016-04-21T10:28:30",
                    ValueIds: null,
                  },
                  {
                    FieldCaption: "roXtraFeld",
                    Id: "roXtraFeld",
                    IsWFWritable: true,
                    IsWritable: true,
                    RoxFieldType: 0,
                    RoxSelection: "",
                    RoxType: "date",
                    Value: "2016-04-21T10:28:30",
                    ValueIds: null,
                  },
                ],
              };
            },
            // eslint-disable-next-line @typescript-eslint/require-await
            getSelectionsCall: async () => {
              return [
                {
                  Id: "roXtraFeld",
                  SelectionCaption: "roXtraFeld",
                  SelectionType: 0,
                  SelectionsList: [],
                  SimpleSelectionsList: [],
                  TreeSelectionsList: [],
                },
              ];
            },
          };
          const environment: PH.ServiceTask.IServiceTaskEnvironment = PH.Test.createEmptyTestServiceEnvironment(
            fs.readFileSync("./Test/Testfiles/setroxfilefield-service.bpmn", "utf8"),
          );
          environment.bpmnTaskName = "SetFields";
          environment.bpmnTaskId = "ServiceTask_6FAF8F7973EF56FA";
          environment.fieldContents = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Feld_1: {
              type: "ProcessHubTextInput",
              value: "Hello",
            },
          };
          environment.instanceDetails.extras.fieldContents = environment.fieldContents;
          environment.roxApi.getApiToken = () => "";
          environment.serverConfig = {
            roXtra: {
              efApiEndpoint: undefined,
              url: undefined,
              clientSecret: undefined,
            },
          } as any;
          expect(errorState).to.equal(ERRORCODES.NOERROR);
          await serviceLogic(environment, testApi);
          expect(errorState).to.equal(ERRORCODES.NOERROR);
          // Make sure setFileFieldsCall was called with the right values
          expect(bodyFromSetCall?.length).to.equal(1);
          expect(bodyFromSetCall?.[0].Id).to.equal("roXtraFeld");
          expect(bodyFromSetCall?.[0].Value).to.equal("Hello");
        });
      });
    });
  });
});
