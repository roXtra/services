import * as PH from "processhub-sdk";
import * as XLSX from "xlsx";
import { ErrorStates } from "./csvServiceMethods";

let errorState = 0;

function getValueFromFieldName(environment: PH.ServiceTask.IServiceTaskEnvironment, fieldName: string): string {
  return ((environment.instanceDetails.extras.fieldContents[fieldName] as PH.Data.IFieldValue).value as string).trim();
}

function getProjectFromXLSX(filePath: string, keyword: string): any {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch {
    errorState = ErrorStates.ERRORCODE_FILEPATHNOTFOUND;
    return null;
  }
  const projectArray: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  for (const project of projectArray) {
    if (project[Object.keys(project)[0]] === keyword) {
      return project;
    }
  }

  errorState = ErrorStates.ERRORCODE_NOSUCHPROJECT;
  return null;
}

function errorHandling(instance: any, normalBehavior: Function): void {
  switch (errorState) {
    case ErrorStates.NOERROR:
      normalBehavior();
      break;

    // Error Handling
    case ErrorStates.ERRORCODE_FILEPATHNOTFOUND:
      instance.extras.fieldContents["Info"] = {
        value: "Keine Datei mit diesem Pfad gefunden",
        type: "ProcessHubTextArea",
      };
      break;

    case ErrorStates.ERRORCODE_NOSUCHPROJECT:
      instance.extras.fieldContents["Info"] = {
        value: "Kein Projekt mit diesem Suchbegriff gefunden",
        type: "ProcessHubTextArea",
      };
      break;
  }
}

function initFields(instance: PH.Instance.IInstanceDetails, project: any): void {
  const keys = Object.keys(project);
  keys.forEach((key: any) => {
    instance.extras.fieldContents[key] = {
      value: project[key],
      type: "ProcessHubTextArea",
    };
  });
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

  const filePath = fields.find((f) => f.key === "filePath").value;
  const searchField = fields.find((f) => f.key === "searchField").value;

  const keyword = getValueFromFieldName(environment, searchField);

  const project = getProjectFromXLSX(filePath, keyword);

  errorHandling(instance, () => initFields(instance, project));
}

export async function projectreader(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);

  await environment.instances.updateInstance(environment.instanceDetails);
  return !errorState;
}
