import * as PH from "processhub-sdk";

export const ErrorField = "ErrorField";

export async function resetError(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<void> {
  if (environment.fieldContents[ErrorField] && environment.fieldContents[ErrorField] !== "") {
    environment.fieldContents[ErrorField] = "";
    await environment.instances.updateInstance(environment.instanceDetails);
  }
}

export async function setError(environment: PH.ServiceTask.IServiceTaskEnvironment, error: string): Promise<void> {
  if (environment.fieldContents[ErrorField]) {
    environment.fieldContents[ErrorField] = error;
    await environment.instances.updateInstance(environment.instanceDetails);
  } else {
    if (environment.instanceDetails.extras.fieldContents === undefined) {
      throw new Error(`fieldContents are undefined, cannot log error to error field: ${error}`);
    }

    environment.instanceDetails.extras.fieldContents[ErrorField] = {
      type: "ProcessHubTextInput",
      value: error,
    };
    await environment.instances.updateInstance(environment.instanceDetails);
  }
}
