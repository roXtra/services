import * as PH from "processhub-sdk";
import Methods from "./sapServiceMethods";

export async function executeSAPQuery(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;
  const instance = environment.instanceDetails;

  const ipAddress = fields.find(f => f.key === "ipAddress").value;
  const port = fields.find(f => f.key === "port").value;
  const databaseUsername = fields.find(f => f.key === "databaseUsername").value;
  const password = fields.find(f => f.key === "password").value;
  const tenant = fields.find(f => f.key === "tenant").value;
  let query = fields.find(f => f.key === "query").value;
  const targetFieldTable = fields.find(f => f.key === "targetFieldTable").value;
  const targetFieldCSV = fields.find(f => f.key === "targetFieldCSV").value;

  query = Methods.parseFieldsOfQuery(query, instance);

  const connectionParams = {
    host: ipAddress,
    port: port,
    uid: databaseUsername,
    pwd: password,
    databaseName: tenant
  };

  const newValue: PH.Data.FieldValue = {
    value: "",
    type: "ProcessHubTextArea"
  };

  return await Methods.execQuery(connectionParams, query, async (rows: Array<any>) => {
    return await Methods.serviceOutputLogic(rows, newValue, environment, instance, targetFieldTable, targetFieldCSV);
  });
}