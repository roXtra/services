import { startinstance, startInstanceConfig } from "./main";
import * as fs from "fs";
import { expect } from "chai";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools";

describe("services", () => {
  describe("roxfile", () => {
    describe("startinstance-service", () => {
      describe("startinstance", () => {
        it("executes the service", async () => {
          const valueFeld1 = "Feld1";
          const valueFeld2 = 7;
          const testAccessToken = "token";
          let executeWasCalled = false;

          const environment: IServiceTaskEnvironment = createEmptyTestServiceEnvironment(fs.readFileSync("./testfiles/startservice.bpmn", "utf8"));
          environment.bpmnTaskName = "Start";
          environment.bpmnTaskId = "ServiceTask_960AFDE95A570BF3";
          environment.instanceDetails.extras.fieldContents = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Feld_1: {
              type: "ProcessHubTextInput",
              value: valueFeld1,
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Feld_2: {
              type: "ProcessHubNumber",
              value: valueFeld2,
            },
          };

          // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/require-await
          environment.roxApi.getRoxtraTokenByUserId = async (userId: string): Promise<string> => {
            // Must match the value defined in startservice.bpmn
            expect(userId).to.equal("7133");
            return testAccessToken;
          };

          // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/require-await
          environment.instances.executeInstance = async (processId, instance, startEventId, accessToken): Promise<string> => {
            executeWasCalled = true;
            expect(accessToken).to.equal(testAccessToken);
            // Must match the value defined in startservice.bpmn
            expect(processId).to.equal("E431DD73D9B0EDEB");
            // Make sure field contents were set
            expect((instance.extras.fieldContents!["Feld_1"] as IFieldValue).value).to.equal(valueFeld1);
            expect((instance.extras.fieldContents!["Feld_2"] as IFieldValue).value).to.equal(valueFeld2);
            return instance.instanceId;
          };

          const result = await startinstance(environment);
          expect(result).to.equal(true);
          expect(executeWasCalled).to.equal(true);
        });
      });

      describe("bundle test", () => {
        it("should check for bundled methods", () => {
          expect(typeof startinstance).to.equal("function");
          expect(typeof startInstanceConfig).to.equal("function");
        });
      });
    });
  });
});
