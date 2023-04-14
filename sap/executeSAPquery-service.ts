import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import Methods from "./sapServiceMethods";

export async function executeSAPQuery(environment: IServiceTaskEnvironment): Promise<boolean> {
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
  let query = fields.find((f) => f.key === "query")?.value;
  const targetFieldTable = fields.find((f) => f.key === "targetFieldTable")?.value;
  const targetFieldCSV = fields.find((f) => f.key === "targetFieldCSV")?.value;

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
  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed!");
  }
  if (targetFieldTable === undefined) {
    throw new Error("targetFieldTable is undefined, cannot proceed!");
  }
  if (targetFieldCSV === undefined) {
    throw new Error("targetFieldCSV is undefined, cannot proceed!");
  }

  if (instance.extras.roleOwners === undefined) {
    throw new Error("instance.extras.roleOwners is undefined, cannot proceed!");
  }

  query = parseAndInsertStringWithFieldContent(query, instance.extras.fieldContents, processObject, instance.extras.roleOwners, environment.sender.language || "de-DE", true);

  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed!");
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

  return await Methods.execQuery(connectionParams, query, async (rows: Array<any>) => {
    return await Methods.serviceOutputLogic(rows, newValue, environment, instance, targetFieldTable, targetFieldCSV);
  });
}
