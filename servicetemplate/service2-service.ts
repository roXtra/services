import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<void> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  const instance = environment.instanceDetails;

  // Get field name of the corresponding field ID
  const inputField = fields.find((f) => f.key === "inputField")?.value;
  console.log(inputField);
  const selectField = fields.find((f) => f.key === "selectField")?.value;

  if (selectField !== undefined) {
    // Get the value of a selected field
    const selectFieldValue = (environment.instanceDetails.extras.fieldContents?.[selectField] as IFieldValue).value as string;
    console.log(selectFieldValue);
  }

  if (instance.extras.fieldContents === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "fieldContents are undefined, cannot proceed with service!");
  }

  // Init new field
  instance.extras.fieldContents["Neues Feld"] = {
    value: "Ich bin neu",
    type: "ProcessHubTextArea",
  };
}

export async function service2(environment: IServiceTaskEnvironment): Promise<boolean> {
  // Get the instance to manipulate and add fields
  await serviceLogic(environment);

  // Update the Instance with changes
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
