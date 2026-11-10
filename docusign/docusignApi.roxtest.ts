import { rejects } from "node:assert/strict";
import { expect } from "chai";
import sinon from "sinon";
import DocusignApi, { ICreateEnvelopeRequest } from "./docusignApi.js";

describe("DocusignApi.createEnvelope", () => {
  const baseUrl = "https://demo.docusign.net/restapi/v2.1";
  const accountId = "account_123";
  const accountUrl = `${baseUrl}/accounts/${accountId}`;
  const api = new DocusignApi(baseUrl, accountId, "integration_123", "user_123", "account-d.docusign.com", "private_key");
  const request: ICreateEnvelopeRequest = {
    emailSubject: "Please sign",
    emailMessage: "",
    documentBase64: "VEVTVA==",
    documentName: "document.pdf",
    signerEmail: "signer@example.com",
    signerName: "Test Signer",
  };
  const phoneAuthentication = { countryCode: "49", number: "15123456789" };
  const envelopeResponse = { envelopeId: "envelope_123", status: "sent", uri: "/envelopes/envelope_123" };
  const sandbox = sinon.createSandbox();

  afterEach(() => sandbox.restore());

  it("sets recipient identity verification using the account's Phone Authentication workflow", async () => {
    const fetchStub = sandbox.stub(globalThis, "fetch");
    fetchStub.onFirstCall().resolves(
      Response.json({
        identityVerification: [
          { defaultName: "Docusign ID Verification", workflowId: "other_workflow" },
          { defaultName: "Phone Authentication", workflowId: "phone_workflow" },
        ],
      }),
    );
    fetchStub.onSecondCall().resolves(Response.json(envelopeResponse, { status: 201 }));

    expect(await api.createEnvelope("token", { ...request, phoneAuthentication })).to.deep.equal(envelopeResponse);

    sinon.assert.calledTwice(fetchStub);
    expect(fetchStub.firstCall.args[0]).to.equal(`${accountUrl}/identity_verification`);
    expect(fetchStub.firstCall.args[1]?.method ?? "GET").to.equal("GET");
    expect(new Headers(fetchStub.firstCall.args[1]?.headers).get("Authorization")).to.equal("Bearer token");
    expect(fetchStub.secondCall.args[0]).to.equal(`${accountUrl}/envelopes`);
    expect(fetchStub.secondCall.args[1]?.method).to.equal("POST");
    const body = JSON.parse(fetchStub.secondCall.args[1]?.body as string) as { recipients: { signers: Record<string, unknown>[] } };
    expect(body.recipients.signers[0].identityVerification).to.deep.include({
      workflowId: "phone_workflow",
      inputOptions: [{ name: "phone_number_list", valueType: "PhoneNumberList", phoneNumberList: [phoneAuthentication] }],
    });
  });

  it("does not send an envelope when the Phone Authentication workflow is unavailable", async () => {
    const fetchStub = sandbox.stub(globalThis, "fetch").resolves(Response.json({ identityVerification: [] }));

    await rejects(api.createEnvelope("token", { ...request, phoneAuthentication }), /Phone Authentication/);

    sinon.assert.calledOnce(fetchStub);
    expect(fetchStub.firstCall.args[0]).to.equal(`${accountUrl}/identity_verification`);
  });

  it("sets the recipient's access code on a standard signature", async () => {
    const fetchStub = sandbox.stub(globalThis, "fetch").resolves(Response.json(envelopeResponse, { status: 201 }));
    const recipientAccessCode = "004219";

    await api.createEnvelope("token", { ...request, recipientAccessCode });

    sinon.assert.calledOnce(fetchStub);
    expect(fetchStub.firstCall.args[0]).to.equal(`${accountUrl}/envelopes`);
    const body = JSON.parse(fetchStub.firstCall.args[1]?.body as string) as { recipients: { signers: Record<string, unknown>[] } };
    const signer = body.recipients.signers[0];
    expect(signer.accessCode).to.equal(recipientAccessCode);
    expect(signer).not.to.have.property("recipientSignatureProviders");
  });

  it("sends the recipient access code alongside Phone Authentication for the same signer", async () => {
    const fetchStub = sandbox.stub(globalThis, "fetch");
    fetchStub.onFirstCall().resolves(Response.json({ identityVerification: [{ defaultName: "Phone Authentication", workflowId: "phone_workflow" }] }));
    fetchStub.onSecondCall().resolves(Response.json(envelopeResponse, { status: 201 }));
    const recipientAccessCode = "004219";

    await api.createEnvelope("token", { ...request, recipientAccessCode, phoneAuthentication });

    sinon.assert.calledTwice(fetchStub);
    expect(fetchStub.secondCall.args[0]).to.equal(`${accountUrl}/envelopes`);
    const body = JSON.parse(fetchStub.secondCall.args[1]?.body as string) as { recipients: { signers: Record<string, unknown>[] } };
    const signer = body.recipients.signers[0];
    expect(signer.accessCode).to.equal(recipientAccessCode);
    expect(signer.identityVerification).to.deep.include({ workflowId: "phone_workflow" });
  });

  it("keeps the recipient access code separate from the EU Advanced one-time password", async () => {
    const fetchStub = sandbox.stub(globalThis, "fetch").resolves(Response.json(envelopeResponse, { status: 201 }));
    const signatureProviderName = "UniversalSignaturePen_OpenTrust_Hash_TSP";
    const recipientAccessCode = "004219";
    const accessCode = "572061";

    await api.createEnvelope("token", { ...request, signatureProviderName, recipientAccessCode, accessCode });

    sinon.assert.calledOnce(fetchStub);
    const body = JSON.parse(fetchStub.firstCall.args[1]?.body as string) as { recipients: { signers: Record<string, unknown>[] } };
    const signer = body.recipients.signers[0];
    expect(signer.accessCode).to.equal(recipientAccessCode);
    expect(signer).not.to.have.property("recipientAccessCode");
    expect(signer.recipientSignatureProviders).to.deep.equal([{ signatureProviderName, signatureProviderOptions: { oneTimePassword: accessCode } }]);
  });

  it("prefers EU Advanced SMS over a one-time password when Phone Authentication is disabled", async () => {
    const fetchStub = sandbox.stub(globalThis, "fetch").resolves(Response.json(envelopeResponse, { status: 201 }));
    const signatureProviderName = "UniversalSignaturePen_OpenTrust_Hash_TSP";
    const signerPhoneNumber = "+4915123456789";

    await api.createEnvelope("token", { ...request, signatureProviderName, signerPhoneNumber, accessCode: "572061" });

    sinon.assert.calledOnce(fetchStub);
    expect(fetchStub.firstCall.args[0]).to.equal(`${accountUrl}/envelopes`);
    const body = JSON.parse(fetchStub.firstCall.args[1]?.body as string) as { recipients: { signers: Record<string, unknown>[] } };
    const signer = body.recipients.signers[0];
    expect(signer).not.to.have.property("identityVerification");
    expect(signer.recipientSignatureProviders).to.deep.equal([{ signatureProviderName, signatureProviderOptions: { sms: signerPhoneNumber } }]);
  });
});
