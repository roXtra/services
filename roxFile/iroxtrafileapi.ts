import * as Types from "./roxtraFileAPITypes";

export interface IRoXtraFileApi {
  getFileDetailsCall(APIUrl: string, fileID: string, eftoken: string, token: string): Promise<any>;
  getSelectionsCall(APIUrl: string, eftoken: string, token: string): Promise<Types.Selection[]>;
  setFileFieldsCall(APIUrl: string, body: Types.SetFileFieldsObject[], fileId: string, eftoken: string, token: string): Promise<any>;
  createRoxFileCall(APIUrl: string, body: Types.CreateFileRequestBody, eftoken: string, token: string): Promise<any>;
}