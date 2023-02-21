import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror";
import axios, { AxiosError } from "axios";

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  const instance = environment.instanceDetails;
  const instanceRoleOwners = instance.extras.roleOwners;

  if (instanceRoleOwners === undefined) {
    throw new BpmnError(ErrorCode.InvalidRoleOwner, "environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }

  // Get webhook fields
  const webhookAddress = fields.find((f) => f.key === "webhookAddress")?.value;
  const webhookHeaders = fields.find((f) => f.key === "headers")?.value.split(/\r\n|\r|\n/g);
  const webhookBody = fields.find((f) => f.key === "bodyData")?.value;

  if (!webhookAddress) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Webhook address is empty - cannot perform webhook call!");
  }

  const replaceFieldContentsInFieldValue = (value: string): string | undefined =>
    parseAndInsertStringWithFieldContent(
      value,
      instance.extras.fieldContents,
      processObject,
      instanceRoleOwners,
      environment.sender.language || "de-DE",
      undefined,
      undefined,
      undefined,
      instance,
    );

  const webhookAddressWithFieldValues = replaceFieldContentsInFieldValue(webhookAddress);

  const webhookBodyWithFieldValues = webhookBody ? replaceFieldContentsInFieldValue(webhookBody) : undefined;

  const webhookHeadersWithFieldValues: { [key: string]: string } = {};

  webhookHeaders?.forEach((headerRow) => {
    const headerRowWithReplacedFields = replaceFieldContentsInFieldValue(headerRow);

    const headerKeyAndValue = headerRowWithReplacedFields?.split(": ");

    if (!headerKeyAndValue || headerKeyAndValue.length !== 2) {
      throw new BpmnError(ErrorCode.ConfigInvalid, `Header ${headerRow} has invalid format! Must be "Header: Value"`);
    }

    webhookHeadersWithFieldValues[headerKeyAndValue[0]] = headerKeyAndValue[1];
  });

  if (!webhookAddressWithFieldValues) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Webhook address is empty after replacing fields - cannot perform webhook call!");
  }

  try {
    await axios.post(webhookAddressWithFieldValues, webhookBodyWithFieldValues, { headers: webhookHeadersWithFieldValues });
    return true;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new BpmnError(
        ErrorCode.UnknownError,
        `Webhook call produced a bad response. Status ${String(error.response?.status)} (${String(error.response?.statusText)}) - Body: ${JSON.stringify(
          error.response?.data,
        )}`,
        error,
      );
    } else if (error instanceof Error) {
      throw new BpmnError(ErrorCode.UnknownError, `Unknown error when calling webhook: ${error.message}`, error);
    } else {
      throw new BpmnError(ErrorCode.UnknownError, `Unknown error when calling webhook: ${String(error)}`);
    }
  }
}

export async function triggerwebhookPost(environment: IServiceTaskEnvironment): Promise<boolean> {
  return serviceLogic(environment);
}
