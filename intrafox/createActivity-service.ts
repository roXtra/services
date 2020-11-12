import * as PH from "processhub-sdk";
import * as IntrafoxAPI from "./IntrafoxAPI";
import * as IntrafoxTypes from "./IntrafoxTypes";

export async function serviceLogic(url: string, environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<PH.Instance.IInstanceDetails> {
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

  const token = fields.find((f) => f.key === "token")?.value;

  const activityAbbrevationField = fields.find((f) => f.key === "activityAbbrevation")?.value;
  const activityDescriptionField = fields.find((f) => f.key === "activityDescription")?.value;
  const activityExpirationdateField = fields.find((f) => f.key === "activityExpirationdate")?.value;
  const usernameField = fields.find((f) => f.key === "username")?.value;

  if (token === undefined) {
    throw new Error("token is undefined, cannot proceed!");
  }
  if (activityAbbrevationField === undefined) {
    throw new Error("activityAbbrevationField is undefined, cannot proceed!");
  }
  if (activityDescriptionField === undefined) {
    throw new Error("activityDescriptionField is undefined, cannot proceed!");
  }
  if (activityExpirationdateField === undefined) {
    throw new Error("activityExpirationdateField is undefined, cannot proceed!");
  }
  if (usernameField === undefined) {
    throw new Error("usernameField is undefined, cannot proceed!");
  }
  if (instance.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed!");
  }

  const activityAbbrevation = ((instance.extras.fieldContents[activityAbbrevationField] as PH.Data.IFieldValue).value as string).trim();
  const activityDescription = ((instance.extras.fieldContents[activityDescriptionField] as PH.Data.IFieldValue).value as string).trim();
  const activityExpirationdate = (instance.extras.fieldContents[activityExpirationdateField] as PH.Data.IFieldValue).value as Date;
  const username = ((instance.extras.fieldContents[usernameField] as PH.Data.IFieldValue).value as string).trim();

  const response = await IntrafoxAPI.createGlobalActivity(url, username, activityAbbrevation, activityDescription, activityExpirationdate, token);
  const responseOK = response as string;
  const error = response as IntrafoxTypes.IIntraFoxErrorResponse;

  if (responseOK === "ok") {
    instance.extras.fieldContents["Info"] = {
      value: "Maßnahme wurde erstellt",
      type: "ProcessHubTextArea",
    };
  } else {
    IntrafoxAPI.errorHandling(instance, error.ERRORCODE);
  }

  return instance;
}

export async function createActivity(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic("https://asp3.intrafox.net/cgi-bin/ws.app?D=P32zdyNCFcIwZ40HE1RY", environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
