import * as sql from "mssql";
import * as PH from "processhub-sdk";
import { IServiceActionConfigField } from "processhub-sdk/lib/data";

export async function executeQueryNoReturn(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;

  const server = fields.find((f: IServiceActionConfigField) => f.key === "server").value;
  const user = fields.find((f: IServiceActionConfigField) => f.key === "username").value;
  const password = fields.find((f: IServiceActionConfigField) => f.key === "password").value;
  const database = fields.find((f: IServiceActionConfigField) => f.key === "database").value;
  let query = fields.find((f: IServiceActionConfigField) => f.key === "query").value;
  query = PH.Data.parseAndInsertStringWithFieldContent(query, environment.fieldContents, processObject, environment.instanceDetails.extras.roleOwners);

  // Config for your database
  const dbConfig = {
    user: user,
    password: password,
    server: server,
    database: database,
  };
  const pool = new sql.ConnectionPool(dbConfig);
  try {
    await pool.connect();
    await pool.request().query(query);
  } catch (ex) {
    console.error(`mssql service error: ${JSON.stringify(ex)}`);
    return false;
  } finally {
    await pool.close();
  }
  return true;
}
