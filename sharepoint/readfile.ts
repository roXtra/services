import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { tl } from "processhub-sdk/lib/tl.js";
import fs from "fs/promises";
import { sharePoint } from "./sharepoint.js";
import { IServiceActionConfigField } from "processhub-sdk/lib/data/datainterfaces.js";

export enum ErrorCodes {
  SHAREPOINT_ERROR = "SHAREPOINT_ERROR",
}

export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<boolean> {
  const language = environment.sender.language || "en-US";
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
  const fieldContents = instance.extras.fieldContents || {};

  const { sharepointUrl, tenantId, clientId, certThumbprint, certBuffer, fileUrl } = await checkSharePointServiceConfig(fields, language);

  const targetField = fields.find((f) => f.key === "targetField")?.value;
  if (!targetField) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Ergebnisfeld fehlt.", language));
  }
  if (fieldContents[targetField] && fieldContents[targetField]?.type !== "ProcessHubFileUpload") {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Ergebnisfeld ist nicht vom Typ Dateianhang.", language));
  }

  let fileContents: Buffer;
  let fileName: string;

  try {
    ({ fileContents, fileName } = await sharePoint.readFileFromUrl({ sharepointUrl, tenantId, clientId, certThumbprint, certBuffer, fileUrl }));
    environment.logger.info("File read from SharePoint: " + fileName + " (" + fileContents.byteLength + " bytes)");
  } catch (error) {
    environment.logger.error("Error reading file from SharePoint: " + String(error));
    throw new BpmnError(ErrorCodes.SHAREPOINT_ERROR, tl("Fehler beim Lesen der Datei aus SharePoint: ", language) + String(error));
  }

  try {
    const url = await environment.instances.uploadAttachment(instance.instanceId, fileName, fileContents);

    if (url) {
      fieldContents[targetField] = fieldContents[targetField] || { type: "ProcessHubFileUpload", value: [] };
      const targetFieldValue = fieldContents[targetField] as { type: "ProcessHubFileUpload"; value: string[] | undefined };
      targetFieldValue.value = targetFieldValue.value || [];
      targetFieldValue.value.push(url);
    }
  } catch (error) {
    environment.logger.error("Error uploading attachment to instance " + String(error));
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Fehler beim Schreiben des Ergebnisfelds: ", language) + String(error));
  }

  return true;
}

export async function checkSharePointServiceConfig(fields: IServiceActionConfigField[], language: string) {
  let sharepointUrl = fields.find((f) => f.key === "sharepointUrl")?.value;
  if (!sharepointUrl) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("SharePoint URL fehlt.", language));
  }
  if (!sharepointUrl.endsWith("/")) {
    sharepointUrl += "/";
  }

  const tenantId = fields.find((f) => f.key === "tenantId")?.value;
  if (!tenantId) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Directory (tenant) ID fehlt.", language));
  }

  const clientId = fields.find((f) => f.key === "clientId")?.value;
  if (!clientId) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Application (client) ID fehlt.", language));
  }

  const certThumbprint = fields.find((f) => f.key === "certThumbprint")?.value;
  if (!certThumbprint) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Certificate thumbprint fehlt.", language));
  }

  const certPrivateKeyPath = fields.find((f) => f.key === "certPrivateKeyPath")?.value;
  if (!certPrivateKeyPath) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Pfad zur Zertifikatsdatei fehlt.", language));
  }
  let certBuffer: Buffer;
  try {
    certBuffer = await fs.readFile(certPrivateKeyPath);
  } catch (error) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Zertifikatsdatei konnte nicht gelesen werden: ", language) + String(error));
  }

  const fileUrl = fields.find((f) => f.key === "fileUrl")?.value;
  if (!fileUrl) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Link zur Datei im SharePoint fehlt.", language));
  }
  return { sharepointUrl, tenantId, clientId, certThumbprint, certBuffer, fileUrl };
}

export async function readFile(environment: IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
