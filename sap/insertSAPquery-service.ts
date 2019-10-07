import * as PH from "processhub-sdk";
import Methods from "./sapServiceMethods";

export async function insertSAPQuery(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
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
  const tableName = fields.find(f => f.key === "tableName").value;
  const columns = fields.find(f => f.key === "columns").value;
  const values = fields.find(f => f.key === "values").value;

  const connectionParams = {
    host: ipAddress,
    port: port,
    uid: databaseUsername,
    pwd: password,
    databaseName: tenant
  };

  const insertQuery = Methods.buildInsertQuery(tableName, columns, values, instance);

  return await Methods.execQuery(connectionParams, insertQuery, async () => {
    return await environment.instances.updateInstance(environment.instanceDetails);
  });
}