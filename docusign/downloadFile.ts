import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { loadConfig, readConfigFile } from "./common.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import DocusignApi, { IDocusignApi } from "./docusignApi.js";

export async function serviceLogic(environment: IServiceTaskEnvironment, docusignApi: IDocusignApi) {
  if (!environment.instanceDetails.extras.fieldContents) {
    throw new BpmnError(ErrorCode.UnknownError, "Field contents are not available in instance details.");
  }

  const { config } = await loadConfig(environment, environment.sender.language || "en-US");

  const targetFieldName = config.fields.find((f) => f.key === "targetField")?.value;
  if (!targetFieldName) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Target attachment field is not configured.");
  }

  const envelopeIdFieldName = config.fields.find((f) => f.key === "signatureIdField")?.value;
  if (!envelopeIdFieldName) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Envelope ID field is not configured.");
  }
  const envelopeIdField = environment.instanceDetails.extras.fieldContents?.[envelopeIdFieldName];
  if (!envelopeIdField || envelopeIdField.type !== "ProcessHubTextInput") {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Field "${envelopeIdFieldName}" is not a valid text input field.`);
  }
  const envelopeId = typeof envelopeIdField.value === "string" ? envelopeIdField.value : undefined;
  if (!envelopeId) {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Field "${envelopeIdFieldName}" does not contain a valid envelope ID.`);
  }

  environment.logger.info(`Obtaining DocuSign access token...`);
  const token = await docusignApi.getAccessToken();
  environment.logger.info(`DocuSign access token obtained.`);

  environment.logger.info(`Checking envelope status for ID: ${envelopeId}`);
  const envelope = await docusignApi.getEnvelope(token, envelopeId);
  environment.logger.info(`Envelope status: ${envelope.status}`);

  if (envelope.status !== "completed") {
    throw new BpmnError(ErrorCode.UnknownError, `Envelope "${envelopeId}" is not completed yet. Current status: ${envelope.status}`);
  }

  environment.logger.info(`Downloading completed document from envelope: ${envelopeId}`);
  const data = await docusignApi.downloadCompletedDocument(token, envelopeId);
  environment.logger.info(`Document downloaded successfully, size: ${data.size} bytes`);

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `signed_${envelopeId}.pdf`;
  const url = await environment.instances.uploadAttachment(environment.instanceDetails.instanceId, fileName, buffer);

  environment.instanceDetails.extras.fieldContents[targetFieldName] = {
    type: "ProcessHubFileUpload",
    value: [url],
  };
  environment.logger.info(`Signed document saved to field "${targetFieldName}".`);
}

export async function downloadFile(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const configFile = await readConfigFile(configPath);
  environment.logger.info(`Using DocuSign base URL: ${configFile.baseUrl}, accountId: ${configFile.accountId}`);
  const docusignApi = new DocusignApi(configFile.baseUrl, configFile.accountId, configFile.integrationKey, configFile.userId, configFile.oauthBasePath, configFile.privateKey);

  await serviceLogic(environment, docusignApi);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
