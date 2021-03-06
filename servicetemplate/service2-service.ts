import * as PH from "processhub-sdk";

// Extract the serviceLogic that testing is possible
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
  const instance = environment.instanceDetails;

  // Get field name of the corresponding field ID
  const inputField = fields.find((f) => f.key === "inputField")?.value;
  console.log(inputField);
  const selectField = fields.find((f) => f.key === "selectField")?.value;

  if (selectField !== undefined) {
    // Get the value of a selected field
    const selectFieldValue = (environment.instanceDetails.extras.fieldContents?.[selectField] as PH.Data.IFieldValue).value as string;
    console.log(selectFieldValue);
  }

  if (instance.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  // Init new field
  instance.extras.fieldContents["Neues Feld"] = {
    value: "Ich bin neu",
    type: "ProcessHubTextArea",
  };
}

export async function service2(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  // Get the instance to manipulate and add fields
  await serviceLogic(environment);

  // Update the Instance with changes
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
