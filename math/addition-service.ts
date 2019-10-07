import * as PH from "processhub-sdk";
import MathServiceMethods from "./mathServiceMethods";
import { Bpmn } from "modeler/bpmn/bpmn";

export async function serviceLogic(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<void> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject: Bpmn.ITask = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues: PH.Process.ITaskExtensions = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;
  const numberField1 = fields.find(f => f.key === "numberField1").value;
  const numberField2 = fields.find(f => f.key === "numberField2").value;
  const targetField = fields.find(f => f.key === "targetField").value;
  const newValue: PH.Data.IFieldValue = {
    value: MathServiceMethods.getNumberFromField(environment, numberField1) + MathServiceMethods.getNumberFromField(environment, numberField2),
    type: "ProcessHubNumber"
  };
  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
}

export async function addition(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}