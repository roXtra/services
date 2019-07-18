import * as PH from "processhub-sdk";
import * as XLSX from "xlsx";
import { csvServiceMethods, ErrorStates } from "./csvServiceMethods";

let errorState = ErrorStates.NOERROR;

export async function csvreader(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  errorState = ErrorStates.NOERROR;
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;
  let instance = environment.instanceDetails;

  let filePath = fields.find(f => f.key == "filePath").value;
  let sheetName = fields.find(f => f.key == "sheetName").value;
  let query = fields.find(f => f.key == "query").value;

  let xlsxfile;
  let table;

  try {
    xlsxfile = XLSX.readFile(filePath);
  } catch {
    errorState = ErrorStates.ERRORCODE_NOSUCHFILE;
  }

  if (errorState == ErrorStates.NOERROR) {
    let json = XLSX.utils.sheet_to_json(xlsxfile.Sheets[sheetName]);

    query = csvServiceMethods.parseFieldsOfQuery(query, instance);

    let resultArray = csvServiceMethods.query(json, query);
    table = csvServiceMethods.generateTable(resultArray);
    if (table == "") {
      errorState = ErrorStates.ERRORCODE_NORESULTS;
    }
  }

  errorHandling(instance, table);

  await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);
  return true;
}

function errorHandling(instance: PH.Instance.InstanceDetails, table: string) {
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