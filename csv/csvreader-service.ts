import * as PH from "processhub-sdk";
import * as XLSX from "xlsx";
import { CSVServiceMethods, ErrorStates } from "./csvServiceMethods";

let errorState = ErrorStates.NOERROR;

function errorHandling(instance: PH.Instance.IInstanceDetails, table: string): void {
  switch (errorState) {
    case ErrorStates.NOERROR:
      instance.extras.fieldContents["Ergebnis"] = {
        value: table,
        type: "ProcessHubTextArea"
      };

      break;
    case ErrorStates.ERRORCODE_NORESULTS:
      instance.extras.fieldContents["Info"] = {
        value: "Keine Übereinstimmung",
        type: "ProcessHubTextArea"
      };
      break;
    case ErrorStates.ERRORCODE_NOSUCHFILE:
      instance.extras.fieldContents["Info"] = {
        value: "Keine Datei mit diesem Namen gefunden",
        type: "ProcessHubTextArea"
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
  const fields = config.fields;
  const instance = environment.instanceDetails;

  const filePath = fields.find(f => f.key === "filePath").value;
  const sheetName = fields.find(f => f.key === "sheetName").value;
  let query = fields.find(f => f.key === "query").value;
  let xlsxfile;
  let table;

  try {
    xlsxfile = XLSX.readFile(filePath);
  }
  catch {
    errorState = ErrorStates.ERRORCODE_NOSUCHFILE;
  }
  if (errorState === ErrorStates.NOERROR) {
    const json = XLSX.utils.sheet_to_json(xlsxfile.Sheets[sheetName]);
    query = CSVServiceMethods.parseFieldsOfQuery(query, instance);
    const resultArray = CSVServiceMethods.query(json, query);
    table = CSVServiceMethods.generateTable(resultArray);
    if (table === "") {
      errorState = ErrorStates.ERRORCODE_NORESULTS;
    }
  }
  errorHandling(instance, table);
}

export async function csvreader(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);

  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}