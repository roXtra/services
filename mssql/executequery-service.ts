const sql = require("mssql");
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
  let dbConfig = {
    user: user,
    password: password,
    server: server,
    database: database
  };

  // connect to your database
  try {
    let pool = new sql.ConnectionPool(dbConfig);
    await pool.connect();

    query = PH.Data.parseAndInsertStringWithFieldContent(query, environment.fieldContents, processObject, environment.instanceDetails.extras.roleOwners);

    let result = await pool.request().query(query);

    let rows = result.recordset;
    // res.setHeader("Access-Control-Allow-Origin", "*");
    // res.status(200).json(rows);
    if (rows.length > 0) {
      (environment.instanceDetails.extras.fieldContents[targetField] as PH.Data.FieldValue).value = rows[0].result;
      await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);
    }
    sql.close();
  } catch (ex) {
    // res.status(500).send({ message: "${err}" });
    sql.close();
    return false;
  }
  return true;
}