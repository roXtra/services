import * as Types from "./roxtrafileapitypes";

export interface IRoXtraFileApi {
  getFileDetailsCall(APIUrl: string, fileID: string, eftoken: string, token: string): Promise<any>;
  getSelectionsCall(APIUrl: string, eftoken: string, token: string): Promise<Types.ISelection[]>;
  setFileFieldsCall(APIUrl: string, body: Types.ISetFileFieldsObject[], fileId: string, eftoken: string, token: string): Promise<any>;
  createRoxFileCall(APIUrl: string, body: Types.ICreateFileRequestBody, eftoken: string, token: string): Promise<any>;
}