import * as sql from "mssql";
import * as PH from "processhub-sdk";
import { IServiceActionConfigField } from "processhub-sdk/lib/data";
import { BpmnError } from "processhub-sdk/lib/instance";
import { ErrorCodes } from "./executequery-service";

export async function executeQueryNoReturn(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;

  const server = fields.find((f: IServiceActionConfigField) => f.key === "server")?.value;
  const user = fields.find((f: IServiceActionConfigField) => f.key === "username")?.value;
  const password = fields.find((f: IServiceActionConfigField) => f.key === "password")?.value;
  const database = fields.find((f: IServiceActionConfigField) => f.key === "database")?.value;
  let query = fields.find((f: IServiceActionConfigField) => f.key === "query")?.value;

  if (server === undefined) {
    throw new Error("server is undefined, cannot proceed with service!");
  }
  if (user === undefined) {
    throw new Error("user is undefined, cannot proceed with service!");
  }
  if (password === undefined) {
    throw new Error("password is undefined, cannot proceed with service!");
  }
  if (database === undefined) {
    throw new Error("database is undefined, cannot proceed with service!");
  }
  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed with service!");
  }

  if (environment.instanceDetails.extras.roleOwners === undefined) {
    throw new Error("environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }

  query = PH.Data.parseAndInsertStringWithFieldContent(
    query,
    environment.instanceDetails.extras.fieldContents,
    processObject,
    environment.instanceDetails.extras.roleOwners,
    true,
  );

  if (query === undefined) {
    throw new Error("query is undefined after parseAndInsertStringWithFieldContent, cannot proceed with service!");
  }

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
    throw new BpmnError(ErrorCodes.DB_ERROR, String(ex));
  } finally {
    await pool.close();
  }
  return true;
}
