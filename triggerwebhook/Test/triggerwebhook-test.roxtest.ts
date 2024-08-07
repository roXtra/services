import { expect } from "chai";
import { triggerwebhookPost, triggerwebhookPostConfig } from "../main.js";
import * as fs from "fs";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import nock from "nock";
import { serviceLogic } from "../triggerwebhook-service.js";

describe("services", () => {
  describe("triggerwebhook", () => {
    // Create a mock service environment
    function createEnvironment(bpmnPath: string, fieldTestdataValue: string, fieldContentTypeValue: string): IServiceTaskEnvironment {
      const env = createEmptyTestServiceEnvironment(fs.readFileSync(bpmnPath, "utf8"));
      env.bpmnTaskId = "ServiceTask_11EE4126D6C2F418";
      env.instanceDetails.extras.roleOwners = {};
      env.instanceDetails.extras.fieldContents = {
        Testdata: { type: "ProcessHubTextInput", value: fieldTestdataValue },
        ContentType: { type: "ProcessHubTextInput", value: fieldContentTypeValue },
      };

      return env;
    }

    async function performtriggerwebhookPostTest(bpmnPath: string, fieldTestdataValue: string, fieldContentTypeValue: string, configPath?: string): Promise<boolean> {
      const env = createEnvironment(bpmnPath, fieldTestdataValue, fieldContentTypeValue);
      return serviceLogic(env, configPath ?? "./config.json");
    }

    afterEach(() => {
      nock.abortPendingRequests();
      nock.cleanAll();
    });

    it("calls webhook address with correct field data in headers and body", async () => {
      const nockServer = nock("http://localhost:1080", {
        reqheaders: {
          // Ensure the header value is present from the field ContentType
          "Content-Type": "application/json",
        },
      })
        .post(
          "/webhookendpoint",
          // Ensure the body data is present from the field Testdata
          {
            data: { releaseVersion: "9.9.9" },
          },
        )
        .reply(200);

      const result = await performtriggerwebhookPostTest("./Test/Testfiles/trigger-webhook.bpmn", "9.9.9", "application/json");
      expect(result).to.equal(true);

      // Ensure a webhook request was made with the correct data
      expect(nockServer.isDone()).to.equal(true);
    });

    it("calls webhook address with field in url and correct field data and secret in headers and body", async () => {
      const nockServer = nock("http://localhost:1080", {
        reqheaders: {
          // Ensure the header value is present from the field ContentType
          "Content-Type": "application/json",
        },
      })
        .post(
          "/webhookendpoint?test=9.9.9&token=123abc",
          // Ensure the body data is present from the field Testdata
          {
            data: { releaseVersion: "9.9.9", token: "123abc" },
          },
        )
        .reply(200);

      const result = await performtriggerwebhookPostTest(
        "./Test/Testfiles/trigger-webhook-fieldurl.bpmn",
        "9.9.9",
        "application/json",
        "./Test/Testfiles/trigger-webhook-fieldurl-config.json",
      );
      expect(result).to.equal(true);

      // Ensure a webhook request was made with the correct data
      expect(nockServer.isDone()).to.equal(true);
    });
  });

  describe("bundle test", () => {
    it("should check for bundled methods", () => {
      expect(typeof triggerwebhookPost).to.equal("function");
      expect(typeof triggerwebhookPostConfig).to.equal("function");
    });
  });
});
