import nock from "nock";

export class NockServer {
  private scope: nock.Scope;

  constructor(baseURL: string) {
    this.scope = nock(baseURL).persist();
  }

  public static stopNock(): void {
    nock.abortPendingRequests();
    nock.cleanAll();
  }

  public createResponse(testGuid: string, response: string): void {
    NockServer.stopNock();
    this.scope.post("/" + testGuid).reply(200, response);
  }
}
