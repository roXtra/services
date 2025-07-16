import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { loadConfig, readConfigFile } from "./common.js";
import fs from "fs/promises";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import SkribbleApi, { ISignatureRequest, ISkribbleApi } from "./skribbleApi.js";
import { decodeURLSafeBase64 } from "processhub-sdk/lib/tools/stringtools.js";
import { IServiceTaskConfigObject } from "processhub-sdk/lib/process/processinterfaces.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { Bpmn } from "modeler/bpmn/bpmn";
import { getWebhookTriggerRoute } from "processhub-sdk/lib/webhhooks/webhhooks.js";
import omit from "lodash/omit.js";

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
    if (!element) {
      continue;
    }
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
        if (boundaryEventRef) {
          elements.push(boundaryEventRef);
        }
      }
    }
    if (element.outgoing) {
      for (const outgoing of element.outgoing) {
        if (outgoing.targetRef) {
          elements.push(outgoing.targetRef);
        }
      }
    }
  }
  return undefined;
}

export async function serviceLogic(environment: IServiceTaskEnvironment, skribbleApi: ISkribbleApi) {
  const { config, bpmnProcess } = await loadConfig(environment, environment.sender.language || "en-US");

  environment.logger.info(`Logging in to Skribble...`);
  const token = await skribbleApi.login();
  environment.logger.info(`Skribble login was successful.`);

  const signatureRequest: ISignatureRequest = await buildSignatureRequest(config, environment, bpmnProcess);
  environment.logger.info(`Sending skribble signature request: ${JSON.stringify(omit(signatureRequest, "content"))}`);
  const signatureResponse = await skribbleApi.createSignatureRequest(token, signatureRequest);
  environment.logger.info(`Skribble signature request response: ${JSON.stringify(signatureResponse)}`);

  // Update the instance details with the signature URL
  const signingUrl = signatureResponse.signatures?.[0]?.signing_url || signatureResponse.signing_url;
  const signatureUrlField = config.fields.find((f) => f.key === "signatureUrlField")?.value;
  if (signatureUrlField) {
    environment.logger.info(`Updating field "${signatureUrlField}" with signing URL: ${signingUrl}`);
    environment.instanceDetails.extras.fieldContents = {
      ...environment.instanceDetails.extras.fieldContents,
      [signatureUrlField]: { type: "ProcessHubTextInput", value: signingUrl },
    };
  }

  const signatureId = config.fields.find((f) => f.key === "signatureIdField")?.value;
  if (signatureId) {
    environment.logger.info(`Updating field "${signatureId}" with signature ID: ${signatureResponse.id}`);
    environment.instanceDetails.extras.fieldContents = {
      ...environment.instanceDetails.extras.fieldContents,
      [signatureId]: { type: "ProcessHubTextInput", value: signatureResponse.id },
    };
  }
}

async function buildSignatureRequest(config: IServiceTaskConfigObject, environment: IServiceTaskEnvironment, bpmnProcess: BpmnProcess) {
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

  /* Read the quality field */
  const signatureQuality = config.fields.find((f) => f.key === "signatureQuality")?.value || "AES";
  if (signatureQuality !== "AES" && signatureQuality !== "SES" && signatureQuality !== "QES") {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Invalid signature quality: ${signatureQuality}. Valid values are AES, SES, QES.`);
  }

  /* Read the message field */
  const message = config.fields.find((f) => f.key === "message")?.value || "";

  /* Read the user email */
  const userMail = environment.sender.mail;
  if (!userMail) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "User has no email address, cannot proceed with service!");
  }

  /* Read user language */
  let language: "en" | "de" | "fr" = "en";
  if (environment.sender.language?.startsWith("de")) {
    language = "de";
  }
  if (environment.sender.language?.startsWith("fr")) {
    language = "fr";
  }

  /* Search for the nearest webhook catch event if webhook should be triggered */
  const triggerWebhook = config.fields.find((f) => f.key === "triggerWebhook")?.value || "false";
  let webhookTriggerRoute: string | undefined;
  if (triggerWebhook === "true") {
    const webhookCatchEvent = findNearestWebHookCatchEvent(bpmnProcess, environment);
    if (webhookCatchEvent) {
      webhookTriggerRoute =
        environment.serverConfig.Webserver.baseUrl +
        getWebhookTriggerRoute(environment.instanceDetails.processId, webhookCatchEvent.id, environment.instanceDetails.instanceId.toLowerCase());
    } else {
      throw new BpmnError(ErrorCode.ConfigInvalid, "No webhook catch event found in the process to trigger.");
    }
  }

  /* Notify the signer via email by skribble? */
  const skribbleNotify = config.fields.find((f) => f.key === "skribbleNotify")?.value || "false";
  const notify = skribbleNotify === "true";

  const signatureRequest: ISignatureRequest = {
    title: fileName,
    message,
    content: fileData,
    legislation: "EIDAS",
    quality: signatureQuality,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    signatures: [{ account_email: userMail, notify, signer_identity_data: { email_address: userMail, language } }],
    // eslint-disable-next-line @typescript-eslint/naming-convention
    callback_success_url: webhookTriggerRoute,
  };
  return signatureRequest;
}

export async function signFile(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const configFile = await readConfigFile(configPath);
  environment.logger.info(`Using Skribble base URL: ${configFile.baseUrl}, user: ${configFile.userName}`);
  const skribbleApi = new SkribbleApi(configFile.baseUrl, configFile.userName, configFile.apiKey);

  await serviceLogic(environment, skribbleApi);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
