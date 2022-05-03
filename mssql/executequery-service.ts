import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";
import { FieldType, FieldValueType, IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { getConnectionPool } from "./database";

export enum ErrorCodes {
  DB_ERROR = "DB_ERROR",
}

export async function executeQuery(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;

  let query = fields.find((f) => f.key === "query")?.value;
  const targetField = fields.find((f) => f.key === "targetField")?.value;

  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed with service!");
  }
  if (targetField === undefined) {
    throw new Error("targetField is undefined, cannot proceed with service!");
  }

  if (environment.instanceDetails.extras.roleOwners === undefined) {
    throw new Error("environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }
  if (environment.instanceDetails.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  const pool = getConnectionPool(fields);
  // Connect to your database
  try {
    await pool.connect();

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

    const result = await pool.request().query<{ result: FieldValueType | undefined | null }>(query);

    const rows = result.recordset;

    if (rows.length > 0) {
      if (!environment.instanceDetails.extras.fieldContents?.[targetField]) {
        const fields = processObject.getFieldDefinitions();
        const field = fields.find((f) => f.name === targetField);
        const targetFieldType: FieldType = field ? field.type : "ProcessHubTextInput";

        environment.instanceDetails.extras.fieldContents[targetField] = {
          value: undefined,
          type: targetFieldType,
        };
      }
      (environment.instanceDetails.extras.fieldContents[targetField] as IFieldValue).value = rows[0].result;
      await environment.instances.updateInstance(environment.instanceDetails);
    }
  } catch (ex) {
    throw new BpmnError(ErrorCodes.DB_ERROR, String(ex));
  } finally {
    await pool.close();
  }
  return true;
}
