import * as PH from "processhub-sdk";

const ERRORCODES = {
  NOERROR: 0,
  NOSELECTEDTEMPLATE: 1,
  SERVERERROR: 2,
};

let error = ERRORCODES.NOERROR;

async function getReport(environment: PH.ServiceTask.IServiceTaskEnvironment, reportDraftID: string, reportType: PH.Instance.IGenerateReportRequestType): Promise<string> {
  const instance = environment.instanceDetails;

  const reply = await environment.instances.generateInstanceReport([instance.instanceId], reportDraftID, reportType);
  const url = await environment.instances.uploadAttachment(instance.processId, instance.instanceId, reply.fileName, reply.doc);

  return url;
}

export function initReportUploadField(url: string, instance: PH.Instance.IInstanceDetails, reportFieldName: string): void {
  if (url && url.length > 0) {
    if (instance.extras.fieldContents?.[reportFieldName] == null) {
      if (instance.extras.fieldContents === undefined) {
        instance.extras.fieldContents = {};
      }
      instance.extras.fieldContents[reportFieldName] = { type: "ProcessHubFileUpload", value: undefined };
    }
    (instance.extras.fieldContents[reportFieldName] as PH.Data.IFieldValue).value = [url];
  }
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<PH.Instance.IInstanceDetails> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("config is undefined, cannot proceed!");
  }

  const fields = config.fields;
  const instance = environment.instanceDetails;

  const reportDraftID = fields.find((f) => f.key === "selectReportDraft")?.value;
  const reportType = fields.find((f) => f.key === "selectReportType")?.value;
  const reportFieldName = fields.find((f) => f.key === "selectReportField")?.value;

  if (reportFieldName === undefined) {
    throw new Error("reportFieldName is undefined, cannot proceed!");
  }

  if (!reportDraftID) {
    error = ERRORCODES.NOSELECTEDTEMPLATE;
    return instance;
  }

  if (reportType === "docx" || reportType === "pdf") {
    const response = await getReport(environment, reportDraftID, reportType);
    initReportUploadField(response, instance, reportFieldName);
  } else {
    throw new Error(`Invalid report type ${String(reportType)}`);
  }

  return instance;
}

function errorHandling(instance: PH.Instance.IInstanceDetails): void {
  switch (error) {
    case ERRORCODES.NOERROR: {
      break;
    }
    case ERRORCODES.NOSELECTEDTEMPLATE: {
      if (instance.extras.fieldContents === undefined) {
        instance.extras.fieldContents = {};
      }
      instance.extras.fieldContents["Fehler"] = { type: "ProcessHubTextArea", value: "Es wurde keine Berichtsvorlage ausgewählt." } as PH.Data.IFieldValue;
      break;
    }
    case ERRORCODES.SERVERERROR: {
      if (instance.extras.fieldContents === undefined) {
        instance.extras.fieldContents = {};
      }
      instance.extras.fieldContents["Fehler"] = { type: "ProcessHubTextArea", value: "Der Server konnte keinen Bericht erstellen." } as PH.Data.IFieldValue;
      break;
    }
  }
}

export async function createReport(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  error = ERRORCODES.NOERROR;

  // Get the instance to manipulate and add fields
  const instance = await serviceLogic(environment);

  errorHandling(instance);
  // Update the Instance with changes
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
