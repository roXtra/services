/* eslint-disable @typescript-eslint/naming-convention */
import { downloadFile, downloadFileConfig } from "./main.js";
import { expect } from "chai";
import { serviceLogic } from "./downloadFile.js";
import sinon from "sinon";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import fs from "fs/promises";
import { ISignatureResponse } from "./skribbleApi.js";

describe("services", () => {
  describe("skribble", () => {
    it("should check for bundled methods", () => {
      expect(typeof downloadFile).to.equal("function");
      expect(typeof downloadFileConfig).to.equal("function");
    });

    describe("downloadFile", () => {
      const mockData = new Blob(["test content"], { type: "text/plain" });

      const mockSignatureResponse: ISignatureResponse = {
        id: "signature_123",
        title: "test.pdf",
        message: "",
        document_id: "document_123",
        quality: "AES",
        signing_url: "",
        status_overall: "completed",
        signatures: [],
        cc_email_addresses: [],
        owner: "",
        read_access: [],
        write_access: [],
        created_at: "",
        updated_at: "",
      };

      async function createTestEnv(fileName: string) {
        const env = createEmptyTestServiceEnvironment(await fs.readFile(fileName, "utf8"));
        env.bpmnTaskId = "ServiceTask_FC67E858BA85192A";
        env.instanceDetails.extras.fieldContents!["SignaturId"] = { type: "ProcessHubTextInput", value: mockSignatureResponse.id };
        const uploadInstanceAttachmentStub = sinon.stub(env.instances, "uploadAttachment");
        uploadInstanceAttachmentStub.returns(Promise.resolve("http://127.0.0.1/attachment/123"));
        return { env, uploadInstanceAttachmentStub };
      }

      it("should download a file and delete the document", async () => {
        const skribbleApi = {
          downloadDocument: sinon.stub().returns(Promise.resolve(mockData)),
          login: sinon.stub().returns(Promise.resolve("token")),
          createSignatureRequest: sinon.stub(),
          getSignatureRequest: sinon.stub().returns(Promise.resolve(mockSignatureResponse)),
          deleteDocument: sinon.stub(),
        };

        const { env, uploadInstanceAttachmentStub } = await createTestEnv("./testfiles/skribble-service-deletefile.bpmn");

        await serviceLogic(env, skribbleApi);

        expect(skribbleApi.login.calledOnce).to.equal(true);
        expect(skribbleApi.getSignatureRequest.calledOnce).to.equal(true);
        expect(skribbleApi.getSignatureRequest.lastCall.args[0]).to.equal("token");
        expect(skribbleApi.getSignatureRequest.lastCall.args[1]).to.equal(mockSignatureResponse.id);
        expect(skribbleApi.downloadDocument.calledOnce).to.equal(true);
        expect(skribbleApi.downloadDocument.lastCall.args[0]).to.equal("token");
        expect(skribbleApi.downloadDocument.lastCall.args[1]).to.equal(mockSignatureResponse.document_id);
        expect(uploadInstanceAttachmentStub.calledOnce).to.equal(true);
        expect(uploadInstanceAttachmentStub.lastCall.args[0]).to.equal(env.instanceDetails.instanceId);
        expect(uploadInstanceAttachmentStub.lastCall.args[1]).to.equal(mockSignatureResponse.title);
        expect(skribbleApi.deleteDocument.calledOnce).to.equal(true);
        expect(skribbleApi.deleteDocument.lastCall.args[0]).to.equal("token");
        expect(skribbleApi.deleteDocument.lastCall.args[1]).to.equal(mockSignatureResponse.document_id);
      });

      it("should download a file without deleting the document", async () => {
        const skribbleApi = {
          downloadDocument: sinon.stub().returns(Promise.resolve(mockData)),
          login: sinon.stub().returns(Promise.resolve("token")),
          createSignatureRequest: sinon.stub(),
          getSignatureRequest: sinon.stub().returns(Promise.resolve(mockSignatureResponse)),
          deleteDocument: sinon.stub(),
        };

        const { env, uploadInstanceAttachmentStub } = await createTestEnv("./testfiles/skribble-service.bpmn");

        await serviceLogic(env, skribbleApi);

        expect(skribbleApi.login.calledOnce).to.equal(true);
        expect(skribbleApi.getSignatureRequest.calledOnce).to.equal(true);
        expect(skribbleApi.getSignatureRequest.lastCall.args[0]).to.equal("token");
        expect(skribbleApi.getSignatureRequest.lastCall.args[1]).to.equal(mockSignatureResponse.id);
        expect(skribbleApi.downloadDocument.calledOnce).to.equal(true);
        expect(skribbleApi.downloadDocument.lastCall.args[0]).to.equal("token");
        expect(skribbleApi.downloadDocument.lastCall.args[1]).to.equal(mockSignatureResponse.document_id);
        expect(uploadInstanceAttachmentStub.calledOnce).to.equal(true);
        expect(uploadInstanceAttachmentStub.lastCall.args[0]).to.equal(env.instanceDetails.instanceId);
        expect(uploadInstanceAttachmentStub.lastCall.args[1]).to.equal(mockSignatureResponse.title);
        expect(skribbleApi.deleteDocument.callCount).to.equal(0);
      });
    });
  });
});
