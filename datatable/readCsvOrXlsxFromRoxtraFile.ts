import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { IDataTableFieldValue } from "processhub-sdk/lib/data/fields/datatable.js";
import { checkResultField, loadConfig, readFileData } from "./common.js";
import { ReadXlsxApi } from "./readXlsxApi.js";

/**
 * This is the main service entry point for this action
 * @param environment service env
 * @returns true in case of success
 */
export async function readCsvOrXlsx(environment: IServiceTaskEnvironment): Promise<boolean> {
  const readXlsxApi = new ReadXlsxApi();
  await readCsvOrXlsxFile(environment, readXlsxApi);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}

export async function readCsvOrXlsxFile(environment: IServiceTaskEnvironment, readXlsxApi: ReadXlsxApi): Promise<IDataTableFieldValue> {
  const language = environment.sender.language || "en-US";
  let token: string;

  const { config, bpmnProcess } = await loadConfig(environment, language);

  const fields = config.fields;

  const fileID = fields.find((f) => f.key === "roxtraFileID")?.value || "";
  const sheetName = fields.find((f) => f.key === "sheetName")?.value || "";
  const dataTableField = fields.find((f) => f.key === "dataTableField")?.value || "";
  const rowFilter = fields.find((f) => f.key === "rowFilter")?.value || "";
  const fileFetchMode = fields.find((f) => f.key === "roxtraFileFetchMode")?.value || "user";

  if (!fileID) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Die ID des roXtra-Dokuments wurde nicht gesetzt.", language));
  }
  if (!dataTableField) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist leer.", language));
  }

  if (fileFetchMode === "user") {
    token = environment.roxApi.getApiToken();
  } else {
    token = await environment.roxApi.getAccessTokenFromAuth("-1");
  }

  const fieldConfig = checkResultField(bpmnProcess, dataTableField, language);
  const APIUrl = environment.roxApi.getEfApiEndpoint();
  const efAccessToken = await environment.roxApi.getEfApiToken();
  const file = await readXlsxApi.getDocumentCall(APIUrl, efAccessToken, token, fileID);

  const fieldValue = readFileData(environment, language, rowFilter, fieldConfig, sheetName, file);

  const instance = environment.instanceDetails;
  const fieldContents = instance.extras.fieldContents || {};

  fieldContents[dataTableField] = {
    type: "ProcessHubDataTable",
    value: fieldValue,
  };
  return fieldValue;
}
