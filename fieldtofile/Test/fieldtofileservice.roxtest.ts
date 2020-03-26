
import * as PH from "processhub-sdk";
import { assert } from "chai";
import * as fs from "fs";
import { executeFieldToFile } from "../fieldtofile-service";
import { MockServer } from "./mockServer";

describe("services", () => {
  describe("fieldtofile", () => {
    let env: PH.ServiceTask.IServiceTaskEnvironment;
    let fieldContents: PH.Data.IFieldContentMap;
    let filePath: string;

    function createEnvironment(): PH.ServiceTask.IServiceTaskEnvironment {
      const env = PH.Test.createEmptyTestServiceEnvironment(fs.readFileSync("./Test/Testfiles/fieldtofile-test-prozess.bpmn", "utf8"));
      env.bpmnTaskId = "ServiceTask_1EAFF51C050DA204";
      return env;
    }

    before(async function () {
      await MockServer.initMockServer();
    });

    beforeEach(function () {
      env = createEnvironment();
      fieldContents = env.fieldContents;
      filePath = "";
    });

    after(async function () {
      await MockServer.stopMockServer();
    });

    afterEach(function () {
      fs.unlinkSync(filePath);
    });

    it("Testing executeFieldToFile_DEC7AFC8-74FA-43CE-ADAE-CB228FA6BAAE", async () => {
      const testfileName = "testfile_DEC7AFC8-74FA-43CE-ADAE-CB228FA6BAAE.txt";
      filePath = "./Test/Testfiles/" + testfileName;

      fieldContents["uploadfield"] = {
        value: ["http://localhost:1080/files/" + testfileName],
        type: "ProcessHubFileUpload"
      };

      const expectedFileContent = "This is a file";

      const serviceResult = await executeFieldToFile(env);

      assert.isTrue(serviceResult);
      assert.isTrue(fs.existsSync(filePath));

      const actualFileContent = fs.readFileSync(filePath).toString("utf-8");
      assert.equal(actualFileContent, expectedFileContent);
    });
  });
});