import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { ProcessExtras } from "processhub-sdk/lib/process/processinterfaces";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";

enum ErrorCodes {
  ATTACHMENT_ERROR = "ATTACHMENT_ERROR",
}

function getDateTimeFormatted(date: Date): string {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  const minute = pad(date.getUTCMinutes());
  const second = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

function pad(i: number): string {
  return i < 10 ? `0${i}` : `${i}`;
}

export async function generate(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  const instance = environment.instanceDetails;

  const titleField = fields.find((f) => f.key === "titleField")?.value;
  const locationField = fields.find((f) => f.key === "locationField")?.value;
  const fromField = fields.find((f) => f.key === "fromField")?.value;
  const tillField = fields.find((f) => f.key === "tillField")?.value;
  const targetField = fields.find((f) => f.key === "targetField")?.value;
  const descriptionField = fields.find((f) => f.key === "descriptionField")?.value;
  const fileNameField = fields.find((f) => f.key === "fileNameField")?.value;

  if (titleField === undefined) {
    throw new Error("titleField is undefined, cannot proceed!");
  }
  if (locationField === undefined) {
    throw new Error("locationField is undefined, cannot proceed!");
  }
  if (fromField === undefined) {
    throw new Error("fromField is undefined, cannot proceed!");
  }
  if (tillField === undefined) {
    throw new Error("tillField is undefined, cannot proceed!");
  }
  if (targetField === undefined) {
    throw new Error("targetField is undefined, cannot proceed!");
  }
  if (descriptionField === undefined) {
    throw new Error("descriptionField is undefined, cannot proceed!");
  }
  if (fileNameField === undefined) {
    throw new Error("fileNameField is undefined, cannot proceed!");
  }
  if (instance.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed!");
  }

  let icsString = "";
  icsString += "BEGIN:VCALENDAR\n";
  icsString += "VERSION:2.0\n";
  icsString += "PRODID:--//rossmanith//DE\n";
  icsString += "CALSCALE:GREGORIAN\n";

  // Create a time zone if needed, TZID to be used in the event itself
  // icsString += "BEGIN:VTIMEZONE\n";
  // icsString += "TZID:Europe/Berlin\n";
  // icsString += "BEGIN:STANDARD\n";
  // icsString += "TZOFFSETTO:+0100\n";
  // icsString += "TZOFFSETFROM:+0100\n";
  // icsString += "END:STANDARD\n";
  // icsString += "END:VTIMEZONE\n";

  // Add the event
  icsString += "BEGIN:VEVENT\n";

  // With time zone specified
  const fromValue = (instance.extras.fieldContents[fromField] as IFieldValue).value;
  const fromDate = new Date(fromValue as string);

  const tillValue = (instance.extras.fieldContents[tillField] as IFieldValue).value;
  const tillDate = new Date(tillValue as string);

  // Timezone
  // icsString += "DTSTART;TZID=Europe/Amsterdam:" + getDateFormatted(fromDate, true) + "\n";
  // icsString += "DTEND;TZID=Europe/Amsterdam:" + getDateFormatted(tillDate, false) + "\n";
  // or without
  icsString += "DTSTART:" + getDateTimeFormatted(fromDate) + "\n";
  icsString += "DTEND:" + getDateTimeFormatted(tillDate) + "\n";

  const process = await environment.processes.getProcessDetails(instance.processId, ProcessExtras.ExtrasProcessRolesWithMemberNames);

  if (process.extras.processRoles === undefined) {
    throw new Error("processRoles are undefined, cannot proceed!");
  }
  if (instance.extras.roleOwners === undefined) {
    throw new Error("roleOwners are undefined, cannot proceed!");
  }

  // Title
  const titleValue = instance.extras.fieldContents[titleField] != null ? (instance.extras.fieldContents[titleField] as IFieldValue).value : "";

  const parsedSummary = parseAndInsertStringWithFieldContent(
    String(titleValue),
    instance.extras.fieldContents,
    process.extras.processRoles,
    instance.extras.roleOwners,
    environment.sender.language || "de-DE",
  );

  if (parsedSummary === undefined) {
    throw new Error("parsedSummary is undefined, cannot proceed!");
  }

  icsString += "SUMMARY:" + parsedSummary + "\n";
  // Location
  const locationValue = instance.extras.fieldContents[locationField] != null ? (instance.extras.fieldContents[locationField] as IFieldValue).value : "";
  icsString += "LOCATION:" + String(locationValue) + "\n";
  // Description
  const descriptionValue = instance.extras.fieldContents[descriptionField] != null ? (instance.extras.fieldContents[descriptionField] as IFieldValue).value : "";
  icsString += "DESCRIPTION:" + String(descriptionValue) + "\n";
  // Priority
  // icsString += "PRIORITY:3\n";
  icsString += "END:VEVENT\n";

  // End calendar item
  icsString += "END:VCALENDAR\n";

  // Filename
  const fileNameValue = instance.extras.fieldContents[fileNameField] != null ? (instance.extras.fieldContents[fileNameField] as IFieldValue).value : "";

  const url: string = await environment.instances.uploadAttachment(instance.instanceId, String(fileNameValue), Buffer.from(icsString));

  if (url) {
    if (instance.extras.fieldContents[targetField] == null) {
      instance.extras.fieldContents[targetField] = { type: "ProcessHubFileUpload", value: undefined };
    }
    (instance.extras.fieldContents[targetField] as IFieldValue).value = [url];
    await environment.instances.updateInstance(instance);

    return true;
  }

  throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, "Es konnten keine Anhänge erstellt werden.");
}
