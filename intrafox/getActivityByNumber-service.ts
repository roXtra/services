import * as PH from "processhub-sdk";
import * as IntrafoxAPI from "./IntrafoxAPI";
import * as IntrafoxTypes from "./IntrafoxTypes";

export async function getActivityByNumber(environment: PH.ServiceTask.ServiceTaskEnvironment) {

  await serviceLogic("https://asp3.intrafox.net/cgi-bin/ws.app?D=P32zdyNCFcIwZ40HE1RY", environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}

export async function serviceLogic(url: string, environment: PH.ServiceTask.ServiceTaskEnvironment) {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;
  let instance = environment.instanceDetails;
  
  let token = fields.find(f => f.key == "token").value;
  let activityNumberField = fields.find(f => f.key == "activityNumber").value;
  let usernameField = fields.find(f => f.key == "username").value;

  let activityNumber = ((instance.extras.fieldContents[activityNumberField] as PH.Data.FieldValue).value as string).trim();
  let username = ((instance.extras.fieldContents[usernameField] as PH.Data.FieldValue).value as string).trim();
  
  const response = await IntrafoxAPI.getActivityByNumber(url, activityNumber, username, token);
  const activity = response as IntrafoxTypes.GetGlobalActivityListResponse;
  const error = response as IntrafoxTypes.IntraFoxErrorResponse;

  if (activity) {
    instance.extras.fieldContents["Abkürzung"] = {
      value: activity.ACTIVITY_ABBREVIATION,
      type: "ProcessHubTextArea"
    };
  
    instance.extras.fieldContents["Beschreibung"] = {
      value: activity.ACTIVITY_DESCRIPTION,
      type: "ProcessHubTextArea"
    };
  } else {
    IntrafoxAPI.errorHandling(instance, error.ERRORCODE);
  }

  return instance;
}
