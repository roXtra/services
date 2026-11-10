import { signFile, signFileConfig } from "./main.js";
import { expect } from "chai";
import { rejects } from "node:assert/strict";
import { ErrorCode } from "@roxtra/processhub-sdk/lib/instance/bpmnerror.js";
import { IServiceTaskConfigObject } from "@roxtra/processhub-sdk/lib/process/processinterfaces.js";
import { serviceLogic } from "./signFile.js";
import { createEmptyTestServiceEnvironment } from "@roxtra/processhub-sdk/lib/test/testtools.js";
import fs from "fs/promises";
import sinon from "sinon";
import { ICreateEnvelopeRequest, IEnvelopeResponse } from "./docusignApi.js";

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

async function createSigningTest(
  signerPhoneNumber: string,
  { accessCode = "", signatureProvider = "UniversalSignaturePen_OpenTrust_Hash_TSP", phoneAuthenticationCountryCode = "", recipientAccessCode = "" } = {},
) {
  const env = await createEnv("./testfiles/docusign-service.bpmn");
  sinon.stub(env.fileStore, "getPhysicalPath").returns("./testfiles/data.txt");
  env.sender.mail = "test@example.com";
  env.bpmnXml = env.bpmnXml.replace(
    /(<processhub:inputParameter name="service-task-config-object">)([^<]+)(<\/processhub:inputParameter>)/,
    (match: string, start: string, json: string, end: string) => {
      const config = JSON.parse(json) as IServiceTaskConfigObject;
      config.fields.push(
        { key: "signatureProvider", type: "select", value: signatureProvider },
        { key: "signerPhoneNumber", type: "text", value: signerPhoneNumber },
        { key: "phoneAuthenticationCountryCode", type: "text", value: phoneAuthenticationCountryCode },
        { key: "recipientAccessCode", type: "text", value: recipientAccessCode },
        { key: "accessCode", type: "text", value: accessCode },
      );
      return start + JSON.stringify(config).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;") + end;
    },
  );

  const api = {
    getAccessToken: sinon.stub().resolves("access_token"),
    createEnvelope: sinon.stub().resolves(mockEnvelopeResponse),
    getEnvelope: sinon.stub(),
    getRecipientSigningUrl: sinon.stub().resolves("https://demo.docusign.net/signing/abc"),
    downloadCompletedDocument: sinon.stub(),
    deleteEnvelope: sinon.stub(),
    purgeEnvelope: sinon.stub(),
  };

  return { env, api };
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
        deleteEnvelope: sinon.stub(),
        purgeEnvelope: sinon.stub(),
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
      expect((docusignApi.createEnvelope.getCall(0).args[1] as ICreateEnvelopeRequest).documentBase64).to.equal("VEVTVA==");

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

    it("should read the SMS number from the current process instance", async () => {
      for (const [reference, phoneNumber] of [
        ['field["SMS Telefonnummer"]', "+49123456789"],
        ['field["SMS Telefonnummer"]', "+49987654321"],
        ["field['SMS Telefonnummer']", "+49123456789"],
        ['{field["SMS Telefonnummer"]}', "+49123456789"],
        ["{ field['SMS Telefonnummer'] }", "+49123456789"],
        ["{field[SMS Telefonnummer]}", "+49123456789"],
        ["{{ field.SMS Telefonnummer }}", "+49123456789"],
      ]) {
        const { env, api } = await createSigningTest(reference);
        env.instanceDetails.extras.fieldContents!["SMS Telefonnummer"] = { type: "ProcessHubTextInput", value: phoneNumber };

        await serviceLogic(env, api, mockConfigFile);

        sinon.assert.calledOnce(api.createEnvelope);
        expect((api.createEnvelope.firstCall.args[1] as ICreateEnvelopeRequest).signerPhoneNumber).to.equal(phoneNumber);
      }
    });

    it("should preserve literal field names that contain template syntax, quotes, or line breaks", async () => {
      const fieldNames = ["Mobil {{field.alt}}", "Mobil field['alt']", ' Mobil "privat" & <Firma>\' [Ä] }\nzweite Zeile ', "__proto__"];
      for (const fieldName of fieldNames) {
        for (const reference of ['field["' + fieldName + '"]', '{field["' + fieldName + '"]}']) {
          const { env, api } = await createSigningTest(reference);
          env.instanceDetails.extras.fieldContents = {
            ...env.instanceDetails.extras.fieldContents,
            [fieldName]: { type: "ProcessHubTextInput", value: "  +49123456789  " },
          };

          await serviceLogic(env, api, mockConfigFile);

          sinon.assert.calledOnce(api.createEnvelope);
          expect((api.createEnvelope.firstCall.args[1] as ICreateEnvelopeRequest).signerPhoneNumber).to.equal("+49123456789");
        }
      }
    });

    it("should still accept a fixed SMS number", async () => {
      const { env, api } = await createSigningTest("+49123456789");

      await serviceLogic(env, api, mockConfigFile);

      expect((api.createEnvelope.firstCall.args[1] as ICreateEnvelopeRequest).signerPhoneNumber).to.equal("+49123456789");
    });

    it("should still accept an access code with no configured SMS number", async () => {
      const { env, api } = await createSigningTest("", { accessCode: "123456" });

      await serviceLogic(env, api, mockConfigFile);

      expect(api.createEnvelope.firstCall.args[1]).to.include({ signerPhoneNumber: undefined, accessCode: "123456" });
    });

    it("should read the document access code from the process field for a standard signature", async () => {
      const { env, api } = await createSigningTest("", { signatureProvider: "", recipientAccessCode: 'field["Zugangscode"]' });
      env.instanceDetails.extras.fieldContents!["Zugangscode"] = { type: "ProcessHubTextInput", value: "004219" };

      await serviceLogic(env, api, mockConfigFile);

      expect(api.createEnvelope.firstCall.args[1]).to.include({ recipientAccessCode: "004219", accessCode: undefined });
    });

    it("should reject missing and invalid document access codes before contacting DocuSign", async () => {
      for (const fieldValue of [undefined, "", "Code&123", "x".repeat(51)]) {
        const { env, api } = await createSigningTest("", { signatureProvider: "", recipientAccessCode: 'field["Zugangscode"]' });
        if (fieldValue !== undefined) {
          env.instanceDetails.extras.fieldContents!["Zugangscode"] = { type: "ProcessHubTextInput", value: fieldValue };
        }

        await rejects(serviceLogic(env, api, mockConfigFile), { errorCode: ErrorCode.ConfigInvalid, message: /^recipientAccessCode/ });
        sinon.assert.notCalled(api.getAccessToken);
      }
    });

    it("should use the AES access code when the referenced phone field is empty", async () => {
      for (const value of [undefined, "", "  "]) {
        const { env, api } = await createSigningTest('field["Telefonnummer"]', { accessCode: "123456" });
        env.instanceDetails.extras.fieldContents!["Telefonnummer"] = { type: "ProcessHubTextInput", value };

        await serviceLogic(env, api, mockConfigFile);

        expect(api.createEnvelope.firstCall.args[1]).to.include({ signerPhoneNumber: undefined, accessCode: "123456" });
      }
    });

    it("should require a number even with an AES access code when Phone Authentication is enabled", async () => {
      const { env, api } = await createSigningTest('field["Telefonnummer"]', { accessCode: "123456", phoneAuthenticationCountryCode: "+49" });
      env.instanceDetails.extras.fieldContents!["Telefonnummer"] = { type: "ProcessHubTextInput", value: "" };

      await rejects(serviceLogic(env, api, mockConfigFile), {
        errorCode: ErrorCode.ConfigInvalid,
        message: /signerPhoneNumber: .*must contain non-empty text/,
      });
      sinon.assert.notCalled(api.createEnvelope);
    });

    for (const { description, reference, fieldValue, reason } of [
      { description: "malformed reference", reference: 'field["Telefonnummer"] + "123"', reason: /Expected a field reference/ },
      { description: "missing field", reference: 'field["Telefonnummer"]', reason: /does not exist/ },
      { description: "malformed braced reference", reference: '{field["Telefonnummer"]', reason: /Expected a field reference/ },
      { description: "blank field", reference: '{field["Telefonnummer"]}', fieldValue: "  ", reason: /must contain non-empty text/ },
      { description: "non-text field value", reference: 'field["Telefonnummer"]', fieldValue: ["+49123456789"], reason: /must contain non-empty text/ },
      { description: "invalid phone number", reference: 'field["Telefonnummer"]', fieldValue: "abc", reason: /must contain an international phone number/ },
    ]) {
      it("should reject a " + description + " before creating an envelope", async () => {
        const { env, api } = await createSigningTest(reference);
        if (fieldValue !== undefined) {
          env.instanceDetails.extras.fieldContents!["Telefonnummer"] =
            typeof fieldValue === "string" ? { type: "ProcessHubTextInput", value: fieldValue } : { type: "ProcessHubFileUpload", value: fieldValue };
        }

        await rejects(serviceLogic(env, api, mockConfigFile), {
          errorCode: ErrorCode.ConfigInvalid,
          message: new RegExp("^signerPhoneNumber: .*" + reason.source),
        });
        sinon.assert.notCalled(api.createEnvelope);
      });
    }

    it("should enable Phone Authentication for a standard signer using a process field", async () => {
      const { env, api } = await createSigningTest('field["Telefonnummer"]', { signatureProvider: "", phoneAuthenticationCountryCode: "+49" });
      env.instanceDetails.extras.fieldContents!["Telefonnummer"] = { type: "ProcessHubTextInput", value: "+4915112345678" };

      await serviceLogic(env, api, mockConfigFile);

      expect((api.createEnvelope.firstCall.args[1] as ICreateEnvelopeRequest).phoneAuthentication).to.deep.equal({
        countryCode: "49",
        number: "15112345678",
      });
    });

    it("should derive the Phone Authentication country calling code from the current process field", async () => {
      for (const [phoneNumber, countryCode, number] of [
        ["+12025550123", "1", "2025550123"],
        ["+4915112345678", "49", "15112345678"],
        ["+358401234567", "358", "401234567"],
      ]) {
        const { env, api } = await createSigningTest('field["Telefonnummer"]', { signatureProvider: "", phoneAuthenticationCountryCode: "auto" });
        env.instanceDetails.extras.fieldContents!["Telefonnummer"] = { type: "ProcessHubTextInput", value: phoneNumber };

        await serviceLogic(env, api, mockConfigFile);

        sinon.assert.calledOnce(api.createEnvelope);
        expect((api.createEnvelope.firstCall.args[1] as ICreateEnvelopeRequest).phoneAuthentication).to.deep.equal({ countryCode, number });
      }
    });

    it("should reject unknown country codes and local numbers with automatic Phone Authentication", async () => {
      for (const phoneNumber of ["+999123456789", "015112345678"]) {
        const { env, api } = await createSigningTest(phoneNumber, { signatureProvider: "", phoneAuthenticationCountryCode: "auto" });

        await rejects(serviceLogic(env, api, mockConfigFile), {
          errorCode: ErrorCode.ConfigInvalid,
          message: /Phone Authentication requires an international phone number in E\.164 format/,
        });
        sinon.assert.notCalled(api.createEnvelope);
      }
    });

    it("should reject noncanonical international numbers in both Phone Authentication modes", async () => {
      for (const phoneAuthenticationCountryCode of ["auto", "+49"]) {
        const { env, api } = await createSigningTest("+49015112345678", { signatureProvider: "", phoneAuthenticationCountryCode });

        await rejects(serviceLogic(env, api, mockConfigFile), {
          errorCode: ErrorCode.ConfigInvalid,
          message: /Phone Authentication requires an international phone number in E\.164 format/,
        });
        sinon.assert.notCalled(api.getAccessToken);
        sinon.assert.notCalled(api.createEnvelope);
      }
    });

    it("should reject Phone Authentication with a mismatched country calling code", async () => {
      for (const phoneAuthenticationCountryCode of ["+43", "+4"]) {
        const { env, api } = await createSigningTest("+4915112345678", { signatureProvider: "", phoneAuthenticationCountryCode });

        await rejects(serviceLogic(env, api, mockConfigFile), {
          errorCode: ErrorCode.ConfigInvalid,
          message: /Phone Authentication requires an international phone number/,
        });
        sinon.assert.notCalled(api.getAccessToken);
        sinon.assert.notCalled(api.createEnvelope);
      }
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
        deleteEnvelope: sinon.stub(),
        purgeEnvelope: sinon.stub(),
      };

      await serviceLogic(env, docusignApi, mockConfigFile);

      expect(docusignApi.createEnvelope.calledOnce).to.equal(true);
      const envelopeArg: ICreateEnvelopeRequest = docusignApi.createEnvelope.getCall(0).args[1];
      expect(envelopeArg.webhookUrl).to.match(/webhook\/v1\/trigger\/.*BoundaryEvent_6801F3B0685A7268/);

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
        deleteEnvelope: sinon.stub(),
        purgeEnvelope: sinon.stub(),
      };

      const customBase = "https://example.com/roxtra/";
      await serviceLogic(env, docusignApi, { ...mockConfigFile, callbackUrlBase: customBase });

      const envelopeArg: ICreateEnvelopeRequest = docusignApi.createEnvelope.getCall(0).args[1];
      expect(envelopeArg.webhookUrl).to.match(/^https:\/\/example\.com\/roxtra\/modules\/webhook\/v1\/trigger\/.*BoundaryEvent_6801F3B0685A7268/);
    });
  });
});
