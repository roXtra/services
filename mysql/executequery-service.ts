const mysql = require("mysql");
import * as PH from "processhub-sdk";

export async function executeQuery(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;

  let server = fields.find(f => f.key == "server").value;
  let user = fields.find(f => f.key == "username").value;
  let password = fields.find(f => f.key == "password").value;
  let database = fields.find(f => f.key == "database").value;
  let query = fields.find(f => f.key == "query").value;
  let targetField = fields.find(f => f.key == "targetField").value;

  // config for your database
  let connection = mysql.createConnection({
    user: user,
    password: password,
    host: server,
    database: database
  });

  // connect to your database
  try {

    connection.connect();

    query = PH.Data.parseAndInsertStringWithFieldContent(query, environment.fieldContents, processObject, environment.instanceDetails.extras.roleOwners);
    connection.query(query, async function (error: any, results: any[], fields: any) {
      if (error) throw error;

      if (results.length > 0) {
        (environment.instanceDetails.extras.fieldContents[targetField] as PH.Data.FieldValue).value = results[0]["result"];
        await environment.instances.updateInstance(environment.instanceDetails);
      }
      connection.end();
    });
  } catch (ex) {
    // res.status(500).send({ message: "${err}" });
    connection.close();
    return false;
  }
  return true;
}