import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import DocusignApi, { IDocusignApi, ICreateEnvelopeRequest } from "./docusignApi.js";
import { loadConfig, readConfigFile } from "./common.js";
import fs from "fs/promises";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { decodeURLSafeBase64 } from "processhub-sdk/lib/tools/stringtools.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { Bpmn } from "modeler/bpmn/bpmn";
import { getWebhookTriggerRoute } from "processhub-sdk/lib/webhhooks/webhhooks.js";
import { IServiceTaskConfigObject } from "processhub-sdk/lib/process/processinterfaces.js";

function getPhysicalPath(attachmentUrl: string, environment: IServiceTaskEnvironment) {
  let relativePath = attachmentUrl.split("modules/files/")[1];
  const pathParts = relativePath.split("/");
  pathParts[pathParts.length - 1] = decodeURLSafeBase64(pathParts[pathParts.length - 1]);
  relativePath = pathParts.join("/");
  return { physicalPath: environment.fileStore.getPhysicalPath(relativePath), fileName: pathParts[pathParts.length - 1] };
}

function findNearestWebHookCatchEvent(bpmnProcess: BpmnProcess, environment: IServiceTaskEnvironment) {
  const taskObject = bpmnProcess.getExistingTask(bpmnProcess.processId(), environment.bpmnTaskId);
  const elements: Bpmn.IActivity[] = [taskObject];
  while (elements.length > 0) {
    const element = elements.shift();
    if (!element) continue;
    if (element.$type === "bpmn:IntermediateCatchEvent" || element.$type === "bpmn:BoundaryEvent") {
      const elementTyped = element as Bpmn.IIntermediateCatchEvent | Bpmn.IBoundaryEvent;
      const isMessageEvent = elementTyped.eventDefinitions?.some((ed) => ed.$type === "bpmn:MessageEventDefinition");
      if (isMessageEvent) {
        const extensionValues = BpmnProcess.getExtensionValues(element);
        if (extensionValues.messageEventType === "webhook") {
          return elementTyped;
        }
      }
    }
    if (element.boundaryEventRefs) {
      for (const boundaryEventRef of element.boundaryEventRefs) {
        if (boundaryEventRef) elements.push(boundaryEventRef);
      }
    }
    if (element.outgoing) {
      for (const outgoing of element.outgoing) {
        if (outgoing.targetRef) elements.push(outgoing.targetRef);
      }
    }
  }
  return undefined;
}

function getCallbackUrlBase(configFile: { callbackUrlBase: string }, environment: IServiceTaskEnvironment) {
  if (configFile.callbackUrlBase) {
    let trimmed = configFile.callbackUrlBase.trim();
    if (trimmed.endsWith("/")) trimmed = trimmed.slice(0, -1);
    return trimmed + "/modules";
  }
  return environment.serverConfig.Webserver.baseUrl;
}

async function buildEnvelopeRequest(
  config: IServiceTaskConfigObject,
  environment: IServiceTaskEnvironment,
  bpmnProcess: BpmnProcess,
  configFile: Awaited<ReturnType<typeof readConfigFile>>,
): Promise<ICreateEnvelopeRequest> {
  /* Read the source file from the attachment field */
  const sourceFieldName = config.fields.find((f) => f.key === "sourceField")?.value;
  if (!sourceFieldName) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Source attachment field is not configured.");
  }

  const sourceField = environment.instanceDetails.extras.fieldContents?.[sourceFieldName];
  if (!sourceField || sourceField.type !== "ProcessHubFileUpload") {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Source field "${sourceFieldName}" is not a valid file attachment field.`);
  }

  const sourceFieldValue = sourceField.value as string[] | undefined;
  if (!sourceFieldValue || sourceFieldValue.length === 0) {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Source field "${sourceFieldName}" is empty.`);
  }
  const { physicalPath, fileName } = getPhysicalPath(sourceFieldValue[0], environment);
  const fileData = await fs.readFile(physicalPath, { encoding: "base64" });

  /* Read signer info */
  const userMail = environment.sender.mail;
  if (!userMail) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "User has no email address, cannot proceed with service!");
  }
  const signerName = [environment.sender.firstName, environment.sender.lastName].filter(Boolean).join(" ") || userMail;

  /* Read message */
  const message = config.fields.find((f) => f.key === "message")?.value || "";

  /* Determine whether to use embedded signing (to generate a signing URL) */
  const signatureUrlField = config.fields.find((f) => f.key === "signatureUrlField")?.value;
  const embeddedClientUserId = signatureUrlField ? userMail : undefined;

  /* Build webhook URL if triggerWebhook is enabled */
  const triggerWebhook = config.fields.find((f) => f.key === "triggerWebhook")?.value || "false";
  let webhookUrl: string | undefined;
  if (triggerWebhook === "true") {
    const webhookCatchEvent = findNearestWebHookCatchEvent(bpmnProcess, environment);
    if (webhookCatchEvent) {
      webhookUrl =
        getCallbackUrlBase(configFile, environment) +
        getWebhookTriggerRoute(environment.instanceDetails.processId, webhookCatchEvent.id, environment.instanceDetails.instanceId.toLowerCase());
    } else {
      throw new BpmnError(ErrorCode.ConfigInvalid, "No webhook catch event found in the process to trigger.");
    }
  }

  /* Standards-Based Signature (SBS) for EU Advanced (AES) */
  const signatureProviderName = config.fields.find((f) => f.key === "signatureProvider")?.value || undefined;
  const signerPhoneNumber = config.fields.find((f) => f.key === "signerPhoneNumber")?.value || undefined;
  const accessCode = config.fields.find((f) => f.key === "accessCode")?.value || undefined;

  /* Sanitize name: SBS provider rejects ^ : \ @ + in recipient name */
  const sanitizedSignerName = signatureProviderName ? signerName.replace(/[\^:\\@+]/g, "") || signerName : signerName;

  const envelopeRequest: ICreateEnvelopeRequest = {
    emailSubject: fileName,
    emailMessage: message,
    documentBase64: fileData,
    documentName: fileName,
    signerEmail: userMail,
    signerName: sanitizedSignerName,
    embeddedClientUserId,
    webhookUrl,
    signatureProviderName,
    signerPhoneNumber,
    accessCode,
  };

  return envelopeRequest;
}

export async function serviceLogic(environment: IServiceTaskEnvironment, docusignApi: IDocusignApi, configFile: Awaited<ReturnType<typeof readConfigFile>>) {
  const { config, bpmnProcess } = await loadConfig(environment, environment.sender.language || "en-US");

  // Obtain access token from DocuSign API
  environment.logger.info(`Obtaining DocuSign access token...`);
  const token = await docusignApi.getAccessToken();
  environment.logger.info(`DocuSign access token obtained.`);

  const envelopeRequest: ICreateEnvelopeRequest = await buildEnvelopeRequest(config, environment, bpmnProcess, configFile);
  environment.logger.info(`Creating DocuSign envelope for document (request): ${envelopeRequest.documentName}`);
  const envelopeResponse = await docusignApi.createEnvelope(token, envelopeRequest);
  environment.logger.info(`DocuSign envelope created (response): ${envelopeResponse.envelopeId}, status: ${envelopeResponse.status}`);

  /* Store the envelope ID in the signatureIdField */
  const signatureIdField = config.fields.find((f) => f.key === "signatureIdField")?.value;
  if (signatureIdField) {
    environment.logger.info(`Storing envelope ID "${envelopeResponse.envelopeId}" in field "${signatureIdField}"`);
    environment.instanceDetails.extras.fieldContents = {
      ...environment.instanceDetails.extras.fieldContents,
      [signatureIdField]: { type: "ProcessHubTextInput", value: envelopeResponse.envelopeId },
    };
  }

  /* Determine whether to use embedded signing (to generate a signing URL) */
  const signatureUrlField = config.fields.find((f) => f.key === "signatureUrlField")?.value;
  const embeddedClientUserId = signatureUrlField ? envelopeRequest.signerEmail : undefined;

  /* Get and store the signing URL if embedded signing was requested */
  if (signatureUrlField && embeddedClientUserId) {
    const returnUrl = `${getCallbackUrlBase(configFile, environment)}/p/i/${environment.workspace.workspaceId}/${environment.instanceDetails.instanceId.toLowerCase()}`;
    const signingUrl = await docusignApi.getRecipientSigningUrl(token, envelopeResponse.envelopeId, envelopeRequest.signerEmail, envelopeRequest.signerName, returnUrl);
    environment.logger.info(`Storing signing URL in field "${signatureUrlField}"`);
    environment.instanceDetails.extras.fieldContents = {
      ...environment.instanceDetails.extras.fieldContents,
      [signatureUrlField]: { type: "ProcessHubTextInput", value: signingUrl },
    };
  }
}

export async function signFile(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const configFile = await readConfigFile(configPath);
  environment.logger.info(`Using DocuSign base URL: ${configFile.baseUrl}, accountId: ${configFile.accountId}`);
  const docusignApi = new DocusignApi(configFile.baseUrl, configFile.accountId, configFile.integrationKey, configFile.userId, configFile.oauthBasePath, configFile.privateKey);

  await serviceLogic(environment, docusignApi, configFile);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
