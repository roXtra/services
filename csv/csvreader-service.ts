import * as PH from "processhub-sdk";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance";
import * as XLSX from "xlsx";
import { CSVServiceMethods } from "./csvServiceMethods";

enum ErrorCodes {
  FILE_ERROR = "FILE_ERROR",
}

export async function serviceLogic(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<void> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, PH.tl("Der Service ist nicht korrekt konfiguiriert, die Konfiguration konnte nicht geladen werden."));
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
    throw new BpmnError(ErrorCodes.FILE_ERROR, PH.tl(`Es konnte keine CSV oder XLSX Datei unter dem Pfad ${filePath} gefunden werden.`));
  }

  const json = XLSX.utils.sheet_to_json(xlsxfile.Sheets[sheetName]);
  if (json.length === 0) throw new BpmnError(ErrorCodes.FILE_ERROR, PH.tl(`Das Arbeitsblatt mit dem Namen ${sheetName} enthält keine Daten.`));

  query = CSVServiceMethods.parseFieldsOfQuery(query, instance);
  const resultArray = CSVServiceMethods.query(json, query);
  const table = CSVServiceMethods.generateTable(resultArray);

  fieldContents["Ergebnis"] = {
    value: table,
    type: "ProcessHubTextArea",
  };
}

export async function csvreader(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);

  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
