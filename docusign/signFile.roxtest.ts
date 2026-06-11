import { signFile, signFileConfig } from "./main.js";
import { expect } from "chai";
import { serviceLogic } from "./signFile.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import fs from "fs/promises";
import sinon from "sinon";
import { IEnvelopeResponse } from "./docusignApi.js";

const mockEnvelopeResponse: IEnvelopeResponse = {
  envelopeId: "envelope_123",
  status: "sent",
  uri: "/envelopes/envelope_123",
};

async function createEnv(filePath: string) {
  const env = createEmptyTestServiceEnvironment(await fs.readFile(filePath, "utf8"));
  env.bpmnTaskId = "ServiceTask_848E935253381382";
  env.instanceDetails.extras.fieldContents!["Anlagen"] = {
    type: "ProcessHubFileUpload",
    value: ["https://localhost/roxtra/modules/files/1/4DCCE1EB39A16601/attachments-8EB4C9CA2F44C492/A43E75808EFFE301/ZG9rdW1lbnQucGRm"],
  };
  return env;
}

const mockConfigFile = {
  accountId: "account_123",
  userId: "user_123",
  integrationKey: "integration_123",
  privateKey: "private_key",
  baseUrl: "https://demo.docusign.net/restapi/v2.1",
  oauthBasePath: "account-d.docusign.com",
  callbackUrlBase: "",
};

describe("services", () => {
  describe("docusign", () => {
    it("should check for bundled methods", () => {
      expect(typeof signFile).to.equal("function");
      expect(typeof signFileConfig).to.equal("function");
    });
  });

  describe("signFile", () => {
    it("should create an envelope and store envelopeId and signing URL", async () => {
      const env = await createEnv("./testfiles/docusign-service.bpmn");
      const getPhysicalPathStub = sinon.stub(env.fileStore, "getPhysicalPath").returns("./testfiles/data.txt");
      env.fileStore.getPhysicalPath = getPhysicalPathStub;
      env.sender.mail = "test@example.com";
      env.sender.language = "de-DE";

      const docusignApi = {
        getAccessToken: sinon.stub().returns(Promise.resolve("access_token")),
        createEnvelope: sinon.stub().returns(Promise.resolve(mockEnvelopeResponse)),
        getEnvelope: sinon.stub(),
        getRecipientSigningUrl: sinon.stub().returns(Promise.resolve("https://demo.docusign.net/signing/abc")),
        downloadCompletedDocument: sinon.stub(),
        voidEnvelope: sinon.stub(),
      };

      await serviceLogic(env, docusignApi, mockConfigFile);

      expect(docusignApi.getAccessToken.calledOnce).to.equal(true);
      expect(docusignApi.createEnvelope.calledOnce).to.equal(true);
      expect(docusignApi.createEnvelope.getCall(0).args[0]).to.equal("access_token");
      expect(docusignApi.createEnvelope.getCall(0).args[1]).to.deep.include({
        emailSubject: "dokument.pdf",
        emailMessage: "Bitte signieren Sie das Dokument",
        documentName: "dokument.pdf",
        signerEmail: "test@example.com",
        embeddedClientUserId: "test@example.com",
        webhookUrl: undefined,
      });
      expect(docusignApi.createEnvelope.getCall(0).args[1].documentBase64).to.equal("VEVTVA==");

      // Signing URL was requested because signatureUrlField is set
      expect(docusignApi.getRecipientSigningUrl.calledOnce).to.equal(true);
      expect(docusignApi.getRecipientSigningUrl.getCall(0).args[0]).to.equal("access_token");
      expect(docusignApi.getRecipientSigningUrl.getCall(0).args[1]).to.equal("envelope_123");

      expect(env.instanceDetails.extras.fieldContents!["SignaturId"]).to.deep.equal({
        type: "ProcessHubTextInput",
        value: "envelope_123",
      });
      expect(env.instanceDetails.extras.fieldContents!["SignaturUrl"]).to.deep.equal({
        type: "ProcessHubTextInput",
        value: "https://demo.docusign.net/signing/abc",
      });
    });

    it("should create an envelope with webhook URL and no signing URL", async () => {
      const env = await createEnv("./testfiles/docusign-service-webhook.bpmn");
      const getPhysicalPathStub = sinon.stub(env.fileStore, "getPhysicalPath").returns("./testfiles/data.txt");
      env.fileStore.getPhysicalPath = getPhysicalPathStub;
      env.sender.mail = "test@example.com";
      env.sender.language = "de-DE";

      const docusignApi = {
        getAccessToken: sinon.stub().returns(Promise.resolve("access_token")),
        createEnvelope: sinon.stub().returns(Promise.resolve(mockEnvelopeResponse)),
        getEnvelope: sinon.stub(),
        getRecipientSigningUrl: sinon.stub(),
        downloadCompletedDocument: sinon.stub(),
        voidEnvelope: sinon.stub(),
      };

      await serviceLogic(env, docusignApi, mockConfigFile);

      expect(docusignApi.createEnvelope.calledOnce).to.equal(true);
      const envelopeArg = docusignApi.createEnvelope.getCall(0).args[1];
      expect(envelopeArg.webhookUrl).to.match(/webhook\/v1\/trigger\/.*BoundaryEvent_6801F3B0685A7268/);
      expect(envelopeArg.embeddedClientUserId).to.equal(undefined);

      expect(docusignApi.getRecipientSigningUrl.callCount).to.equal(0);
    });

    it("should use custom callbackUrlBase for webhook URL", async () => {
      const env = await createEnv("./testfiles/docusign-service-webhook.bpmn");
      const getPhysicalPathStub = sinon.stub(env.fileStore, "getPhysicalPath").returns("./testfiles/data.txt");
      env.fileStore.getPhysicalPath = getPhysicalPathStub;
      env.sender.mail = "test@example.com";

      const docusignApi = {
        getAccessToken: sinon.stub().returns(Promise.resolve("access_token")),
        createEnvelope: sinon.stub().returns(Promise.resolve(mockEnvelopeResponse)),
        getEnvelope: sinon.stub(),
        getRecipientSigningUrl: sinon.stub(),
        downloadCompletedDocument: sinon.stub(),
        voidEnvelope: sinon.stub(),
      };

      const customBase = "https://example.com/roxtra/";
      await serviceLogic(env, docusignApi, { ...mockConfigFile, callbackUrlBase: customBase });

      const envelopeArg = docusignApi.createEnvelope.getCall(0).args[1];
      expect(envelopeArg.webhookUrl).to.match(/^https:\/\/example\.com\/roxtra\/modules\/webhook\/v1\/trigger\/.*BoundaryEvent_6801F3B0685A7268/);
    });
  });
});
