import * as PH from "processhub-sdk";
import MathServiceMethods from "./mathServiceMethods";

export async function multiplikation(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;

  let numberField1 = fields.find(f => f.key == "numberField1").value;
  let numberField2 = fields.find(f => f.key == "numberField2").value;
  let targetField = fields.find(f => f.key == "targetField").value;

  const newValue: PH.Data.FieldValue = {
    value: MathServiceMethods.getNumberFromField(environment, numberField1) * MathServiceMethods.getNumberFromField(environment, numberField2),
    type: "ProcessHubNumber"
  };

  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
  await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);
  return true;
}