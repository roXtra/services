import * as PH from "processhub-sdk";
import * as XLSX from "xlsx";
import { ErrorStates } from "./csvServiceMethods";

let errorState: number = 0;

export async function projectreader(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  errorState = ErrorStates.NOERROR;
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;
  let instance = environment.instanceDetails;

  let filePath = fields.find(f => f.key == "filePath").value;
  let searchField = fields.find(f => f.key == "searchField").value;

  let keyword = getValueFromFieldName(environment, searchField);

  let project = getProjectFromXLSX(filePath, keyword);

  errorHandling(instance, () => initFields(instance, project));

  await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);
  return !Boolean(errorState);
}

function errorHandling(instance: any, normalBehavior: Function) {
  switch (errorState) {
    case ErrorStates.NOERROR:
      normalBehavior();
      break;

    // Error Handling
    case ErrorStates.ERRORCODE_FILEPATHNOTFOUND:
      instance.extras.fieldContents["Info"] = {
        value: "Keine Datei mit diesem Pfad gefunden",
        type: "ProcessHubTextArea"
      };
      break;

    case ErrorStates.ERRORCODE_NOSUCHPROJECT:
      instance.extras.fieldContents["Info"] = {
        value: "Kein Projekt mit diesem Suchbegriff gefunden",
        type: "ProcessHubTextArea"
      };
      break;
  }
}

function initFields(instance: PH.Instance.InstanceDetails, project: any) {
  const keys = Object.keys(project);
  keys.forEach((key: any) => {
    instance.extras.fieldContents[key] = {
      value: project[key],
      type: "ProcessHubTextArea"
    };
  });
}

function getValueFromFieldName(environment: PH.ServiceTask.ServiceTaskEnvironment, fieldName: string): string {
  return ((environment.instanceDetails.extras.fieldContents[fieldName] as PH.Data.FieldValue).value as string).trim();
}

function getProjectFromXLSX(filePath: string, keyword: string): any {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch {
    errorState = ErrorStates.ERRORCODE_FILEPATHNOTFOUND;
    return null;
  }
  let projectArray: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  for (let project of projectArray) {
    if (project[Object.keys(project)[0]] === keyword) {
      return project;
    }
  }

  errorState = ErrorStates.ERRORCODE_NOSUCHPROJECT;
  return null;
}