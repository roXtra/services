import * as mockserver from "mockserver-node";
import * as mockServerClient from "mockserver-client";
import * as PH from "processhub-sdk";
import fs from "fs";

export class MockServer {
  public static async initMockServer(): Promise<void> {
    await mockserver.stop_mockserver({
      serverPort: 1080
    });
    console.log("Start Mockserver");
    await mockserver.start_mockserver({
      serverPort: 1080,
      trace: true
    });
    await MockServer.initResponses();
    console.log("Started Mockserver");
  }

  public static async stopMockServer(): Promise<void> {
    console.log("Shut down Mockserver");
    await mockserver.stop_mockserver({
      serverPort: 1080
    });
    console.log("Mockserver is offline");
  }

  private static async initResponses(): Promise<void> {
    await MockServer.getFiles();
  }

  private static async getFiles(): Promise<void> {

    await mockServerClient.mockServerClient("localhost", 1080).mockAnyResponse({
      "httpRequest": {
        "method": "GET",
        "path": "/modules/files/doc.docx",
      },
      "httpResponse": {
        "statusCode": PH.LegacyApi.ApiResult.API_OK,
        "headers": {
          "Content-Type": ["application/binary"]
        },
        "body": fs.readFileSync("./Test/Testfiles/doc.docx"),
      },
    });
  }
}