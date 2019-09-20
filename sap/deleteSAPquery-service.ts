import * as PH from "processhub-sdk";
import Methods from "./sapServiceMethods";

export async function deleteSAPQuery(environment: PH.ServiceTask.ServiceTaskEnvironment) {
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
  let tableName = fields.find(f => f.key == "tableName").value;
  let where = fields.find(f => f.key == "where").value;

  const connectionParams = {
    host: ipAddress,
    port: port,
    uid: databaseUsername,
    pwd: password,
    databaseName: tenant
  };

  let insertQuery = Methods.buildDeleteQuery(tableName, where, instance);

  return await Methods.execQuery(connectionParams, insertQuery, async () => {
    return await environment.instances.updateInstance(environment.instanceDetails);
  });
}