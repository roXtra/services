import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import Methods from "./sapServiceMethods.mjs";

export async function selectSAPQuery(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  const instance = environment.instanceDetails;

  const ipAddress = fields.find((f) => f.key === "ipAddress")?.value;
  const port = fields.find((f) => f.key === "port")?.value;
  const databaseUsername = fields.find((f) => f.key === "databaseUsername")?.value;
  const password = fields.find((f) => f.key === "password")?.value;
  const tenant = fields.find((f) => f.key === "tenant")?.value;
  const tableName = fields.find((f) => f.key === "tableName")?.value;
  const columns = fields.find((f) => f.key === "columns")?.value;
  const where = fields.find((f) => f.key === "where")?.value;

  if (ipAddress === undefined) {
    throw new Error("ipAddress is undefined, cannot proceed!");
  }
  if (port === undefined) {
    throw new Error("port is undefined, cannot proceed!");
  }
  if (databaseUsername === undefined) {
    throw new Error("databaseUsername is undefined, cannot proceed!");
  }
  if (password === undefined) {
    throw new Error("password is undefined, cannot proceed!");
  }
  if (tenant === undefined) {
    throw new Error("tenant is undefined, cannot proceed!");
  }
  if (tableName === undefined) {
    throw new Error("tableName is undefined, cannot proceed!");
  }
  if (columns === undefined) {
    throw new Error("columns is undefined, cannot proceed!");
  }
  if (where === undefined) {
    throw new Error("where is undefined, cannot proceed!");
  }

  const connectionParams = {
    host: ipAddress,
    port: port,
    uid: databaseUsername,
    pwd: password,
    databaseName: tenant,
  };

  const newValue: IFieldValue = {
    value: "",
    type: "ProcessHubTextArea",
  };

  const selectQuery = await Methods.buildSelectQuery(environment, tableName, columns, where, instance, processObject);

  if (selectQuery === undefined) {
    throw new Error("selectQuery is undefined, cannot proceed!");
  }

  const result = await Methods.execQuery(connectionParams, selectQuery, async (rows: Array<{ [key: string]: unknown }>) => {
    return await Methods.serviceOutputLogic(rows, newValue, environment, instance, "Ergebnis", "CSV Export");
  });

  return result;
}
