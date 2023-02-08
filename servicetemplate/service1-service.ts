import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror";

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<IInstanceDetails> {
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
  return instance;
}

export async function service1(environment: IServiceTaskEnvironment): Promise<boolean> {
  // Get the instance to manipulate and add fields
  const instance = await serviceLogic(environment);

  if (instance.extras.fieldContents === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "fieldContents are undefined, cannot proceed with service!");
  }

  instance.extras.fieldContents["Neues Feld"] = {
    value: "Ich bin neu",
    type: "ProcessHubTextArea",
  };

  // Update the Instance with changes
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
