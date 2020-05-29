import fs from "fs";
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

  public createRoxFileResponses(): void {
    NockServer.stopNock();

    this.scope
      .get("/modules/files/doc.docx")
      .reply(200, fs.readFileSync("./Test/Testfiles/doc.docx"));
  }
}