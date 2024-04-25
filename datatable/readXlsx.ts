import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { IDataTableFieldValue } from "processhub-sdk/lib/data/fields/datatable.js";
import { checkResultField, loadConfig, readFileData } from "./common.js";

/**
 * This is the main service entry point for this action
 * @param environment service env
 * @returns true in case of success
 */
export async function readXlsx(environment: IServiceTaskEnvironment): Promise<boolean> {
  await readXlsxFile(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}

export async function readXlsxFile(environment: IServiceTaskEnvironment): Promise<IDataTableFieldValue> {
  const language = environment.sender.language || "en-US";

  const { config, bpmnProcess } = await loadConfig(environment, language);

  const fields = config.fields;

  const filePath = fields.find((f) => f.key === "filePath")?.value || "";
  const sheetName = fields.find((f) => f.key === "sheetName")?.value || "";
  const dataTableField = fields.find((f) => f.key === "dataTableField")?.value || "";
  const rowFilter = fields.find((f) => f.key === "rowFilter")?.value || "";

  if (!filePath) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Dateipfad ist leer.", language));
  }
  if (!dataTableField) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist leer.", language));
  }

  const fieldConfig = checkResultField(bpmnProcess, dataTableField, language);

  const fieldValue = readFileData(environment, language, rowFilter, fieldConfig, sheetName, filePath);

  const instance = environment.instanceDetails;
  const fieldContents = instance.extras.fieldContents || {};

  fieldContents[dataTableField] = {
    type: "ProcessHubDataTable",
    value: fieldValue,
  };
  return fieldValue;
}
