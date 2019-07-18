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
  let PSPField = fields.find(f => f.key == "PSP").value;

  let PSP = getValueFromFieldName(environment, PSPField);

  let project = getProjectFromXLSX(filePath, PSP);

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
        value: "Kein Projekt mit dieser PSP gefunden",
        type: "ProcessHubTextArea"
      };
      break;
  }
}

function initFields(instance: PH.Instance.InstanceDetails, project: any) {
  instance.extras.fieldContents["Bezeichnung"] = {
    value: project.Bezeichnung,
    type: "ProcessHubTextArea"
  };

  instance.extras.fieldContents["WE"] = {
    value: project.WE,
    type: "ProcessHubTextArea"
  };

  instance.extras.fieldContents["Kostenstelle"] = {
    value: project.Kostenstelle,
    type: "ProcessHubTextArea"
  };

  instance.extras.fieldContents["Overheadanteil"] = {
    value: project.Overheadanteil,
    type: "ProcessHubTextArea"
  };
}

function getValueFromFieldName(environment: PH.ServiceTask.ServiceTaskEnvironment, fieldName: string): string {
  return ((environment.instanceDetails.extras.fieldContents[fieldName] as PH.Data.FieldValue).value as string).trim();
}

function getProjectFromXLSX(filePath: string, PSP: string): any {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch {
    errorState = ErrorStates.ERRORCODE_FILEPATHNOTFOUND;
    return null;
  }
  let projectArray: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

  for (let project of projectArray) {
    if (project.PSP === PSP) {
      return project;
    }
  }

  errorState = ErrorStates.ERRORCODE_NOSUCHPROJECT;
  return null;
}