import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";

export async function transactionTimeout(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  // Get field name of the corresponding field ID
  const transactionTimeoutValue = fields.find((f) => f.key === "transactionTimeout")?.value;
  if (null == transactionTimeoutValue) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "transactionTimeout is not set");
  }

  const transactionTimeout = parseInt(transactionTimeoutValue);
  if (isNaN(transactionTimeout)) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "value for transactionTimeout is invalid: " + transactionTimeoutValue);
  }

  environment.logger.info("Setting transaction timeout to " + String(transactionTimeout));

  await environment.system.setTransactionTimeout(transactionTimeout);

  return true;
}
