import * as PH from "processhub-sdk";

export async function executeCreateRoxFile(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  // let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  // let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  // let config = extensionValues.serviceTaskConfigObject;
  
  return true;
}
