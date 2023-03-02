import { IServiceActionConfigField } from "processhub-sdk/lib/data/datainterfaces";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { getConnectionPool } from "./database";
import { ErrorCodes } from "./executequery-service";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";

export async function executeQueryNoReturn(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
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

  query = parseAndInsertStringWithFieldContent(
    query,
    environment.instanceDetails.extras.fieldContents,
    processObject,
    environment.instanceDetails.extras.roleOwners,
    environment.sender.language || "de-DE",
    true,
  );

  if (query === undefined) {
    throw new Error("query is undefined after parseAndInsertStringWithFieldContent, cannot proceed with service!");
  }

  const pool = await getConnectionPool(fields, environment.logger);
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
