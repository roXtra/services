import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { loadConfig, readConfigFile } from "./common.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import SkribbleApi, { ISkribbleApi } from "./skribbleApi.js";

export async function serviceLogic(environment: IServiceTaskEnvironment, skribbleApi: ISkribbleApi) {
  if (!environment.instanceDetails.extras.fieldContents) {
    throw new BpmnError(ErrorCode.UnknownError, "Field contents are not available in instance details.");
  }

  const { config } = await loadConfig(environment, environment.sender.language || "en-US");

  environment.logger.info(`Logging in to Skribble...`);
  const token = await skribbleApi.login();
  environment.logger.info(`Skribble login was successful.`);

  const targetFieldName = config.fields.find((f) => f.key === "targetField")?.value;
  if (!targetFieldName) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Target attachment field is not configured.");
  }

  /* Read signature Id from the instance details as configured in the service task */
  const signatureIdFieldName = config.fields.find((f) => f.key === "signatureIdField")?.value;
  if (!signatureIdFieldName) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Signature ID field is not configured.");
  }
  const signatureIdField = environment.instanceDetails.extras.fieldContents?.[signatureIdFieldName];
  if (!signatureIdField || signatureIdField.type !== "ProcessHubTextInput") {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Field "${signatureIdFieldName}" is not a valid text input field.`);
  }
  const signatureId = typeof signatureIdField.value === "string" ? signatureIdField.value : undefined;
  if (!signatureId) {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Field "${signatureIdFieldName}" does not contain a valid signature ID.`);
  }

  environment.logger.info(`Using signature ID: ${signatureId}`);
  const signature = await skribbleApi.getSignatureRequest(token, signatureId);
  environment.logger.info(`Retrieved signature details: ${JSON.stringify(signature)}`);

  environment.logger.info(`Retrieving document with ID: ${signature.document_id}`);
  const data = await skribbleApi.downloadDocument(token, signature.document_id);
  environment.logger.info(`Document retrieved successfully, size: ${data.size} bytes`);

  /* Upload the document to the instance as an attachment */
  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const url = await environment.instances.uploadAttachment(environment.instanceDetails.instanceId, signature.title, buffer);

  environment.instanceDetails.extras.fieldContents[targetFieldName] = {
    type: "ProcessHubFileUpload",
    value: [url],
  };

  const deleteDocumentFromSkribble = config.fields.find((f) => f.key === "deleteDocumentFromSkribble")?.value === "true";
  if (deleteDocumentFromSkribble) {
    environment.logger.info(`Deleting document with ID: ${signature.document_id} from Skribble.`);
    await skribbleApi.deleteDocument(token, signature.document_id);
    environment.logger.info(`Document deleted successfully.`);
  } else {
    environment.logger.info(`Skipping document deletion from Skribble as per configuration.`);
  }
}

export async function downloadFile(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const configFile = await readConfigFile(configPath);
  environment.logger.info(`Using Skribble base URL: ${configFile.baseUrl}, user: ${configFile.userName}`);
  const skribbleApi = new SkribbleApi(configFile.baseUrl, configFile.userName, configFile.apiKey);

  await serviceLogic(environment, skribbleApi);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
