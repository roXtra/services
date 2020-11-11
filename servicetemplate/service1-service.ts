import * as PH from "processhub-sdk";

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<PH.Instance.IInstanceDetails> {
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
  return instance;
}

export async function service1(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  // Get the instance to manipulate and add fields
  const instance = await serviceLogic(environment);

  // Init new field
  if (instance.extras.fieldContents === undefined) {
    instance.extras.fieldContents = {};
  }

  instance.extras.fieldContents["Neues Feld"] = {
    value: "Ich bin neu",
    type: "ProcessHubTextArea",
  };

  // Update the Instance with changes
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
