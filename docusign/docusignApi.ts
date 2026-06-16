import { createSign } from "crypto";

export interface IDocusignApi {
  getAccessToken(): Promise<string>;
  createEnvelope(token: string, request: ICreateEnvelopeRequest): Promise<IEnvelopeResponse>;
  getEnvelope(token: string, envelopeId: string): Promise<IEnvelopeResponse>;
  getRecipientSigningUrl(token: string, envelopeId: string, signerEmail: string, signerName: string, signerId: string, returnUrl?: string): Promise<string>;
  downloadCompletedDocument(token: string, envelopeId: string): Promise<Blob>;
  deleteEnvelope(token: string, envelopeId: string): Promise<boolean>;
  purgeEnvelope(token: string, envelopeId: string): Promise<boolean>;
}

export interface ICreateEnvelopeRequest {
  emailSubject: string;
  emailMessage: string;
  documentBase64: string;
  documentName: string;
  signerEmail: string;
  signerName: string;
  signerId: string;
  webhookUrl?: string;
  /** Standards-Based Signature provider name for eIDAS AES. Use "UniversalSignaturePen_OpenTrust_Hash_TSP" for EU Advanced.
   *  When set, identityVerificationWorkflowId is ignored.
   *  The recipient name must not contain: ^ : \ @ + */
  signatureProviderName?: string;
  /** Phone number incl. country code for SMS-OTP authentication with SBS (e.g. "+4912345678"). */
  signerPhoneNumber?: string;
  /** One-time password / access code for SBS authentication (alternative to signerPhoneNumber). */
  accessCode?: string;
}

export interface IEnvelopeResponse {
  envelopeId: string;
  status: string;
  uri: string;
}

const HTTP_OK = 200;
const HTTP_CREATED = 201;

class DocusignApi implements IDocusignApi {
  #baseUrl: string;
  #accountId: string;
  #integrationKey: string;
  #userId: string;
  #oauthBasePath: string;
  #privateKey: string;

  public constructor(baseUrl: string, accountId: string, integrationKey: string, userId: string, oauthBasePath: string, privateKey: string) {
    this.#baseUrl = baseUrl;
    this.#accountId = accountId;
    this.#integrationKey = integrationKey;
    this.#userId = userId;
    this.#oauthBasePath = oauthBasePath;
    this.#privateKey = privateKey;
  }

  /**
   * Create a JWT
   * https://developers.docusign.com/platform/auth/jwt-get-token/
   */
  private buildJwt(integrationKey: string, userId: string, oauthBasePath: string, privateKey: string): string {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    // Current unix epoch time
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        iss: integrationKey,
        sub: userId,
        aud: oauthBasePath,
        iat: now,
        exp: now + 6000,
        scope: "signature impersonation",
      }),
    ).toString("base64url");
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${payload}`);
    const signature = signer.sign(privateKey, "base64url");
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Obtain the access token
   * https://developers.docusign.com/platform/auth/jwt-get-token/
   */
  public async getAccessToken(): Promise<string> {
    const jwt = this.buildJwt(this.#integrationKey, this.#userId, this.#oauthBasePath, this.#privateKey);
    const url = `https://${this.#oauthBasePath}/oauth/token`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    if (response.status !== HTTP_OK) {
      throw new Error(`DocuSign OAuth token request failed: ${url} returned ${response.status}: ${await response.text()}`);
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const body = (await response.json()) as { access_token: string };
    return body.access_token;
  }

  /**
   * Creates and sends an envelope or creates a draft envelope.
   * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/create/
   * @param token The external account number (int) or account ID GUID.
   * @param request The envelope creation request details.
   * @returns The response containing the envelope ID and status.
   */
  public async createEnvelope(token: string, request: ICreateEnvelopeRequest): Promise<IEnvelopeResponse> {
    const url = `${this.#baseUrl}/accounts/${this.#accountId}/envelopes`;
    const signer: Record<string, unknown> = {
      clientUserId: request.signerId,
      email: request.signerEmail,
      name: request.signerName,
      recipientId: "1",
      routingOrder: "1",
    };
    // Standards-based signatures
    // https://developers.docusign.com/docs/esign-rest-api/esign101/concepts/standards-based-signatures/
    if (request.signatureProviderName) {
      // QES providers use the recipientSignatureProviders array; AES uses direct fields
      const isQES = request.signatureProviderName.includes("QES");
      if (isQES) {
        // Qualified Electronic Signature — identity verified by a QTSP (IDnow, Namirial, etc.)
        // Phone/OTP not applicable here — identification happens via video-chat with the QTSP
        signer["recipientSignatureProviders"] = [
          {
            signatureProviderName: request.signatureProviderName,
            signatureProviderOptions: {},
          },
        ];
      } else {
        // Both AES and QES use the recipientSignatureProviders array
        const providerOptions: Record<string, string> = {};
        if (request.signerPhoneNumber) {
          providerOptions["sms"] = request.signerPhoneNumber;
        } else if (request.accessCode) {
          providerOptions["oneTimePassword"] = request.accessCode;
        }
        signer["recipientSignatureProviders"] = [
          {
            signatureProviderName: request.signatureProviderName,
            signatureProviderOptions: providerOptions,
          },
        ];
      }
    }
    const body: Record<string, unknown> = {
      emailSubject: request.emailSubject,
      emailBlurb: request.emailMessage,
      documents: [
        {
          documentBase64: request.documentBase64,
          name: request.documentName,
          fileExtension: request.documentName.split(".").pop() ?? "pdf",
          documentId: "1",
        },
      ],
      recipients: { signers: [signer] },
      status: "sent",
    };
    if (request.webhookUrl) {
      body["eventNotification"] = {
        url: request.webhookUrl,
        loggingEnabled: true,
        requireAcknowledgment: true,
        envelopeEvents: [{ envelopeEventStatusCode: "completed" }, { envelopeEventStatusCode: "declined" }, { envelopeEventStatusCode: "voided" }],
        includeCertificateOfCompletion: "false",
        includeDocuments: "false",
        // Use the structured eventData format to get a minimal JSON payload
        eventData: {
          version: "restv2.1",
          // Only include envelope summary fields (status, envelopeId, sentDateTime etc.) — no documents, no recipients detail
          includeData: [],
        },
      };
    }
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (response.status !== HTTP_CREATED) {
      throw new Error(`DocuSign create envelope failed: ${url} returned ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as IEnvelopeResponse;
  }

  /**
   * Retrieves the overall status for the specified envelope.
   * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/get/
   * @param token The external account number (int) or account ID GUID.
   * @param envelopeId The envelope's GUID.
   * @returns The response containing the envelope ID and status.
   */
  public async getEnvelope(token: string, envelopeId: string): Promise<IEnvelopeResponse> {
    const url = `${this.#baseUrl}/accounts/${this.#accountId}/envelopes/${envelopeId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status !== HTTP_OK) {
      throw new Error(`DocuSign get envelope failed: ${url} returned ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as IEnvelopeResponse;
  }

  /**
   * Returns a URL that enables you to embed the recipient view of the Docusign UI in your applications. If the recipient is a signer, then the view will provide the signing ceremony.
   * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopeviews/createrecipient/
   * @param token The external account number (int) or account ID GUID.
   * @param envelopeId The ID of the draft envelope or template to preview.
   * @param signerEmail The email address of the signer.
   * @param signerName The name of the signer.
   * @param signerId The clientUserId of the signer
   * @param returnUrl The URL to redirect the signer after signing.
   * @returns The URL for the embedded signing view.
   */
  public async getRecipientSigningUrl(token: string, envelopeId: string, signerEmail: string, signerName: string, signerId: string, returnUrl?: string): Promise<string> {
    const url = `${this.#baseUrl}/accounts/${this.#accountId}/envelopes/${envelopeId}/views/recipient`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        authenticationMethod: "none",
        email: signerEmail,
        userName: signerName,
        clientUserId: signerId,
        returnUrl,
      }),
    });
    if (response.status !== HTTP_CREATED) {
      throw new Error(`DocuSign get recipient signing URL failed: ${url} returned ${response.status}: ${await response.text()}`);
    }
    const body = (await response.json()) as { url: string };
    return body.url;
  }

  /**
   * Retrieves a single document or all documents from an envelope.
   * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopedocuments/get/
   * @param token The external account number (int) or account ID GUID.
   * @param envelopeId The ID of the envelope containing the documents.
   * @returns The combined document as a Blob.
   */
  public async downloadCompletedDocument(token: string, envelopeId: string): Promise<Blob> {
    // Downloads the combined document (all documents merged) from the completed envelope
    const url = `${this.#baseUrl}/accounts/${this.#accountId}/envelopes/${envelopeId}/documents/combined`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status !== HTTP_OK) {
      throw new Error(`DocuSign document download failed: ${url} returned ${response.status}: ${await response.text()}`);
    }
    return response.blob();
  }

  /**
   * This method enables you to delete an envelope by moving it to the recycle bin. Envelopes in the recycle bin are automatically purged after 30 days. To immediately and permanently delete an envelope, use the Purge method.
   * https://developers.docusign.com/docs/esign-rest-api/reference/folders/folders/moveenvelopes/
   * @param token The external account number (int) or account ID GUID.
   * @param envelopeId The ID of the envelope to purge.
   * @returns True if the envelope was successfully queued for purge.
   */
  public async deleteEnvelope(token: string, envelopeId: string): Promise<boolean> {
    const url = `${this.#baseUrl}/accounts/${this.#accountId}/folders/recyclebin`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ envelopeIds: [envelopeId] }),
    });
    if (response.status !== HTTP_OK) {
      throw new Error(`DocuSign purge envelope failed: ${url} returned ${response.status}: ${await response.text()}`);
    }
    return true;
  }

  /**
   * This method enables you to purge the documents from a completed envelope.
   * https://developers.docusign.com/docs/esign-rest-api/reference/envelopes/envelopes/update/
   * @param token The external account number (int) or account ID GUID.
   * @param envelopeId The ID of the envelope to purge.
   * @returns True if the envelope was successfully queued for purge.
   */
  public async purgeEnvelope(token: string, envelopeId: string): Promise<boolean> {
    const url = `${this.#baseUrl}/accounts/${this.#accountId}/envelopes/${envelopeId}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ purgeState: "documents_queued" }),
    });
    if (response.status !== HTTP_OK) {
      throw new Error(`DocuSign purge envelope failed: ${url} returned ${response.status}: ${await response.text()}`);
    }
    return true;
  }
}

export default DocusignApi;
