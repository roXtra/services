import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { BpmnError, ErrorCode as BpmnErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { IGenerateReportRequestType } from "processhub-sdk/lib/instance/legacyapi.js";

enum ErrorCodes {
  ATTACHMENT_ERROR = "ATTACHMENT_ERROR",
}

export async function uploadReport(
  environment: IServiceTaskEnvironment,
  reportDraftID: string,
  reportType: IGenerateReportRequestType,
  fileNameFieldName: string | undefined,
): Promise<string> {
  const instance = environment.instanceDetails;

  const reply = await environment.instances.generateInstanceReport(instance.processId, [instance.instanceId], reportDraftID, reportType);

  let fileName: string | undefined;
  if (fileNameFieldName) {
    const filenameField = instance.extras.fieldContents?.[fileNameFieldName];
    if (filenameField?.type !== "ProcessHubTextInput") {
      throw new BpmnError(BpmnErrorCode.ConfigInvalid, `The field ${fileNameFieldName} does not exist or is not a text input field.`);
    }
    // Fallback to the default filename if the field is empty, do not throw an error
    if (typeof filenameField?.value === "string") {
      fileName = filenameField.value;
    }
  }

  environment.logger.info(`Uploading report with filename ${fileName || reply.fileName} and type ${reportType} for instance ${instance.instanceId}`);
  const url = await environment.instances.uploadAttachment(instance.instanceId, fileName || reply.fileName, Buffer.from(reply.doc, "base64"));

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
    // The property environment.instanceDetails.extras.fieldContents[targetField] is definitely assigned here as it is checked or initialized in the lines above
    instance.extras.fieldContents[reportFieldName].value = [url];
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
  const filenameFieldName = fields.find((f) => f.key === "selectFilenameField")?.value;

  if (reportFieldName === undefined) {
    throw new Error("reportFieldName is undefined, cannot proceed!");
  }

  if (reportDraftID === undefined) {
    throw new Error("reportDraftID is undefined, cannot proceed!");
  }

  if (reportType === "docx" || reportType === "pdf") {
    const response = await uploadReport(environment, reportDraftID, reportType, filenameFieldName);
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
