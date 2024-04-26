import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { DataTableErrorCode, checkResultField, getPhysicalPath, loadConfig, readFileData } from "./common.js";

/**
 * This is the main service entry point for this action
 * @param environment service env
 * @returns true in case of success
 */
export async function readXlsxFromAttachment(environment: IServiceTaskEnvironment): Promise<boolean> {
  const language = environment.sender.language || "en-US";

  const { config, bpmnProcess } = await loadConfig(environment, language);

  const fields = config.fields;

  const inputField = fields.find((f) => f.key === "inputField")?.value || "";
  const sheetName = fields.find((f) => f.key === "sheetName")?.value || "";
  const dataTableField = fields.find((f) => f.key === "dataTableField")?.value || "";
  const rowFilter = fields.find((f) => f.key === "rowFilter")?.value || "";

  if (!inputField) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Eingabefeld ist nicht konfiguriert.", language));
  }
  const fieldContents = environment.instanceDetails.extras.fieldContents || {};
  const inputFieldContent = fieldContents[inputField];
  if (!inputFieldContent) {
    throw new BpmnError(DataTableErrorCode.INPUT_FIELD_ERROR, tl("Das Eingabefeld ist nicht vorhanden.", language));
  }
  if (inputFieldContent.type !== "ProcessHubFileUpload") {
    throw new BpmnError(DataTableErrorCode.INPUT_FIELD_ERROR, tl("Das Eingabefeld ist kein Dateianhangsfeld.", language));
  }
  const inputFieldContentValue = inputFieldContent.value as string[] | undefined;
  if (!inputFieldContentValue || inputFieldContentValue.length === 0) {
    throw new BpmnError(DataTableErrorCode.INPUT_FIELD_ERROR, tl("Das Eingabefeld ist leer.", language));
  }
  if (!dataTableField) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist leer.", language));
  }

  const filePath = getPhysicalPath(inputFieldContentValue[0], environment);

  const fieldConfig = checkResultField(bpmnProcess, dataTableField, language);

  const fieldValue = readFileData(environment, language, rowFilter, fieldConfig, sheetName, filePath);

  fieldContents[dataTableField] = {
    type: "ProcessHubDataTable",
    value: fieldValue,
  };
  await environment.instances.updateInstance(environment.instanceDetails);

  return true;
}
