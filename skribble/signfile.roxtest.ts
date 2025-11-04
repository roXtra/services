import { signFile, signFileConfig } from "./main.js";
import { expect } from "chai";
import { serviceLogic } from "./signfile.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import fs from "fs/promises";
import sinon from "sinon";
import { ISignatureResponse } from "./skribbleApi.js";

describe("services", () => {
  describe("skribble", () => {
    it("should check for bundled methods", () => {
      expect(typeof signFile).to.equal("function");
      expect(typeof signFileConfig).to.equal("function");
    });
  });

  describe("signFile", () => {
    /* eslint-disable @typescript-eslint/naming-convention */
    const mockSignatureResponse: ISignatureResponse = {
      id: "signature_123",
      title: "test.pdf",
      message: "",
      document_id: "document_123",
      quality: "AES",
      signing_url: "",
      status_overall: "completed",
      signatures: [
        {
          signing_url: "https://example.com/sign",
          sid: "signer_123",
          account_email: "test@example.com",
          order: 1,
          status_code: "completed",
          notify: false,
        },
      ],
      cc_email_addresses: [],
      owner: "",
      read_access: [],
      write_access: [],
      created_at: "",
      updated_at: "",
    };
    /* eslint-enable @typescript-eslint/naming-convention */

    it("should create a signature request", async () => {
      const env = await createEnv("./testfiles/skribble-service.bpmn");
      const getPhysicalPathStub = sinon.stub(env.fileStore, "getPhysicalPath").returns("./testfiles/data.txt");
      env.fileStore.getPhysicalPath = getPhysicalPathStub;
      env.sender.mail = "test@example.com";

      const skribbleApi = {
        downloadDocument: sinon.stub().returns(Promise.resolve({})),
        login: sinon.stub().returns(Promise.resolve("token")),
        createSignatureRequest: sinon.stub().returns(Promise.resolve(mockSignatureResponse)),
        getSignatureRequest: sinon.stub().returns(Promise.resolve({})),
        deleteDocument: sinon.stub(),
      };

      await serviceLogic(env, skribbleApi, { userName: "", apiKey: "", baseUrl: "https://api.skribble.de/v2", callbackUrlBase: "" });
      expect(skribbleApi.login.calledOnce).to.equal(true);
      expect(skribbleApi.createSignatureRequest.calledOnce).to.equal(true);
      expect(skribbleApi.createSignatureRequest.getCall(0).args[0]).to.equal("token");
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(skribbleApi.createSignatureRequest.getCall(0).args[1]).to.deep.equal({
        title: "dokument.pdf",
        message: "Bitte signieren Sie das Dokument",
        content: "VEVTVA==",
        quality: "AES",
        legislation: "EIDAS",
        callback_success_url: undefined,
        signatures: [
          {
            account_email: "test@example.com",
            notify: false,
            signer_identity_data: {
              email_address: "test@example.com",
              language: "de",
            },
          },
        ],
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      expect(getPhysicalPathStub.calledOnce).to.equal(true);
      expect(env.instanceDetails.extras.fieldContents!["SignaturUrl"]).to.deep.equal({
        type: "ProcessHubTextInput",
        value: "https://example.com/sign",
      });
      expect(env.instanceDetails.extras.fieldContents!["SignaturId"]).to.deep.equal({
        type: "ProcessHubTextInput",
        value: mockSignatureResponse.id,
      });
    });

    it("should create a signature request, notify and webhook are enabled", async () => {
      const env = await createEnv("./testfiles/skribble-service-notifyandwebhook.bpmn");
      const getPhysicalPathStub = sinon.stub(env.fileStore, "getPhysicalPath").returns("./testfiles/data.txt");
      env.fileStore.getPhysicalPath = getPhysicalPathStub;
      env.sender.mail = "test@example.com";

      const skribbleApi = {
        downloadDocument: sinon.stub().returns(Promise.resolve({})),
        login: sinon.stub().returns(Promise.resolve("token")),
        createSignatureRequest: sinon.stub().returns(Promise.resolve(mockSignatureResponse)),
        getSignatureRequest: sinon.stub().returns(Promise.resolve({})),
        deleteDocument: sinon.stub(),
      };

      await serviceLogic(env, skribbleApi, { userName: "", apiKey: "", baseUrl: "https://api.skribble.de/v2", callbackUrlBase: "" });
      expect(skribbleApi.login.calledOnce).to.equal(true);
      expect(skribbleApi.createSignatureRequest.calledOnce).to.equal(true);
      expect(skribbleApi.createSignatureRequest.getCall(0).args[0]).to.equal("token");
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(skribbleApi.createSignatureRequest.getCall(0).args[1]).to.deep.equal({
        title: "dokument.pdf",
        message: "Bitte signieren Sie das Dokument",
        content: "VEVTVA==",
        quality: "AES",
        legislation: "EIDAS",
        callback_success_url: "http://localhost:5051/webhook/v1/trigger//BoundaryEvent_6801F3B0685A7268",
        signatures: [
          {
            account_email: "test@example.com",
            notify: true,
            signer_identity_data: {
              email_address: "test@example.com",
              language: "de",
            },
          },
        ],
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      expect(getPhysicalPathStub.calledOnce).to.equal(true);
      // No new fields should have been created per configuration
      expect(env.instanceDetails.extras.fieldContents).to.deep.equal({
        Anlagen: {
          type: "ProcessHubFileUpload",
          value: ["https://localhost/roxtra/modules/files/1/4DCCE1EB39A16601/attachments-8EB4C9CA2F44C492/A43E75808EFFE301/ZG9rdW1lbnQucGRm"],
        },
      });
    });

    it("should use custom callbackUrlBase for webhook callback_success_url", async () => {
      const env = await createEnv("./testfiles/skribble-service-notifyandwebhook.bpmn");
      const getPhysicalPathStub = sinon.stub(env.fileStore, "getPhysicalPath").returns("./testfiles/data.txt");
      env.fileStore.getPhysicalPath = getPhysicalPathStub;
      env.sender.mail = "test@example.com";

      const skribbleApi = {
        downloadDocument: sinon.stub().returns(Promise.resolve({})),
        login: sinon.stub().returns(Promise.resolve("token")),
        createSignatureRequest: sinon.stub().returns(Promise.resolve(mockSignatureResponse)),
        getSignatureRequest: sinon.stub().returns(Promise.resolve({})),
        deleteDocument: sinon.stub(),
      };

      // Provide a custom callbackUrlBase. The service should append "/modules" and then the webhook route.
      const customBase = "https://example.com/roxtra/";
      await serviceLogic(env, skribbleApi, { userName: "", apiKey: "", baseUrl: "https://api.skribble.de/v2", callbackUrlBase: customBase });

      expect(skribbleApi.login.calledOnce).to.equal(true);
      expect(skribbleApi.createSignatureRequest.calledOnce).to.equal(true);
      expect(skribbleApi.createSignatureRequest.getCall(0).args[0]).to.equal("token");

      /* eslint-disable @typescript-eslint/naming-convention */
      expect(skribbleApi.createSignatureRequest.getCall(0).args[1]).to.deep.equal({
        title: "dokument.pdf",
        message: "Bitte signieren Sie das Dokument",
        content: "VEVTVA==",
        quality: "AES",
        legislation: "EIDAS",
        callback_success_url: "https://example.com/roxtra/modules/webhook/v1/trigger//BoundaryEvent_6801F3B0685A7268",
        signatures: [
          {
            account_email: "test@example.com",
            notify: true,
            signer_identity_data: {
              email_address: "test@example.com",
              language: "de",
            },
          },
        ],
      });
      /* eslint-enable @typescript-eslint/naming-convention */
      expect(getPhysicalPathStub.calledOnce).to.equal(true);
    });
  });
});

async function createEnv(filePath: string) {
  const env = createEmptyTestServiceEnvironment(await fs.readFile(filePath, "utf8"));
  env.bpmnTaskId = "ServiceTask_848E935253381382";
  env.instanceDetails.extras.fieldContents!["Anlagen"] = {
    type: "ProcessHubFileUpload",
    value: ["https://localhost/roxtra/modules/files/1/4DCCE1EB39A16601/attachments-8EB4C9CA2F44C492/A43E75808EFFE301/ZG9rdW1lbnQucGRm"],
  };
  return env;
}
