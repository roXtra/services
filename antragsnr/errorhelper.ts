import * as PH from "processhub-sdk";

export const ErrorField: string = "ErrorField";

export async function resetError(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  if (environment.fieldContents[ErrorField] && environment.fieldContents[ErrorField] != "") {
    environment.fieldContents[ErrorField] = "";
    await PH.Instance.updateInstance(environment.instanceDetails);
  }
}

export async function setError(environment: PH.ServiceTask.ServiceTaskEnvironment, error: string) {
  if (environment.fieldContents[ErrorField]) {
    environment.fieldContents[ErrorField] = error;
    await PH.Instance.updateInstance(environment.instanceDetails);
  } else {
    environment.instanceDetails.extras.fieldContents[ErrorField] = {
      type: "ProcessHubTextInput",
      value: error,
    };
    await PH.Instance.updateInstance(environment.instanceDetails);
  }
} 