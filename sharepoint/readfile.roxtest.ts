import { expect } from "chai";
import { readFile, readFileConfig } from "./main.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import fs from "fs";
import sinon from "sinon";
import { ISharePointConfig, sharePoint } from "./sharepoint.js";

describe("services", () => {
  describe("sharepoint", () => {
    it("should check for bundled methods", () => {
      expect(typeof readFileConfig).to.equal("function");
      expect(typeof readFile).to.equal("function");
    });

    describe("readFile", () => {
      let sandbox: sinon.SinonSandbox;
      let readFileFromUrlStub: sinon.SinonStub<
        [ISharePointConfig],
        Promise<{
          fileContents: Buffer;
          fileName: string;
        }>
      >;

      beforeEach(() => {
        sandbox = sinon.createSandbox();
        readFileFromUrlStub = sandbox.stub(sharePoint, "readFileFromUrl").returns(
          Promise.resolve({
            fileContents: fs.readFileSync("./testfiles/liste.xlsx"),
            fileName: "liste.xlsx",
          }),
        );
      });

      afterEach(() => {
        readFileFromUrlStub.restore();
        sandbox.restore();
      });

      it("should read data from sharepoint and save as instance attachment", async () => {
        const environment = createEmptyTestServiceEnvironment(fs.readFileSync("./testfiles/sharepoint-test.bpmn", "utf8"));
        const uploadAttachmentStub = sandbox.stub(environment.instances, "uploadAttachment").returns(Promise.resolve("https://example.com/attachment"));
        environment.instances.uploadAttachment = uploadAttachmentStub;

        environment.bpmnTaskId = "ServiceTask_F4EE1E08D0729D68";
        const result = await readFile(environment);
        expect(result).to.equal(true);

        expect(uploadAttachmentStub.calledOnce).to.equal(true);
        expect(uploadAttachmentStub.getCall(0).args[1]).to.equal("liste.xlsx");

        expect(readFileFromUrlStub.calledOnce).to.equal(true);
        expect(readFileFromUrlStub.getCall(0).args[0].certThumbprint).to.equal("6D281A69221B43BEC1D3229B3B670FB74642C47A");
        expect(readFileFromUrlStub.getCall(0).args[0].clientId).to.equal("4b2135e4-df66-47e5-b5ae-5d7f9ae2003f");
        expect(readFileFromUrlStub.getCall(0).args[0].fileUrl).to.equal(
          "https://sharepointtest.sharepoint.com/:x:/r/Freigegebene%20Dokumente/liste.xlsx?d=wef0730fc72314ed5a9f7869d7f9a681f&csf=1&web=1&e=4x43Ws",
        );
        expect(readFileFromUrlStub.getCall(0).args[0].sharepointUrl).to.equal("https://sharepointtest.sharepoint.com/");
        expect(readFileFromUrlStub.getCall(0).args[0].tenantId).to.equal("d7521bf8-1dd8-44f6-9718-01aeedc53e9c");

        const attachment = environment.instanceDetails.extras.fieldContents!["Anlagen"];
        expect(attachment!.type).to.equal("ProcessHubFileUpload");
        const attachmentValue = attachment!.value as string[];
        expect(attachmentValue.length).to.equal(1);
        expect(attachmentValue[0]).to.equal("https://example.com/attachment");
      });
    });
  });
});
