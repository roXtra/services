import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { ProcessExtras } from "processhub-sdk/lib/process/processinterfaces";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { removeHtmlTags } from "processhub-sdk/lib/tools/stringtools";

enum ErrorCodes {
  ATTACHMENT_ERROR = "ATTACHMENT_ERROR",
  CONFIG_ERROR = "CONFIG_ERROR",
  INPUT_ERROR = "INPUT_ERROR",
  FIELDCONTENTS_ERROR = "FIELDCONTENTS_ERROR",
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

  if (!(titleField && titleField.length > 0)) {
    throw new BpmnError(ErrorCodes.CONFIG_ERROR, "Der Titel wurde nicht definiert!");
  }
  if (!(locationField && locationField.length > 0)) {
    throw new BpmnError(ErrorCodes.CONFIG_ERROR, "Der Ort wurde nicht definiert!");
  }
  if (!(fromField && fromField.length > 0)) {
    throw new BpmnError(ErrorCodes.CONFIG_ERROR, "Das Von Datum wurde nicht definiert!");
  }
  if (!(tillField && tillField.length > 0)) {
    throw new BpmnError(ErrorCodes.CONFIG_ERROR, "Das Bis Datum wurde nicht definiert!");
  }
  if (!(targetField && targetField.length > 0)) {
    throw new BpmnError(ErrorCodes.CONFIG_ERROR, "Das Ergebnis Feld wurde nicht definiert!");
  }
  if (!(descriptionField && descriptionField.length > 0)) {
    throw new BpmnError(ErrorCodes.CONFIG_ERROR, "Die Beschreibung wurde nicht definiert!");
  }
  if (!(fileNameField && fileNameField.length > 0)) {
    throw new BpmnError(ErrorCodes.CONFIG_ERROR, "Der Dateiname wurde nicht definiert!");
  }
  if (instance.extras.fieldContents === undefined) {
    throw new BpmnError(ErrorCodes.FIELDCONTENTS_ERROR, "Die Feldwerte sind nicht definiert!");
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
  if (fromValue == null) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Das Von Datum wurde nicht definiert!");
  }
  const fromDate = new Date(fromValue as string);

  const tillValue = (instance.extras.fieldContents[tillField] as IFieldValue).value;
  if (tillValue == null) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Das Bis Datum wurde nicht definiert!");
  }
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
  const titleValue = (instance.extras.fieldContents[titleField] as IFieldValue).value;
  if (titleValue == null) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Der Titel wurde nicht definiert!");
  }

  const parsedSummary = parseAndInsertStringWithFieldContent(
    String(titleValue),
    instance.extras.fieldContents,
    process.extras.processRoles,
    instance.extras.roleOwners,
    environment.sender.language || "de-DE",
    await environment.roxApi.getUsersConfig(),
  );

  if (parsedSummary === undefined) {
    throw new Error("parsedSummary is undefined, cannot proceed!");
  }

  icsString += "SUMMARY:" + parsedSummary + "\n";
  // Location
  const locationValue = (instance.extras.fieldContents[locationField] as IFieldValue).value;
  if (locationValue == null) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Der Ort wurde nicht definiert!");
  }
  icsString += "LOCATION:" + String(locationValue) + "\n";
  // Description
  const descriptionValue = (instance.extras.fieldContents[descriptionField] as IFieldValue).value;
  if (descriptionValue == null) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Die Beschreibung wurde nicht definiert!");
  }
  icsString += "DESCRIPTION:" + removeHtmlTags(String(descriptionValue)) + "\n";
  // Priority
  // icsString += "PRIORITY:3\n";
  icsString += "END:VEVENT\n";

  // End calendar item
  icsString += "END:VCALENDAR\n";

  // Filename
  const fileNameValue = (instance.extras.fieldContents[fileNameField] as IFieldValue).value;
  if (fileNameValue == null) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Der Dateiname wurde nicht definiert!");
  }

  const url: string = await environment.instances.uploadAttachment(instance.instanceId, `${String(fileNameValue)}.ics`, Buffer.from(icsString));

  if (url) {
    if (instance.extras.fieldContents[targetField] == null) {
      instance.extras.fieldContents[targetField] = { type: "ProcessHubFileUpload", value: undefined };
    }
    if ((instance.extras.fieldContents[targetField] as IFieldValue).type !== "ProcessHubFileUpload") {
      throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, "Es ist kein FileUpload Feld hinterlegt!.");
    }
    (instance.extras.fieldContents[targetField] as IFieldValue).value = [url];
    await environment.instances.updateInstance(instance);

    return true;
  }

  throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, "Es konnten keine Anhänge erstellt werden.");
}
