import * as mysql from "mysql";
import * as PH from "processhub-sdk";

export async function executeQuery(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;

  const server = fields.find((f) => f.key === "server").value;
  const user = fields.find((f) => f.key === "username").value;
  const password = fields.find((f) => f.key === "password").value;
  const database = fields.find((f) => f.key === "database").value;
  const port = fields.find((f) => f.key === "port").value;
  let query = fields.find((f) => f.key === "query").value;
  const targetField = fields.find((f) => f.key === "targetField").value;

  const connection = mysql.createConnection({
    user: user,
    password: password,
    host: server,
    database: database,
    port: parseInt(port),
  });

  try {
    query = PH.Data.parseAndInsertStringWithFieldContent(query, environment.fieldContents, processObject, environment.instanceDetails.extras.roleOwners);
    console.log(`MySQL service: executing ${query}`);

    connection.connect();
    const res = await new Promise<any[]>((resolve, reject) => {
      connection.query(query, function (error: mysql.MysqlError | null, results) {
        if (error) reject(error);
        resolve(results);
      });
    });
    connection.end();
    console.log("MySQL service: connection closed.");

    if (res.length > 0) {
      if (!environment.instanceDetails.extras.fieldContents[targetField]) {
        const fields = processObject.getFieldDefinitions();
        const field = fields.find((f) => f.name === targetField);
        const targetFieldType: PH.Data.FieldType = field ? field.type : "ProcessHubTextInput";
        environment.instanceDetails.extras.fieldContents[targetField] = {
          value: undefined,
          type: targetFieldType,
        };
      }
      (environment.instanceDetails.extras.fieldContents[targetField] as PH.Data.IFieldValue).value = res[0]["result"];
      await environment.instances.updateInstance(environment.instanceDetails);
    }
  } catch (ex) {
    console.error(`MySQL service error: ${JSON.stringify(ex)}`);
    environment.instanceDetails.extras.fieldContents["MySQL error"] = {
      type: "ProcessHubTextInput",
      value: JSON.stringify(ex),
    };
    await environment.instances.updateInstance(environment.instanceDetails);
    return false;
  }
  return true;
}
