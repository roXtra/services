import MathServiceMethods from "./mathServiceMethods.js";
import { Bpmn } from "modeler/bpmn/bpmn";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { ITaskExtensions } from "processhub-sdk/lib/process/processinterfaces.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";

export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<void> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject: Bpmn.ITask = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues: ITaskExtensions = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  const numberField1 = fields.find((f) => f.key === "numberField1")?.value;
  const numberField2 = fields.find((f) => f.key === "numberField2")?.value;
  const targetField = fields.find((f) => f.key === "targetField")?.value;

  if (numberField1 === undefined) {
    throw new Error("numberField1 is undefined, cannot proceed with service!");
  }
  if (numberField2 === undefined) {
    throw new Error("numberField2 is undefined, cannot proceed with service!");
  }
  if (targetField === undefined) {
    throw new Error("targetField is undefined, cannot proceed with service!");
  }
  if (environment.instanceDetails.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  const newValue: IFieldValue = {
    value: MathServiceMethods.getNumberFromField(environment, numberField1) + MathServiceMethods.getNumberFromField(environment, numberField2),
    type: "ProcessHubNumber",
  };

  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
}

export async function addition(environment: IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
