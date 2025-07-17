export interface IReadXlsxApi {
  getDocumentCall(APIUrl: string, fileID: string, eftoken: string, token: string): Promise<Buffer>;
}
