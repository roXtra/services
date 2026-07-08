import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import DocusignApi, { IDocusignApi } from "./docusignApi.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { loadConfig, readConfigFile } from "./common.js";

export async function serviceLogic(environment: IServiceTaskEnvironment, docusignApi: IDocusignApi) {
  if (!environment.instanceDetails.extras.fieldContents) {
    throw new BpmnError(ErrorCode.UnknownError, "Field contents are not available in instance details.");
  }

  const { config } = await loadConfig(environment, environment.sender.language || "en-US");

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

  const deleteMode = config.fields.find((f) => f.key === "deleteMode")?.value || "recyclebin";
  if (deleteMode === "purge") {
    environment.logger.info(`Purging documents from envelope "${envelopeId}".`);
    await docusignApi.purgeEnvelope(token, envelopeId);
    environment.logger.info(`Envelope documents purged successfully.`);
  } else {
    environment.logger.info(`Moving envelope "${envelopeId}" to recycle bin.`);
    await docusignApi.deleteEnvelope(token, envelopeId);
    environment.logger.info(`Envelope moved to recycle bin successfully.`);
  }
}

export async function deleteDocumentFromDocuSign(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const configFile = await readConfigFile(configPath);
  environment.logger.info(`Using DocuSign base URL: ${configFile.baseUrl}, accountId: ${configFile.accountId}`);
  const docusignApi = new DocusignApi(configFile.baseUrl, configFile.accountId, configFile.integrationKey, configFile.userId, configFile.oauthBasePath, configFile.privateKey);

  await serviceLogic(environment, docusignApi);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
