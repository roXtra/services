import * as PH from "processhub-sdk";

export async function service1(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  // Get the instance to manipulate and add fields
  let instance = await serviceLogic(environment);

  // init new field
  instance.extras.fieldContents["Neues Feld"] = {
    value: "Ich bin neu",
    type: "ProcessHubTextArea"
  };

  // update the Instance with changes
  await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);
  return true;
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;
  let instance = environment.instanceDetails;
  // Get field name of the corresponding field ID
  let inputField = fields.find(f => f.key == "inputField").value;
  let selectField = fields.find(f => f.key == "selectField").value;
  // Get the value of a selected field
  let selectFieldValue = ((environment.instanceDetails.extras.fieldContents[selectField] as PH.Data.FieldValue).value as string);
  return instance;
}
