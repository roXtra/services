import * as PH from "processhub-sdk";
import * as IntrafoxAPI from "./IntrafoxAPI";
import * as IntrafoxTypes from "./IntrafoxTypes"; 

export async function createActivity(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  
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
  
  let activityAbbrevationField = fields.find(f => f.key == "activityAbbrevation").value;
  let activityDescriptionField = fields.find(f => f.key == "activityDescription").value;
  let activityExpirationdateField = fields.find(f => f.key == "activityExpirationdate").value;
  let usernameField = fields.find(f => f.key == "username").value;

  let activityAbbrevation = ((instance.extras.fieldContents[activityAbbrevationField] as PH.Data.FieldValue).value as string).trim();
  let activityDescription = ((instance.extras.fieldContents[activityDescriptionField] as PH.Data.FieldValue).value as string).trim();
  let activityExpirationdate = ((instance.extras.fieldContents[activityExpirationdateField] as PH.Data.FieldValue).value as Date);
  let username = ((instance.extras.fieldContents[usernameField] as PH.Data.FieldValue).value as string).trim();

  const response = await IntrafoxAPI.createGlobalActivity(url, username, activityAbbrevation, activityDescription, activityExpirationdate, token);
  const responseOK = response as string;
  const error = response as IntrafoxTypes.IntraFoxErrorResponse;

  if (responseOK === "ok") {
    instance.extras.fieldContents["Info"] = {
      value: "Maßnahme wurde erstellt",
      type: "ProcessHubTextArea"
    };
  } else {
    IntrafoxAPI.errorHandling(instance, error.ERRORCODE);
  }

  return instance;
}
