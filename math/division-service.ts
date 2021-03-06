import * as PH from "processhub-sdk";
import MathServiceMethods from "./mathServiceMethods";

export async function serviceLogic(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<void> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
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

  if (((environment.instanceDetails.extras.fieldContents[numberField2] as PH.Data.IFieldValue).value as number) === 0) {
    return;
  }

  const newValue: PH.Data.IFieldValue = {
    value: MathServiceMethods.getNumberFromField(environment, numberField1) / MathServiceMethods.getNumberFromField(environment, numberField2),
    type: "ProcessHubNumber",
  };

  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
}

export async function division(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  try {
    await serviceLogic(environment);
    await environment.instances.updateInstance(environment.instanceDetails);
    return true;
  } catch {
    return false;
  }
}
