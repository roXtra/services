import * as PH from "processhub-sdk";
import { GenerateReportRequest, GenerateReportReply } from "processhub-sdk/lib/instance";
import { ApiResult } from "processhub-sdk/lib/legacyapi";

const ERRORCODES = {
  NOERROR: 0,
  NOSELECTEDTEMPLATE: 1,
  SERVERERROR: 2
}

let error = ERRORCODES.NOERROR;

export async function createReport(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  error = ERRORCODES.NOERROR;

  // Get the instance to manipulate and add fields
  let instance = await serviceLogic(environment);

  errorHandling(instance)
  // update the Instance with changes
  await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);
  return true;
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<PH.Instance.InstanceDetails> {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;
  let instance = environment.instanceDetails;
  
  let reportDraftID = fields.find(f => f.key == "selectReportDraft").value;
  let reportType = fields.find(f => f.key == "selectReportType").value;
  let reportFieldName = fields.find(f => f.key == "selectReportField").value;

  if (!reportDraftID) {
    error = ERRORCODES.NOSELECTEDTEMPLATE;
    return instance;
  }

  const response = await getReport(environment, reportDraftID, reportType);

  initReportUploadField(response, instance, reportFieldName);

  return instance;
}

function errorHandling(instance: PH.Instance.InstanceDetails) {
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

async function getReport(environment: PH.ServiceTask.ServiceTaskEnvironment, reportDraftID: string, reportType: string): Promise<PH.Instance.UploadAttachmentReply> {
  let instance = environment.instanceDetails; 

  let reply: GenerateReportReply = await PH.LegacyApi.getJson(PH.Instance.ProcessEngineApiRoutes.generateReport, {
    instanceIds: instance.instanceId,
    draftId: reportDraftID,
    type: reportType
  } as GenerateReportRequest , environment.accessToken) as GenerateReportReply;

  if (reply.result === ApiResult.API_ERROR) {
    error = ERRORCODES.SERVERERROR;
    return null;
  }

  let response = await PH.LegacyApi.postJson(PH.Instance.ProcessEngineApiRoutes.uploadAttachment, {
    data: Buffer.from(reply.doc).toString("base64"),
    fileName: reply.fileName,
    instanceId: instance.instanceId,
    processId: instance.processId,
  } as PH.Instance.UploadAttachmentRequest, environment.accessToken) as PH.Instance.UploadAttachmentReply;

  return response;
}

export function initReportUploadField(response: PH.Instance.UploadAttachmentReply, instance: PH.Instance.InstanceDetails, reportFieldName: string) {
  if (response && response.result == PH.LegacyApi.ApiResult.API_OK) {
    if (instance.extras.fieldContents[reportFieldName] == null) {
      instance.extras.fieldContents[reportFieldName] = { type: "ProcessHubFileUpload", value: null } as PH.Data.FieldValue;
    }
    (instance.extras.fieldContents[reportFieldName] as PH.Data.FieldValue).value = [response.url];
  }
}
