import { ErrorCodes, ICreateFileRequestBody, IGetRequest, IMissingField, IPostRequest, IRequestHeader, ISelection, ISetFileFieldsObject } from "./roxtrafileapitypes";
import * as fs from "fs";
import * as PH from "processhub-sdk";
import { IRoXtraFileApi } from "./iroxtrafileapi";
import fetch, { Response } from "node-fetch";
import { BpmnError } from "processhub-sdk/lib/instance";

async function post(apiUrl: string, requestBody: ICreateFileRequestBody | ISetFileFieldsObject[], eftoken: string, token: string): Promise<Response> {
  const headers: IRequestHeader = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    authtoken: token,
  };

  const req: IPostRequest = {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: headers,
  };

  return await fetch(apiUrl, req);
}

async function get(apiUrl: string, eftoken: string, token: string): Promise<Response> {
  const headers: IRequestHeader = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    authtoken: token,
  };

  const req: IGetRequest = {
    method: "GET",
    headers: headers,
  };
  return await fetch(apiUrl, req);
}

export class RoXtraFileApi implements IRoXtraFileApi {
  public async createRoxFileCall(apiUrl: string, body: ICreateFileRequestBody, eftoken: string, token: string): Promise<any> {
    const response = await post(apiUrl + "CreateNewDocument", body, eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }

  public async setFileFieldsCall(apiUrl: string, body: ISetFileFieldsObject[], fileId: string, eftoken: string, token: string): Promise<any> {
    const response = await post(apiUrl + "SetFileFields/" + fileId, body, eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }

  public async getSelectionsCall(apiUrl: string, eftoken: string, token: string): Promise<ISelection[]> {
    const response = await get(apiUrl + "GetSelections", eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }

  public async getFileDetailsCall(apiUrl: string, fileID: string, eftoken: string, token: string): Promise<any> {
    const response = await get(apiUrl + "GetFileDetails/" + fileID, eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }
}

export async function readFileBase64Async(path: string): Promise<string> {
  return await new Promise<string>((resolve, reject): void => {
    fs.readFile(path, "base64", (err: any, buf: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString());
      }
    });
  });
}

export function initRequiredFields(keys: string[], fields: PH.Data.IServiceActionConfigField[]): Map<string, PH.Data.IServiceActionConfigField> {
  const requiredFields: Map<string, PH.Data.IServiceActionConfigField> = new Map();

  for (const key of keys) {
    const field = fields.find((f) => f.key === key);
    if (field === undefined) {
      throw new Error(`Error in initRequiredFields: Could not find field for key ${key}, aborting!`);
    }

    requiredFields.set(key, field);
  }

  return requiredFields;
}

export function missingRequiredField(requiredFields: Map<string, PH.Data.IServiceActionConfigField>): IMissingField {
  const keys = requiredFields.keys();
  for (const key of keys) {
    if (!requiredFields.get(key) || !requiredFields.get(key)?.value) {
      return {
        isMissing: true,
        key: key,
      };
    }
  }

  return {
    isMissing: false,
  };
}
