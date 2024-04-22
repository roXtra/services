import { assert, expect } from "chai";
import * as fs from "fs";
import { createActivityServiceLogic } from "../main.js";
import { NockServer } from "./nockServer.js";
import { BpmnError, isBpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { ErrorCodes } from "../IntrafoxTypes.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";

describe("services", () => {
  describe("intrafox", () => {
    after(function () {
      NockServer.stopNock();
    });

    // Create a mock service environment
    function createEnvironment(
      bpmnXmlPath: string,
      bpmnTaskId: string,
      username: string,
      abbreation: string,
      describtion: string,
      expirationDate: Date,
    ): IServiceTaskEnvironment {
      const env = createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.instanceDetails.extras.fieldContents = {
        Username: { type: "ProcessHubNumber", value: username },
        Abb: { type: "ProcessHubNumber", value: abbreation },
        Desc: { type: "ProcessHubNumber", value: describtion },
        Date: { type: "ProcessHubNumber", value: expirationDate },
      };

      return env;
    }

    async function performCreateActivityTest(
      testGuid: string,
      bpmnXmlPath: string,
      bpmnTaskId: string,
      username: string,
      abbreation: string,
      describtion: string,
      expirationDate: Date,
    ): Promise<IServiceTaskEnvironment> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId, username, abbreation, describtion, expirationDate);

      await createActivityServiceLogic("http://localhost:1080/" + testGuid, env);
      return env;
    }

    it("execute intrafox create Activity successfully_d3b82ce4-e404-4fab-b055-c917afe14e7c", async () => {
      const testGuid = "d3b82ce4-e404-4fab-b055-c917afe14e7c";
      const username = "herbert";
      const abbreation = "test";
      const describtion = "test";
      const expirationDate = new Date("2019-08-07T13:11:43.078Z");
      const nockServer = new NockServer("http://localhost:1080");

      nockServer.createResponse(testGuid, JSON.stringify("ok"));

      const env = await performCreateActivityTest(
        testGuid,
        "./Test/testfiles/create-activity.bpmn",
        "ServiceTask_16C58B2F292DE836",
        username,
        abbreation,
        describtion,
        expirationDate,
      );
      assert.equal((env.instanceDetails.extras.fieldContents?.["Info"] as IFieldValue).value as string, "Maßnahme wurde erstellt");
      assert.equal((env.instanceDetails.extras.fieldContents?.["Abb"] as IFieldValue).value as string, abbreation);
      assert.equal((env.instanceDetails.extras.fieldContents?.["Desc"] as IFieldValue).value as string, describtion);
      assert.equal((env.instanceDetails.extras.fieldContents?.["Date"] as IFieldValue).value as Date, expirationDate);
      assert.isUndefined(env.instanceDetails.extras.fieldContents?.["ERROR"] as IFieldValue);
    });

    it("execute intrafox createActivity with wrong username_6a439a53-9c1b-4e31-969b-2be89b2ebb95", async () => {
      const testGuid = "6a439a53-9c1b-4e31-969b-2be89b2ebb95";
      const username = "incorrectUsername";
      const abbreation = "test";
      const describtion = "test";
      const expirationDate = new Date("2019-08-07T13:11:43.078Z");
      const nockServer = new NockServer("http://localhost:1080");

      nockServer.createResponse(
        testGuid,
        JSON.stringify({
          ERRORCODE: "ERRORCODE_ARGUMENTS",
          REASON: "function args error",
          MESSAGE: "no user with username " + username + " found",
        }),
      );

      const rejectionError = await performCreateActivityTest(
        testGuid,
        "./Test/testfiles/create-activity.bpmn",
        "ServiceTask_16C58B2F292DE836",
        username,
        abbreation,
        describtion,
        expirationDate,
      ).catch((err: BpmnError) => err);

      expect(isBpmnError(rejectionError)).to.be.true;
      const actualError = rejectionError as BpmnError;
      const expectedError = new BpmnError(ErrorCodes.API_ERROR, "Ein Fehler ist aufgetreten, ARGS wurden falsch gesetzt.");
      expect(actualError.errorCode).to.equal(expectedError.errorCode);
      expect(actualError.errorMessage).to.equal(expectedError.errorMessage);
      expect(actualError.innerError).to.equal(expectedError.innerError);
    });

    it("execute intrafox createActivity with wrong token_d7dabc0a-85bb-4877-863d-7c565dcff90a", async () => {
      const testGuid = "d7dabc0a-85bb-4877-863d-7c565dcff90a";
      const username = "incorrectUsername";
      const abbreation = "test";
      const describtion = "test";
      const expirationDate = new Date("2019-08-07T13:11:43.078Z");
      const nockServer = new NockServer("http://localhost:1080");

      nockServer.createResponse(
        testGuid,
        JSON.stringify({
          ERRORCODE: "ERRORCODE_A2",
          REASON: "unauthorized",
          MESSAGE: "",
        }),
      );

      const rejectionError = await performCreateActivityTest(
        testGuid,
        "./Test/testfiles/create-activity.bpmn",
        "ServiceTask_16C58B2F292DE836",
        username,
        abbreation,
        describtion,
        expirationDate,
      ).catch((err: BpmnError) => err);

      expect(isBpmnError(rejectionError)).to.be.true;
      const actualError = rejectionError as BpmnError;
      const expectedError = new BpmnError(ErrorCodes.API_ERROR, "Ein Fehler ist aufgetreten, Authentifizierungstoken ist ungültig.");
      expect(actualError.errorCode).to.equal(expectedError.errorCode);
      expect(actualError.errorMessage).to.equal(expectedError.errorMessage);
      expect(actualError.innerError).to.equal(expectedError.innerError);
    });
  });
});
