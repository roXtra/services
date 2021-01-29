import * as PH from "processhub-sdk";
import { BpmnError } from "processhub-sdk/lib/instance";

enum ErrorCodes {
  ATTACHMENT_ERROR = "ATTACHMENT_ERROR",
}

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
  } else {
    throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, "Der Bericht konnte dem Vorgang nicht angehängt werden.");
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

  if (reportDraftID === undefined) {
    throw new Error("reportDraftID is undefined, cannot proceed!");
  }

  if (reportType === "docx" || reportType === "pdf") {
    const response = await getReport(environment, reportDraftID, reportType);
    initReportUploadField(response, instance, reportFieldName);
  } else {
    throw new Error(`Invalid report type ${String(reportType)}`);
  }

  return instance;
}

export async function createReport(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
