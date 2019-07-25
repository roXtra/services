import { assert } from "chai";
import fs = require("fs");
import * as PH from "processhub-sdk";
import * as ProjectReaderService from "./projectreader-service";

describe("services", () => {
  describe("csv", () => {

    function createEnvironment(path: string, bpmnTaskId: string, inputValue: string): PH.ServiceTask.ServiceTaskEnvironment {
      let env = PH.Test.createEmptyTestServiceEnvironment(path);
      env.bpmnTaskId = bpmnTaskId;
      env.fieldContents = { "ID": { type: "ProcessHubTextInput", value: inputValue } };
      env.instanceDetails.extras.fieldContents = { "ID": { type: "ProcessHubTextInput", value: inputValue } };
      return env;
    }

    it("executes CSV ProjectReader service test_6623c33a-dd82-465e-921f-57ccf1ddfa92", async () => {
      const column1 = ["A1", "A2", "A3", "A4", "A5", "A6", "A7"];

      for (let i = 0, len = column1.length; i < len; i++) {
        const j = i + 1;
        let env: PH.ServiceTask.ServiceTaskEnvironment = createEnvironment("./csv/testfiles/csvprojectreader.bpmn", "ServiceTask_EF35559B7A880A91", column1[i]);
        await ProjectReaderService.serviceLogic(env);
        assert.equal((env.instanceDetails.extras.fieldContents.ID as PH.Data.FieldValue).value as string, "A" + j);
        assert.equal((env.instanceDetails.extras.fieldContents.column1 as PH.Data.FieldValue).value as string, "A" + j);
        assert.equal((env.instanceDetails.extras.fieldContents.column2 as PH.Data.FieldValue).value as string, "B" + j);
        assert.equal((env.instanceDetails.extras.fieldContents.column3 as PH.Data.FieldValue).value as string, "C" + j);
        assert.equal((env.instanceDetails.extras.fieldContents.column4 as PH.Data.FieldValue).value as string, "D" + j);
        assert.equal((env.instanceDetails.extras.fieldContents.column5 as PH.Data.FieldValue).value as string, "E" + j);
        assert.isUndefined(env.instanceDetails.extras.fieldContents["Info"] as PH.Data.FieldValue);
      }
    });

    it("executes CSV ProjectReader service test with wrong ID_82f44d87-4535-4bdd-8735-e15fb3a57a63", async () => {
      let env: PH.ServiceTask.ServiceTaskEnvironment = createEnvironment("./csv/testfiles/csvprojectreader.bpmn", "ServiceTask_EF35559B7A880A91", "Z");
      await ProjectReaderService.serviceLogic(env);
      assert.equal((env.instanceDetails.extras.fieldContents.ID as PH.Data.FieldValue).value as string, "Z");
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column1 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column2 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column3 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column4 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column5 as PH.Data.FieldValue));
      assert.equal(((env.instanceDetails.extras.fieldContents["Info"] as PH.Data.FieldValue).value as string), "Kein Projekt mit diesem Suchbegriff gefunden");
    });

    it("executes CSV ProjectReader service test with wrong path_1aea29df-8a3c-4163-b86c-19bcb028a452", async () => {
      let env: PH.ServiceTask.ServiceTaskEnvironment = createEnvironment("./csv/testfiles/csvprojectreader.bpmn", "ServiceTask_355880496663D62A", "Z");
      await ProjectReaderService.serviceLogic(env);
      assert.equal((env.instanceDetails.extras.fieldContents.ID as PH.Data.FieldValue).value as string, "Z");
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column1 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column2 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column3 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column4 as PH.Data.FieldValue));
      assert.isUndefined((env.instanceDetails.extras.fieldContents.column5 as PH.Data.FieldValue));
      assert.equal(((env.instanceDetails.extras.fieldContents["Info"] as PH.Data.FieldValue).value as string), "Keine Datei mit diesem Pfad gefunden");
    });
  });
});