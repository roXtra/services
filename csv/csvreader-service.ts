import * as PH from "processhub-sdk";
import * as XLSX from "xlsx";
import { CSVServiceMethods, ErrorStates } from "./csvServiceMethods";

let errorState = ErrorStates.NOERROR;

function errorHandling(instance: PH.Instance.IInstanceDetails, table: string): void {
  if (instance.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  switch (errorState) {
    case ErrorStates.NOERROR:
      instance.extras.fieldContents["Ergebnis"] = {
        value: table,
        type: "ProcessHubTextArea",
      };

      break;
    case ErrorStates.ERRORCODE_NORESULTS:
      instance.extras.fieldContents["Info"] = {
        value: "Keine Übereinstimmung",
        type: "ProcessHubTextArea",
      };
      break;
    case ErrorStates.ERRORCODE_NOSUCHFILE:
      instance.extras.fieldContents["Info"] = {
        value: "Keine Datei mit diesem Namen gefunden",
        type: "ProcessHubTextArea",
      };
      break;
  }
}

export async function serviceLogic(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<void> {
  errorState = ErrorStates.NOERROR;
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  const instance = environment.instanceDetails;

  const filePath = fields.find((f) => f.key === "filePath")?.value;
  const sheetName = fields.find((f) => f.key === "sheetName")?.value;
  let query = fields.find((f) => f.key === "query")?.value;
  let xlsxfile;
  let table;

  if (filePath === undefined) {
    throw new Error("filePath is undefined, cannot proceed!");
  }
  if (sheetName === undefined) {
    throw new Error("sheetName is undefined, cannot proceed!");
  }
  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed!");
  }

  try {
    xlsxfile = XLSX.readFile(filePath);
  } catch {
    errorState = ErrorStates.ERRORCODE_NOSUCHFILE;
  }
  if (errorState === ErrorStates.NOERROR) {
    if (xlsxfile === undefined) {
      throw new Error("xlsxfile is undefined but errorState is NOERROR, cannot proceed!");
    }

    const json = XLSX.utils.sheet_to_json(xlsxfile.Sheets[sheetName]);
    query = CSVServiceMethods.parseFieldsOfQuery(query, instance);
    const resultArray = CSVServiceMethods.query(json, query);
    table = CSVServiceMethods.generateTable(resultArray);
    if (table === "") {
      errorState = ErrorStates.ERRORCODE_NORESULTS;
    }
  }
  if (table === undefined) {
    throw new Error("table is undefined, cannot proceed!");
  }
  errorHandling(instance, table);
}

export async function csvreader(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);

  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
