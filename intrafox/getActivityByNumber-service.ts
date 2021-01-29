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
  const activityNumberField = fields.find((f) => f.key === "activityNumber")?.value;
  const usernameField = fields.find((f) => f.key === "username")?.value;

  if (token === undefined) {
    throw new Error("token is undefined, cannot proceed!");
  }
  if (activityNumberField === undefined) {
    throw new Error("activityNumberField is undefined, cannot proceed!");
  }
  if (usernameField === undefined) {
    throw new Error("usernameField is undefined, cannot proceed!");
  }
  if (instance.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed!");
  }

  const activityNumber = ((instance.extras.fieldContents[activityNumberField] as PH.Data.IFieldValue).value as string).trim();
  const username = ((instance.extras.fieldContents[usernameField] as PH.Data.IFieldValue).value as string).trim();

  await IntrafoxAPI.setGlobalActivityValues(url, username, token);

  const response = await IntrafoxAPI.getActivityByNumber(url, activityNumber, username, token);
  const activity = response as IntrafoxTypes.IGetGlobalActivityListResponse;
  const error = response as IntrafoxTypes.IIntraFoxErrorResponse;

  if (activity && !error.ERRORCODE) {
    instance.extras.fieldContents["Abkürzung"] = {
      value: activity.ACTIVITY_ABBREVIATION,
      type: "ProcessHubTextArea",
    };

    instance.extras.fieldContents["Beschreibung"] = {
      value: activity.ACTIVITY_DESCRIPTION,
      type: "ProcessHubTextArea",
    };
  } else {
    IntrafoxAPI.errorHandling(instance, error.ERRORCODE);
  }

  return instance;
}

export async function getActivityByNumber(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic("https://asp3.intrafox.net/cgi-bin/ws.app?D=P32zdyNCFcIwZ40HE1RY", environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
