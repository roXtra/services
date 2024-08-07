import { readXlsxFromAttachment, readXlsxFromAttachmentConfig } from "./main.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { expect } from "chai";
import fs from "fs";
import { IDataTableFieldValue } from "processhub-sdk/lib/data/fields/datatable.js";

describe("services", () => {
  describe("datatable", () => {
    it("should check for bundled methods", () => {
      expect(typeof readXlsxFromAttachment).to.equal("function");
      expect(typeof readXlsxFromAttachmentConfig).to.equal("function");
    });

    describe("readXlsxFromAttachment", () => {
      it("should read data from an file upload field", async () => {
        const environment = createEmptyTestServiceEnvironment(fs.readFileSync("./testfiles/datatableservice-attachment.bpmn", "utf8"));
        environment.instanceDetails.extras.fieldContents = {
          Anlagen: {
            type: "ProcessHubFileUpload",
            value: ["https://test/roxtra/modules/files/1/EE230D9445C6FB91/attachments-6280C084F58F6F96/D538B28353CD1A78/bGlzdGUueGxzeA"],
          },
        };
        environment.fileStore.getPhysicalPath = () => "./testfiles/liste.xlsx";
        environment.bpmnTaskId = "ServiceTask_88CD77E856071A65";

        const result = await readXlsxFromAttachment(environment);
        expect(result).to.equal(true);
        const resultField = environment.instanceDetails.extras.fieldContents["Büros"];
        expect(resultField!.type).to.equal("ProcessHubDataTable");
        const fieldValue = resultField!.value as IDataTableFieldValue;
        expect(fieldValue).not.to.equal(undefined);
        expect(fieldValue.rows.length).to.equal(20);
        for (const row of fieldValue.rows) {
          expect(row.selected).to.equal(false);
          expect(typeof row.data.Name).to.equal("string");
          expect(typeof row.data.Adresse).to.equal("string");
          expect(typeof row.data.Telefonnummer).to.equal("string");
          expect(typeof row.data.Kostenstelle).to.equal("number");
        }
      });
    });
  });
});
