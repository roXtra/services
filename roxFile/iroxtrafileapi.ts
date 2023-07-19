import * as Types from "./roxtrafileapitypes";

export interface IRoXtraFileDetails {
  Fields: { Value: string }[];
}

export interface IRoXtraFileApi {
  getFileDetailsCall(APIUrl: string, fileID: string, eftoken: string, token: string): Promise<IRoXtraFileDetails>;
  getSelectionsCall(APIUrl: string, eftoken: string, token: string): Promise<Types.ISelection[]>;
  setFileFieldsCall(APIUrl: string, body: Types.ISetFileFieldsObject[], fileId: string, eftoken: string, token: string): Promise<unknown>;
  createRoxFileCall(APIUrl: string, body: Types.ICreateFileRequestBody, eftoken: string, token: string): Promise<IRoXtraFileDetails>;
}
