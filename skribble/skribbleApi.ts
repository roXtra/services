export interface ISkribbleApi {
  login(): Promise<string>;
  createSignatureRequest(token: string, request: ISignatureRequest): Promise<ISignatureResponse>;
  getSignatureRequest(token: string, signatureId: string): Promise<ISignatureResponse>;
  downloadDocument(token: string, documentId: string): Promise<Blob>;
  deleteDocument(token: string, documentId: string): Promise<boolean>;
}

/* eslint-disable @typescript-eslint/naming-convention */
export interface ISignatureRequest {
  title: string;
  message: string;
  content: string;
  signatures: {
    // Set if the signer is required to log in with a skribble account.
    account_email?: string;
    // Set if the signer should receive a notification email when the document is ready to be signed by skribble.
    notify: boolean;
    // Set if signer is not required to have a skribble account
    // https://api-doc.skribble.com/#bab0a0bf-ad61-4d46-8e04-ceee410199c8
    signer_identity_data?: { email_address: string; mobile_number?: string; first_name?: string; last_name?: string; language: "en" | "de" | "fr" };
  }[];
  // Is triggered when the document has been successfully signed by all parties involved.
  callback_success_url?: string;
  // Is triggered when a person declines the signature or when the SignatureRequest is withdrawn.
  callback_error_url?: string;
  // https://api-doc.skribble.com/#d7e2129b-e58f-4e73-b8d0-59ffbc975501
  quality: "QES" | "AES" | "AES_MINIMAL" | "SES" | "DEMO";
  legislation?: "ZERTES" | "EIDAS";
}

export interface ISignatureResponse {
  id: string;
  title: string;
  message: string;
  document_id: string;
  quality: string;
  // If the signer does not have a skribble account, the URL in signatures must be used to sign the document.
  signing_url: string;
  status_overall: string;
  signatures: {
    sid: string;
    account_email: string;
    order: number;
    status_code: string;
    notify: boolean;
    // Is only set if the signer has no skribble account
    signing_url: string | undefined;
  }[];
  cc_email_addresses: string[];
  owner: string;
  read_access: string[];
  write_access: string[];
  created_at: string;
  updated_at: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

const HTTP_OK = 200;
const HTTP_CREATED = 201;

class SkribbleApi implements ISkribbleApi {
  #baseUrl: string;
  #userName: string;
  #apiKey: string;

  public constructor(baseUrl: string, userName: string, apiKey: string) {
    this.#baseUrl = baseUrl;
    this.#userName = userName;
    this.#apiKey = apiKey;
  }

  public async login() {
    const url = `${this.#baseUrl}/access/login`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: this.#userName,
        "api-key": this.#apiKey,
      }),
    });

    if (response.status === HTTP_OK) {
      return await response.text();
    }

    throw new Error(`Skribble login failed: ${url} returned ${response.status}: ${await response.text()}`);
  }

  public async createSignatureRequest(token: string, request: ISignatureRequest) {
    const url = `${this.#baseUrl}/signature-requests`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (response.status === HTTP_CREATED) {
      return (await response.json()) as ISignatureResponse;
    }

    throw new Error(`Skribble signature request failed: ${url} returned ${response.status}: ${response.statusText}`);
  }

  public async getSignatureRequest(token: string, signatureId: string) {
    const url = `${this.#baseUrl}/signature-requests/${signatureId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === HTTP_OK) {
      return (await response.json()) as ISignatureResponse;
    }

    throw new Error(`Skribble get signature request failed: ${url} returned ${response.status}: ${await response.text()}`);
  }

  public async downloadDocument(token: string, documentId: string) {
    const url = `${this.#baseUrl}/documents/${documentId}/content`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === HTTP_OK) {
      return await response.blob();
    }

    throw new Error(`Skribble document download failed: ${url} returned ${response.status}: ${await response.text()}`);
  }

  public async deleteDocument(token: string, documentId: string) {
    const url = `${this.#baseUrl}/documents/${documentId}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === HTTP_OK) {
      return true;
    }

    throw new Error(`Skribble document deletion failed: ${url} returned ${response.status}: ${await response.text()}`);
  }
}

export default SkribbleApi;
