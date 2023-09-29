import { ErrorCodes, ICreateFileRequestBody, IMissingField, IRequestHeader, ISelection, ISetFileFieldsObject } from "./roxtrafileapitypes";
import * as fs from "fs";
import { IRoXtraFileApi, IRoXtraFileDetails } from "./iroxtrafileapi";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror";
import { IServiceActionConfigField } from "processhub-sdk/lib/data/datainterfaces";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

async function post<T>(apiUrl: string, requestBody: ICreateFileRequestBody | ISetFileFieldsObject[], eftoken: string, token: string): Promise<AxiosResponse<T>> {
  const headers: IRequestHeader = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    authtoken: token,
  };

  const req: AxiosRequestConfig = {
    method: "POST",
    data: JSON.stringify(requestBody),
    headers: headers,
  };

  return await axios<T>(apiUrl, req);
}

async function get<T>(apiUrl: string, eftoken: string, token: string): Promise<AxiosResponse<T>> {
  const headers: IRequestHeader = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    authtoken: token,
  };

  const req: AxiosRequestConfig = {
    method: "GET",
    headers: headers,
  };
  return await axios<T>(apiUrl, req);
}

export class RoXtraFileApi implements IRoXtraFileApi {
  public async createRoxFileCall(apiUrl: string, body: ICreateFileRequestBody, eftoken: string, token: string): Promise<IRoXtraFileDetails> {
    const response = await post<IRoXtraFileDetails>(apiUrl + "CreateNewDocument", body, eftoken, token);
    if (response.status === 200) {
      return response.data;
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }

  public async setFileFieldsCall(apiUrl: string, body: ISetFileFieldsObject[], fileId: string, eftoken: string, token: string): Promise<unknown> {
    const response = await post(apiUrl + "SetFileFields/" + fileId, body, eftoken, token);
    if (response.status === 200) {
      return response.data;
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }

  public async getSelectionsCall(apiUrl: string, eftoken: string, token: string): Promise<ISelection[]> {
    const response = await get<ISelection[]>(apiUrl + "GetSelections", eftoken, token);
    if (response.status === 200) {
      return response.data;
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }

  public async getFileDetailsCall(apiUrl: string, fileID: string, eftoken: string, token: string): Promise<IRoXtraFileDetails> {
    const response = await get<IRoXtraFileDetails>(apiUrl + "GetFileDetails/" + fileID, eftoken, token);
    if (response.status === 200) {
      return response.data;
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }
}

export async function readFileBase64Async(path: string): Promise<string> {
  return await new Promise<string>((resolve, reject): void => {
    fs.readFile(path, "base64", (err, buf) => {
      if (err) {
        reject(err);
      } else {
        resolve(buf.toString());
      }
    });
  });
}

export function initRequiredFields(keys: string[], fields: IServiceActionConfigField[]): Map<string, IServiceActionConfigField> {
  const requiredFields: Map<string, IServiceActionConfigField> = new Map();

  for (const key of keys) {
    const field = fields.find((f) => f.key === key);
    if (field === undefined) {
      throw new Error(`Error in initRequiredFields: Could not find field for key ${key}, aborting!`);
    }

    requiredFields.set(key, field);
  }

  return requiredFields;
}

export function missingRequiredField(requiredFields: Map<string, IServiceActionConfigField>): IMissingField {
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
