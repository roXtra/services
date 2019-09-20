import { setRoxFileField, serviceLogic, errorState } from "./setRoxFileField-service";
import * as PH from "processhub-sdk";
import * as fs from "fs";
import { expect } from "chai";
import { ERRORCODES, SetFileFieldsObject } from "./roxtraFileAPITypes";
import { IRoXtraFileApi } from "./iroxtrafileapi";

describe("services", () => {
  describe("roxfile", () => {
    describe("setroxfilefield-service", () => {

      describe("serviceLogic", () => {

        it("sets a rox file field", async () => {
          let bodyFromSetCall: SetFileFieldsObject[];

          const testApi: IRoXtraFileApi = {
            setFileFieldsCall: async (_url, body, _fileId, _efToken, _token) => {
              bodyFromSetCall = body;
            },
            getFileDetailsCall: async () => {
              return {
                "Fields": [
                  {
                    "FieldCaption": "roXtraFeld",
                    "Id": "roXtraFeld",
                    "IsWFWritable": true,
                    "IsWritable": true,
                    "RoxFieldType": 0,
                    "RoxSelection": "",
                    "RoxType": "date",
                    "Value": "2016-04-21T10:28:30",
                    "ValueIds": null
                  },
                  {
                    "FieldCaption": "roXtraFeld",
                    "Id": "roXtraFeld",
                    "IsWFWritable": true,
                    "IsWritable": true,
                    "RoxFieldType": 0,
                    "RoxSelection": "",
                    "RoxType": "date",
                    "Value": "2016-04-21T10:28:30",
                    "ValueIds": null
                  },
                ]
              };
            },
            getSelectionsCall: async () => {
              return [{
                "Id": "roXtraFeld",
                "SelectionCaption": "roXtraFeld",
                "SelectionType": 0,
                "SelectionsList": [],
                "SimpleSelectionsList": [],
                "TreeSelectionsList": [],
              }];
            },
          };
          const environment: PH.ServiceTask.ServiceTaskEnvironment = PH.Test.createEmptyTestServiceEnvironment(
            fs.readFileSync("./testfiles/setroxfilefield-service.bpmn", "utf8")
          );
          environment.bpmnTaskName = "SetFields";
          environment.bpmnTaskId = "ServiceTask_6FAF8F7973EF56FA";
          environment.fieldContents = {
            "Feld_1": {
              type: "ProcessHubTextInput",
              value: "Hello",
            }
          };
          environment.instanceDetails.extras.fieldContents = environment.fieldContents;
          environment.serverConfig = {
            roXtra: {
              efApiEndpoint: undefined,
              url: undefined,
              clientSecret: undefined,
            }
          } as any;
          expect(errorState).to.equal(ERRORCODES.NOERROR);
          await serviceLogic(environment, testApi);
          expect(errorState).to.equal(ERRORCODES.NOERROR);
          // make sure setFileFieldsCall was called with the right values
          expect(bodyFromSetCall.length).to.equal(1);
          expect(bodyFromSetCall[0].Id).to.equal("roXtraFeld");
          expect(bodyFromSetCall[0].Value).to.equal("Hello");
        });

      });

    });
  });
});