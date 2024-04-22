import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";

export async function loopCount(environment: IServiceTaskEnvironment): Promise<boolean> {
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
  const maxIterationsValue = fields.find((f) => f.key === "maxIterations")?.value;
  if (null == maxIterationsValue) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "maxIterations is not set");
  }

  const maxIterations = parseInt(maxIterationsValue);
  if (isNaN(maxIterations)) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "value for maxIterations is invalid: " + maxIterationsValue);
  }

  environment.logger.info("Setting max bpmn engine iterations to " + String(maxIterations));

  environment.system.setMaxBpmnEngineIterations(maxIterations);

  return true;
}
