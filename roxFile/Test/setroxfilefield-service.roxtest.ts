import { serviceLogicSetroxfilefield, setRoxFileField, setRoxFileFieldConfig } from "../main.js";
import * as fs from "fs";
import { expect } from "chai";
import { ISetFileFieldsObject } from "../roxtrafileapitypes.js";
import { IRoXtraFileApi } from "../iroxtrafileapi.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { IConfig } from "processhub-sdk/lib/serverconfig/iconfig.js";

describe("services", () => {
  describe("roxfile", () => {
    describe("setroxfilefield-service", () => {
      describe("serviceLogic", () => {
        it("sets a rox file field", async () => {
          let bodyFromSetCall: ISetFileFieldsObject[] | undefined;

          const testApi: IRoXtraFileApi = {
            createRoxFileCall: () => {
              // Do nothing
              return Promise.resolve({ Fields: [] });
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
          const environment: IServiceTaskEnvironment = createEmptyTestServiceEnvironment(fs.readFileSync("./Test/Testfiles/setroxfilefield-service.bpmn", "utf8"));
          environment.bpmnTaskName = "SetFields";
          environment.bpmnTaskId = "ServiceTask_6FAF8F7973EF56FA";
          environment.instanceDetails.extras.fieldContents = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Feld_1: {
              type: "ProcessHubTextInput",
              value: "Hello",
            },
          };
          environment.roxApi.getApiToken = () => "";
          environment.serverConfig = {
            roXtra: {
              efApiEndpoint: undefined,
              url: undefined,
              clientSecret: undefined,
            },
          } as unknown as IConfig;
          await serviceLogicSetroxfilefield(environment, testApi);
          // Make sure setFileFieldsCall was called with the right values
          expect(bodyFromSetCall?.length).to.equal(1);
          expect(bodyFromSetCall?.[0].Id).to.equal("roXtraFeld");
          expect(bodyFromSetCall?.[0].Value).to.equal("Hello");
        });
      });

      describe("bundle test", () => {
        it("should check for bundled methods", () => {
          expect(typeof setRoxFileField).to.equal("function");
          expect(typeof setRoxFileFieldConfig).to.equal("function");
        });
      });
    });
  });
});
