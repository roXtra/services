import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { IReadXlsxApi } from "./ireadXlsxApi.js";
import { ErrorCodes, IRequestHeader } from "./readXlsxApiTypes.js";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

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
    responseType: "arraybuffer",
  };
  return await axios<T>(apiUrl, req);
}

export class ReadXlsxApi implements IReadXlsxApi {
  public async getDocumentCall(apiUrl: string, fileID: string, eftoken: string, token: string): Promise<Buffer> {
    const response = await get<Buffer>(`${apiUrl}GetDocument/${fileID}`, eftoken, token);
    if (response.status === 200) {
      return response.data;
    }

    throw new BpmnError(ErrorCodes.API_ERROR, `Schnittstellenfehler: ${response.status}: ${response.statusText}`);
  }
}
