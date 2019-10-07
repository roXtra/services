import { assert } from "chai";
import * as PH from "processhub-sdk";
import fs = require("fs");
import * as CreateActivity from "./createActivity-service";
import * as mockserver from "mockserver-node";
import * as mockServerClient from "mockserver-client";
import * as DateFormat from "dateformat";

describe("services", () => {
  describe("intrafox", () => {

    before(async function () {
      console.log("Start Mockserver");
      await mockserver.start_mockserver({
        serverPort: 1080,
        trace: true
      });
      console.log("Started Mockserver");
    });

    after(async function () {
      console.log("Shut down Mockserver");
      await mockserver.stop_mockserver({
        serverPort: 1080
      });
      console.log("Mockserver is offline");
    });

    // Create a mock service environment
    function createEnvironment(bpmnXmlPath: string, bpmnTaskId: string, username: string, abbreation: string, describtion: string, expirationDate: Date): PH.ServiceTask.IServiceTaskEnvironment {
      const env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync(bpmnXmlPath, "utf8"));
      env.bpmnTaskId = bpmnTaskId;
      env.fieldContents = {
        "Username": { type: "ProcessHubNumber", value: username },
        "Abb": { type: "ProcessHubNumber", value: abbreation },
        "Desc": { type: "ProcessHubNumber", value: describtion },
        "Date": { type: "ProcessHubNumber", value: expirationDate }
      };
      env.instanceDetails.extras.fieldContents = env.fieldContents;

      return env;
    }

    async function performCreateActivityTest(testGuid: string, bpmnXmlPath: string, bpmnTaskId: string, username: string, abbreation: string, describtion: string, expirationDate: Date): Promise<PH.ServiceTask.IServiceTaskEnvironment> {
      const env = createEnvironment(bpmnXmlPath, bpmnTaskId, username, abbreation, describtion, expirationDate);

      await CreateActivity.serviceLogic("http://localhost:1080/" + testGuid, env);
      return env;
    }

    it("execute intrafox create Activity successfully_d3b82ce4-e404-4fab-b055-c917afe14e7c", async () => {
      const testGuid = "d3b82ce4-e404-4fab-b055-c917afe14e7c";
      const username = "herbert";
      const abbreation = "test";
      const describtion = "test";
      const expirationDate = new Date("2019-08-07T13:11:43.078Z");
      const testToken = "123";

      await mockServerClient.mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
          "method": "POST",
          "path": "/" + testGuid,
          "body": JSON.stringify({
            "FUNCTION": "CreateGlobalActivity",
            "USERNAME": username,
            "ARGS": {
              "ACTIVITY_ABBREVIATION": abbreation,
              "ACTIVITY_DESCRIPTION": describtion,
              "ACTIVITY_EXPIRATIONDATE": DateFormat(expirationDate, "yyyy-mm-dd")
            },
          }),
          "headers": {
            "X-INTRAFOX-ROXTRA-TOKEN": [testToken]
          }
        },
        "httpResponse": {
          "body": JSON.stringify("ok"),
        },
      }).then(
        function (error: any) {
          console.log(error);
        }
      );

      const env = await performCreateActivityTest(testGuid, "./testfiles/create-activity.bpmn", "ServiceTask_16C58B2F292DE836", username, abbreation, describtion, expirationDate);
      assert.equal(((env.instanceDetails.extras.fieldContents["Info"] as PH.Data.IFieldValue).value as string), "Maßnahme wurde erstellt");
      assert.equal(((env.instanceDetails.extras.fieldContents["Abb"] as PH.Data.IFieldValue).value as string), abbreation);
      assert.equal(((env.instanceDetails.extras.fieldContents["Desc"] as PH.Data.IFieldValue).value as string), describtion);
      assert.equal(((env.instanceDetails.extras.fieldContents["Date"] as PH.Data.IFieldValue).value as Date), expirationDate);
      assert.isUndefined((env.instanceDetails.extras.fieldContents["ERROR"] as PH.Data.IFieldValue));
    });

    it("execute intrafox createActivity with wrong username_6a439a53-9c1b-4e31-969b-2be89b2ebb95", async () => {
      const testGuid = "6a439a53-9c1b-4e31-969b-2be89b2ebb95";
      const username = "incorrectUsername";
      const abbreation = "test";
      const describtion = "test";
      const expirationDate = new Date("2019-08-07T13:11:43.078Z");
      const testToken = "123";

      await mockServerClient.mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
          "method": "POST",
          "path": "/" + testGuid,
          "body": JSON.stringify({
            "FUNCTION": "CreateGlobalActivity",
            "USERNAME": username,
            "ARGS": {
              "ACTIVITY_ABBREVIATION": abbreation,
              "ACTIVITY_DESCRIPTION": describtion,
              "ACTIVITY_EXPIRATIONDATE": DateFormat(expirationDate, "yyyy-mm-dd")
            },
          }),
          "headers": {
            "X-INTRAFOX-ROXTRA-TOKEN": [testToken]
          }
        },
        "httpResponse": {
          "body": JSON.stringify({
            "ERRORCODE": "ERRORCODE_ARGUMENTS",
            "REASON": "function args error",
            "MESSAGE": "no user with username \"" + username + " found\""
          }),
        },
      }).then(
        function (error: any) {
          console.log(error);
        }
      );

      const env = await performCreateActivityTest(testGuid, "./testfiles/create-activity.bpmn", "ServiceTask_16C58B2F292DE836", username, abbreation, describtion, expirationDate);
      assert.equal(((env.instanceDetails.extras.fieldContents["ERROR"] as PH.Data.IFieldValue).value as string), "Ein Fehler ist aufgetreten, ARGS wurden falsch gesetzt.");
      assert.equal(((env.instanceDetails.extras.fieldContents["Abb"] as PH.Data.IFieldValue).value as string), abbreation);
      assert.equal(((env.instanceDetails.extras.fieldContents["Desc"] as PH.Data.IFieldValue).value as string), describtion);
      assert.equal(((env.instanceDetails.extras.fieldContents["Date"] as PH.Data.IFieldValue).value as Date), expirationDate);
      assert.isUndefined((env.instanceDetails.extras.fieldContents["Info"] as PH.Data.IFieldValue));
    });

    it("execute intrafox createActivity with wrong token_d7dabc0a-85bb-4877-863d-7c565dcff90a", async () => {
      const testGuid = "d7dabc0a-85bb-4877-863d-7c565dcff90a";
      const username = "incorrectUsername";
      const abbreation = "test";
      const describtion = "test";
      const expirationDate = new Date("2019-08-07T13:11:43.078Z");
      const testToken = "123";

      await mockServerClient.mockServerClient("localhost", 1080).mockAnyResponse({
        "httpRequest": {
          "method": "POST",
          "path": "/" + testGuid,
          "body": JSON.stringify({
            "FUNCTION": "CreateGlobalActivity",
            "USERNAME": username,
            "ARGS": {
              "ACTIVITY_ABBREVIATION": abbreation,
              "ACTIVITY_DESCRIPTION": describtion,
              "ACTIVITY_EXPIRATIONDATE": DateFormat(expirationDate, "yyyy-mm-dd")
            },
          }),
          "headers": {
            "X-INTRAFOX-ROXTRA-TOKEN": [testToken]
          }
        },
        "httpResponse": {
          "body": JSON.stringify({
            "ERRORCODE": "ERRORCODE_A2",
            "REASON": "unauthorized",
            "MESSAGE": ""
          }),
        },
      }).then(
        function (error: any) {
          console.log(error);
        }
      );

      const env = await performCreateActivityTest(testGuid, "./testfiles/create-activity.bpmn", "ServiceTask_16C58B2F292DE836", username, abbreation, describtion, expirationDate);
      assert.equal(((env.instanceDetails.extras.fieldContents["ERROR"] as PH.Data.IFieldValue).value as string), "Ein Fehler ist aufgetreten, Authentifizierungstoken ist ungültig.");
      assert.equal(((env.instanceDetails.extras.fieldContents["Abb"] as PH.Data.IFieldValue).value as string), abbreation);
      assert.equal(((env.instanceDetails.extras.fieldContents["Desc"] as PH.Data.IFieldValue).value as string), describtion);
      assert.equal(((env.instanceDetails.extras.fieldContents["Date"] as PH.Data.IFieldValue).value as Date), expirationDate);
      assert.isUndefined((env.instanceDetails.extras.fieldContents["Info"] as PH.Data.IFieldValue));
    });
  });
});