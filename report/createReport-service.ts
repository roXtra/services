import * as PH from "processhub-sdk";

const ERRORCODES = {
  NOERROR: 0,
  NOSELECTEDTEMPLATE: 1,
  SERVERERROR: 2
};

let error = ERRORCODES.NOERROR;

async function getReport(environment: PH.ServiceTask.ServiceTaskEnvironment, reportDraftID: string, reportType: "docx" | "pdf"): Promise<string> {
  const instance = environment.instanceDetails;


  const reply = await environment.instances.generateInstanceReport(instance.instanceId, reportDraftID, reportType);
  const url = await environment.instances.uploadAttachment(instance.processId, instance.instanceId, reply.fileName, Buffer.from(reply.doc).toString("base64"));

  return url;
}

export function initReportUploadField(url: string, instance: PH.Instance.InstanceDetails, reportFieldName: string): void {
  if (url && url.length > 0) {
    if (instance.extras.fieldContents[reportFieldName] == null) {
      instance.extras.fieldContents[reportFieldName] = { type: "ProcessHubFileUpload", value: null } as PH.Data.FieldValue;
    }
    (instance.extras.fieldContents[reportFieldName] as PH.Data.FieldValue).value = [url];
  }
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<PH.Instance.InstanceDetails> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;
  const instance = environment.instanceDetails;

  const reportDraftID = fields.find(f => f.key === "selectReportDraft").value;
  const reportType = fields.find(f => f.key === "selectReportType").value;
  const reportFieldName = fields.find(f => f.key === "selectReportField").value;

  if (!reportDraftID) {
    error = ERRORCODES.NOSELECTEDTEMPLATE;
    return instance;
  }

  if (reportType === "docx" || reportType === "pdf") {
    const response = await getReport(environment, reportDraftID, reportType);
    initReportUploadField(response, instance, reportFieldName);
  } else {
    throw new Error(`Invalid report type ${reportType}`);
  }

  return instance;
}

function errorHandling(instance: PH.Instance.InstanceDetails): void {
  switch (error) {
    case ERRORCODES.NOERROR: {
      break;
    }
    case ERRORCODES.NOSELECTEDTEMPLATE: {
      instance.extras.fieldContents["Fehler"] = { type: "ProcessHubTextArea", value: "Es wurde keine Berichtsvorlage ausgewählt." } as PH.Data.FieldValue;
      break;
    }
    case ERRORCODES.SERVERERROR: {
      instance.extras.fieldContents["Fehler"] = { type: "ProcessHubTextArea", value: "Der Server konnte keinen Bericht erstellen." } as PH.Data.FieldValue;
      break;
    }
  }
}

export async function createReport(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  error = ERRORCODES.NOERROR;

  // Get the instance to manipulate and add fields
  const instance = await serviceLogic(environment);

  errorHandling(instance);
  // Update the Instance with changes
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
