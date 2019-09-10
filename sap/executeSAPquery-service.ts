import * as PH from "processhub-sdk";
import Methods from "./sapServiceMethods";

export async function executeSAPQuery(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;
  let instance = environment.instanceDetails;

  let ipAddress = fields.find(f => f.key == "ipAddress").value;
  let port = fields.find(f => f.key == "port").value;
  let databaseUsername = fields.find(f => f.key == "databaseUsername").value;
  let password = fields.find(f => f.key == "password").value;
  let tenant = fields.find(f => f.key == "tenant").value;
  let query = fields.find(f => f.key == "query").value;
  let targetFieldTable = fields.find(f => f.key == "targetFieldTable").value;
  let targetFieldCSV = fields.find(f => f.key == "targetFieldCSV").value;

  query = Methods.parseFieldsOfQuery(query, instance);

  const connectionParams = {
    host: ipAddress,
    port: port,
    uid: databaseUsername,
    pwd: password,
    databaseName: tenant
  };

  let newValue: PH.Data.FieldValue = {
    value: "",
    type: "ProcessHubTextArea"
  };

  return await Methods.execQuery(connectionParams, query, async (rows: Array<any>) => {
    return await Methods.serviceOutputLogic(rows, newValue, environment, instance, targetFieldTable, targetFieldCSV);
  });
}