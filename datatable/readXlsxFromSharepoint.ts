import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { checkResultField, loadConfig, readFileData } from "./common.js";
import { checkSharePointServiceConfig } from "../sharepoint/readfile.js";
import { sharePoint } from "../sharepoint/sharepoint.js";

export enum ErrorCodes {
  SHAREPOINT_ERROR = "SHAREPOINT_ERROR",
}

/**
 * This is the main service entry point for this action
 * @param environment service env
 * @returns true in case of success
 */
export async function readXlsxFromSharepoint(environment: IServiceTaskEnvironment): Promise<boolean> {
  const language = environment.sender.language || "en-US";

  const { config, bpmnProcess } = await loadConfig(environment, language);

  const fields = config.fields;

  const sheetName = fields.find((f) => f.key === "sheetName")?.value || "";
  const dataTableField = fields.find((f) => f.key === "dataTableField")?.value || "";
  const rowFilter = fields.find((f) => f.key === "rowFilter")?.value || "";

  const sharePointConfig = await checkSharePointServiceConfig(fields, language);

  if (!dataTableField) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist leer.", language));
  }

  const fieldConfig = checkResultField(bpmnProcess, dataTableField, language);

  let fileContents: Buffer;
  let fileName: string;

  try {
    ({ fileContents, fileName } = await sharePoint.readFileFromUrl(sharePointConfig));
    environment.logger.info("File read from SharePoint: " + fileName + " (" + fileContents.byteLength + " bytes)");
  } catch (error) {
    environment.logger.error("Error reading file from SharePoint: " + String(error));
    throw new BpmnError(ErrorCodes.SHAREPOINT_ERROR, tl("Fehler beim Lesen der Datei aus SharePoint: ", language) + String(error));
  }

  const fieldValue = readFileData(environment, language, rowFilter, fieldConfig, sheetName, fileContents);

  const fieldContents = environment.instanceDetails.extras.fieldContents || {};
  fieldContents[dataTableField] = {
    type: "ProcessHubDataTable",
    value: fieldValue,
  };
  await environment.instances.updateInstance(environment.instanceDetails);

  return true;
}
