import { downloadFile, downloadFileConfig } from "./main.js";
import { expect } from "chai";
import { serviceLogic } from "./downloadFile.js";
import sinon from "sinon";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import fs from "fs/promises";
import { IEnvelopeResponse } from "./docusignApi.js";

const mockEnvelopeResponse: IEnvelopeResponse = {
  envelopeId: "envelope_123",
  status: "completed",
  uri: "/envelopes/envelope_123",
};

async function createTestEnv(fileName: string) {
  const env = createEmptyTestServiceEnvironment(await fs.readFile(fileName, "utf8"));
  env.bpmnTaskId = "ServiceTask_FC67E858BA85192A";
  env.instanceDetails.extras.fieldContents!["SignaturId"] = { type: "ProcessHubTextInput", value: mockEnvelopeResponse.envelopeId };
  const uploadInstanceAttachmentStub = sinon.stub(env.instances, "uploadAttachment");
  uploadInstanceAttachmentStub.returns(Promise.resolve("http://127.0.0.1/attachment/123"));
  return { env, uploadInstanceAttachmentStub };
}

describe("services", () => {
  describe("docusign", () => {
    it("should check for bundled methods", () => {
      expect(typeof downloadFile).to.equal("function");
      expect(typeof downloadFileConfig).to.equal("function");
    });
  });

  describe("downloadFile", () => {
    const mockData = new Blob(["test content"], { type: "application/pdf" });

    it("should download the completed document and save it to the target field", async () => {
      const docusignApi = {
        getAccessToken: sinon.stub().returns(Promise.resolve("access_token")),
        createEnvelope: sinon.stub(),
        getEnvelope: sinon.stub().returns(Promise.resolve(mockEnvelopeResponse)),
        getRecipientSigningUrl: sinon.stub(),
        downloadCompletedDocument: sinon.stub().returns(Promise.resolve(mockData)),
        voidEnvelope: sinon.stub(),
      };

      const { env, uploadInstanceAttachmentStub } = await createTestEnv("./testfiles/docusign-service.bpmn");

      await serviceLogic(env, docusignApi);

      expect(docusignApi.getAccessToken.calledOnce).to.equal(true);
      expect(docusignApi.getEnvelope.calledOnce).to.equal(true);
      expect(docusignApi.getEnvelope.lastCall.args[0]).to.equal("access_token");
      expect(docusignApi.getEnvelope.lastCall.args[1]).to.equal(mockEnvelopeResponse.envelopeId);
      expect(docusignApi.downloadCompletedDocument.calledOnce).to.equal(true);
      expect(docusignApi.downloadCompletedDocument.lastCall.args[0]).to.equal("access_token");
      expect(docusignApi.downloadCompletedDocument.lastCall.args[1]).to.equal(mockEnvelopeResponse.envelopeId);
      expect(uploadInstanceAttachmentStub.calledOnce).to.equal(true);
      expect(uploadInstanceAttachmentStub.lastCall.args[0]).to.equal(env.instanceDetails.instanceId);
      expect(env.instanceDetails.extras.fieldContents!["Signiertes Dokument"]).to.deep.equal({
        type: "ProcessHubFileUpload",
        value: ["http://127.0.0.1/attachment/123"],
      });
    });

    it("should throw an error if the envelope is not yet completed", async () => {
      const incompleteEnvelope: IEnvelopeResponse = { ...mockEnvelopeResponse, status: "sent" };

      const docusignApi = {
        getAccessToken: sinon.stub().returns(Promise.resolve("access_token")),
        createEnvelope: sinon.stub(),
        getEnvelope: sinon.stub().returns(Promise.resolve(incompleteEnvelope)),
        getRecipientSigningUrl: sinon.stub(),
        downloadCompletedDocument: sinon.stub(),
        voidEnvelope: sinon.stub(),
      };

      const { env } = await createTestEnv("./testfiles/docusign-service.bpmn");

      let errorThrown = false;
      try {
        await serviceLogic(env, docusignApi);
      } catch {
        errorThrown = true;
      }

      expect(errorThrown).to.equal(true);
      expect(docusignApi.downloadCompletedDocument.callCount).to.equal(0);
    });
  });
});
