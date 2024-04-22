import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { tl } from "processhub-sdk/lib/tl.js";
import * as XLSX from "xlsx";
import { CSVServiceMethods } from "./csvServiceMethods.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import fs from "fs";

enum ErrorCodes {
  FILE_ERROR = "FILE_ERROR",
}

export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<void> {
  const language = environment.sender.language || "de-DE";
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, die Konfiguration konnte nicht geladen werden.", language));
  }

  const fields = config.fields;
  const instance = environment.instanceDetails;
  const fieldContents = instance.extras.fieldContents || {};

  const filePath = fields.find((f) => f.key === "filePath")?.value || "";
  const sheetName = fields.find((f) => f.key === "sheetName")?.value || "";
  let query = fields.find((f) => f.key === "query")?.value || "";

  let xlsxfile;
  try {
    xlsxfile = XLSX.readFile(filePath);
  } catch {
    throw new BpmnError(ErrorCodes.FILE_ERROR, tl(`Es konnte keine CSV oder XLSX Datei unter dem Pfad ${filePath} gefunden werden.`, language));
  }

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(xlsxfile.Sheets[sheetName]);
  if (json.length === 0) throw new BpmnError(ErrorCodes.FILE_ERROR, tl(`Das Arbeitsblatt mit dem Namen ${sheetName} enthält keine Daten.`, language));

  query = CSVServiceMethods.parseFieldsOfQuery(query, instance);
  const resultArray = CSVServiceMethods.query(json, query);
  const table = CSVServiceMethods.generateTable(resultArray);

  fieldContents["Ergebnis"] = {
    value: table,
    type: "ProcessHubTextArea",
  };
}

export async function csvreader(environment: IServiceTaskEnvironment): Promise<boolean> {
  XLSX.set_fs(fs);
  await serviceLogic(environment);

  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
