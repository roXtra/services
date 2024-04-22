import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { IGenerateReportRequestType } from "processhub-sdk/lib/instance/legacyapi.js";

enum ErrorCodes {
  ATTACHMENT_ERROR = "ATTACHMENT_ERROR",
}

async function getReport(environment: IServiceTaskEnvironment, reportDraftID: string, reportType: IGenerateReportRequestType): Promise<string> {
  const instance = environment.instanceDetails;

  const reply = await environment.instances.generateInstanceReport(instance.processId, [instance.instanceId], reportDraftID, reportType);
  const url = await environment.instances.uploadAttachment(instance.instanceId, reply.fileName, Buffer.from(reply.doc, "base64"));

  return url;
}

export function initReportUploadField(url: string, instance: IInstanceDetails, reportFieldName: string): void {
  if (url && url.length > 0) {
    if (instance.extras.fieldContents?.[reportFieldName] == null) {
      if (instance.extras.fieldContents === undefined) {
        instance.extras.fieldContents = {};
      }
      instance.extras.fieldContents[reportFieldName] = { type: "ProcessHubFileUpload", value: undefined };
    }
    (instance.extras.fieldContents[reportFieldName] as IFieldValue).value = [url];
  } else {
    throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, "Der Bericht konnte dem Vorgang nicht angehängt werden.");
  }
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<IInstanceDetails> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
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

export async function createReport(environment: IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
