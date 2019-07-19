const sql = require("mssql");
import * as PH from "processhub-sdk";

export async function executeQueryNoReturn(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;

  let server = fields.find((f: any) => f.key == "server").value;
  let user = fields.find((f: any) => f.key == "username").value;
  let password = fields.find((f: any) => f.key == "password").value;
  let database = fields.find((f: any) => f.key == "database").value;
  let query = fields.find((f: any) => f.key == "query").value;
  try {
    // config for your database
    let dbConfig = {
      user: user,
      password: password,
      server: server,
      database: database
    };

    // connect to your database
    let pool = await new sql.ConnectionPool(dbConfig).connect();
    await pool.request().query(query);

    // res.setHeader("Access-Control-Allow-Origin", "*");
    // res.status(200).json(rows);
    sql.close();
  } catch (err) {
    sql.close();
    return false;
  }
  return true;
}