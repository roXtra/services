import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { parseAndInsertStringWithFieldContent, replaceObjectReferences } from "processhub-sdk/lib/data/datatools.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { IServiceConfigSchema, IServiceConfigSecret, readConfigFile } from "processhub-sdk/lib/servicetask/configfile.js";
import { FieldType } from "processhub-sdk/lib/data/ifieldvalue.js";

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const serviceTaskConfig = extensionValues.serviceTaskConfigObject;

  if (serviceTaskConfig === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Config is undefined, cannot proceed with service!");
  }

  const fields = serviceTaskConfig.fields;
  const instance = environment.instanceDetails;
  const instanceRoleOwners = instance.extras.roleOwners;

  if (instanceRoleOwners === undefined) {
    throw new BpmnError(ErrorCode.InvalidRoleOwner, "environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }

  // Get webhook fields
  const webhookMethod = fields.find((f) => f.key === "webhookMethod")?.value;
  const webhookAddress = fields.find((f) => f.key === "webhookAddress")?.value;
  const webhookHeaders = fields.find((f) => f.key === "headers")?.value.split(/\r\n|\r|\n/g);
  const webhookBody = fields.find((f) => f.key === "bodyData")?.value;
  const writeResponseToTargetField = fields.find((f) => f.key === "writeResponseInTargetField")?.value;
  const responseTargetFieldName = fields.find((f) => f.key === "responseTargetField")?.value;

  if (!webhookAddress) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Webhook address is empty - cannot perform webhook call!");
  }

  const configFile = (await readConfigFile<IServiceConfigSecret>(configPath, environment.logger, IServiceConfigSchema)) || { secret: {} };
  const usersConfig = await environment.roxApi.getUsersConfig();

  const replaceFieldContentsInFieldValue = (value: string): string | undefined => {
    let result: string | undefined = replaceObjectReferences(value, "secret", configFile.secret);
    result = parseAndInsertStringWithFieldContent(
      result,
      instance.extras.fieldContents,
      processObject,
      instanceRoleOwners,
      environment.sender.language || "de-DE",
      usersConfig,
      undefined,
      undefined,
      undefined,
      instance,
    );
    return result;
  };

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

  if (environment.instanceDetails.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  try {
    const requestConfig: AxiosRequestConfig<string> = {
      headers: webhookHeadersWithFieldValues,
      // Set responseType to text so that it is a string
      responseType: "text",
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let requestResult: AxiosResponse<any, any>;

    switch (webhookMethod) {
      case "GET":
        requestResult = await axios.get(webhookAddressWithFieldValues, requestConfig);
        break;
      case "PUT":
        requestResult = await axios.put(webhookAddressWithFieldValues, webhookBodyWithFieldValues, requestConfig);
        break;
      case "DELETE":
        requestResult = await axios.delete(webhookAddressWithFieldValues, requestConfig);
        break;
      case "POST":
      // Default is the fallback for older service tasks configured before this option existed - back then it was always a POST
      // eslint-disable-next-line no-fallthrough
      default:
        requestResult = await axios.post(webhookAddressWithFieldValues, webhookBodyWithFieldValues, requestConfig);
        break;
    }

    if (writeResponseToTargetField === "true" && responseTargetFieldName !== undefined) {
      // A target field for a response is configured

      // Ensure target field exists in the process
      if (!environment.instanceDetails.extras.fieldContents?.[responseTargetFieldName]) {
        const fields = processObject.getFieldDefinitions();
        const field = fields.find((f) => f.name === responseTargetFieldName);
        const targetFieldType: FieldType = field ? field.type : "ProcessHubTextInput";

        environment.instanceDetails.extras.fieldContents[responseTargetFieldName] = {
          value: undefined,
          type: targetFieldType,
        };
      }

      // Get string response - this is a string as responseType is set to "text"
      const responseAsString = requestResult.data as string;
      environment.instanceDetails.extras.fieldContents[responseTargetFieldName].value = responseAsString;
      // Update the instance
      await environment.instances.updateInstance(environment.instanceDetails);
    }

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

export async function triggerwebhookPost(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  return serviceLogic(environment, configPath);
}
