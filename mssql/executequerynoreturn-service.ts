import * as PH from "processhub-sdk";
import { IServiceActionConfigField } from "processhub-sdk/lib/data";
import { BpmnError } from "processhub-sdk/lib/instance";
import { getConnectionPool } from "./database";
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

  let query = fields.find((f: IServiceActionConfigField) => f.key === "query")?.value;

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

  const pool = getConnectionPool(fields);
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
