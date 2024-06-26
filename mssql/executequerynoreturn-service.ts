import { IServiceActionConfigField } from "processhub-sdk/lib/data/datainterfaces.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { getConnectionPool } from "./database.js";
import { ErrorCodes } from "./executequery-service.js";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools.js";

export async function executeQueryNoReturn(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
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
    await environment.roxApi.getUsersConfig(),
    true,
  );

  if (query === undefined) {
    throw new Error("query is undefined after parseAndInsertStringWithFieldContent, cannot proceed with service!");
  }

  const pool = await getConnectionPool(fields, environment.logger, configPath);
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
