import { expect } from "chai";
import * as fs from "fs";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { createEmptyTestServiceEnvironment } from "processhub-sdk/lib/test/testtools.js";
import { executeQuery } from "../main.js";

const taskIds = {
  Create: "ServiceTask_14289B964966CFB7",
  Insert: "ServiceTask_4B63FA6661D82618",
  Select: "ServiceTask_37B16A7BCCB1FFE0",
};

describe("mysql", () => {
  function createEnvironment(bpmnTaskId: string): IServiceTaskEnvironment {
    const env = createEmptyTestServiceEnvironment(fs.readFileSync("./test/testfiles/mysql-test.bpmn", "utf8"));
    env.bpmnTaskId = bpmnTaskId;
    env.instanceDetails.extras.roleOwners = {};
    env.instanceDetails.extras.fieldContents = {};
    return env;
  }

  it("executes mysql service", async () => {
    let env = createEnvironment(taskIds.Create);
    await executeQuery(env);

    env = createEnvironment(taskIds.Insert);
    await executeQuery(env);

    env = createEnvironment(taskIds.Select);
    await executeQuery(env);

    expect(env.instanceDetails.extras.fieldContents?.["Result"]).to.deep.equal({ value: "Heino", type: "ProcessHubTextInput" });
  });
});
