import * as mysql from "mysql";
import * as PH from "processhub-sdk";

export async function executeQuery(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;

  const server = fields.find(f => f.key === "server").value;
  const user = fields.find(f => f.key === "username").value;
  const password = fields.find(f => f.key === "password").value;
  const database = fields.find(f => f.key === "database").value;
  let query = fields.find(f => f.key === "query").value;
  const targetField = fields.find(f => f.key === "targetField").value;

  // Config for your database
  const connection = mysql.createConnection({
    user: user,
    password: password,
    host: server,
    database: database
  });

  // Connect to your database
  try {

    connection.connect();

    query = PH.Data.parseAndInsertStringWithFieldContent(query, environment.fieldContents, processObject, environment.instanceDetails.extras.roleOwners);
    const res = await new Promise<any[]>((resolve, reject) => {
      connection.query(query, function (error: mysql.MysqlError | null, results: any[]) {
        if (error) reject(error);
        resolve(results);
      });
    });

    if (res.length > 0) {
      (environment.instanceDetails.extras.fieldContents[targetField] as PH.Data.FieldValue).value = res[0]["result"];
      await environment.instances.updateInstance(environment.instanceDetails);
    }
    connection.end();
  } catch (ex) {
    // Res.status(500).send({ message: "${err}" });
    return false;
  } finally {
    connection.end();
  }
  return true;
}