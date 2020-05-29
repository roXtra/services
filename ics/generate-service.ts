import * as PH from "processhub-sdk";

function getDateFormatted(date: Date, start: boolean): string {
  const month = (date.getMonth() + 1);
  const monthString = month < 10 ? "0" + String(month) : String(month);
  const endDay = start ? date.getDate() : +date.getDate() + 1;
  return date.getFullYear().toString() + monthString + String(endDay); // + "T" + time;
}

export async function generate(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  try {
    const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
    await processObject.loadXml(environment.bpmnXml);
    const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
    const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
    const config = extensionValues.serviceTaskConfigObject;
    const fields = config.fields;
    const instance = environment.instanceDetails;

    const title = fields.find(f => f.key === "titleField").value;
    const fromField = fields.find(f => f.key === "fromField").value;
    const tillField = fields.find(f => f.key === "tillField").value;
    const targetField = fields.find(f => f.key === "targetField").value;
    const descriptionField = fields.find(f => f.key === "descriptionField") != null ? fields.find(f => f.key === "descriptionField").value : null;



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
    const fromValue = (instance.extras.fieldContents[fromField] as PH.Data.IFieldValue).value;
    const fromDate = new Date(fromValue as string);

    const tillValue = (instance.extras.fieldContents[tillField] as PH.Data.IFieldValue).value;
    const tillDate = new Date(tillValue as string);

    // Timezone
    // icsString += "DTSTART;TZID=Europe/Amsterdam:" + getDateFormatted(fromDate, true) + "\n";
    // icsString += "DTEND;TZID=Europe/Amsterdam:" + getDateFormatted(tillDate, false) + "\n";
    // or without
    icsString += "DTSTART:" + getDateFormatted(fromDate, true) + "\n";
    icsString += "DTEND:" + getDateFormatted(tillDate, false) + "\n";

    const process = await environment.processes.getProcessDetails(instance.processId, PH.Process.ProcessExtras.ExtrasProcessRolesWithMemberNames);
    const parsedSummary = PH.Data.parseAndInsertStringWithFieldContent(title, instance.extras.fieldContents, process.extras.processRoles, instance.extras.roleOwners);

    icsString += "SUMMARY:" + parsedSummary + "\n";
    // Location
    // icsString += "LOCATION:" + Location + "";

    const descriptionValue = instance.extras.fieldContents[descriptionField] != null ? (instance.extras.fieldContents[descriptionField] as PH.Data.IFieldValue).value : "";
    icsString += "DESCRIPTION:" + String(descriptionValue) + "\n";
    // Priority
    // icsString += "PRIORITY:3\n";
    icsString += "END:VEVENT\n";

    // End calendar item
    icsString += "END:VCALENDAR\n";

    const url: string = await environment.instances.uploadAttachment(
      instance.processId,
      instance.instanceId,
      "ics_import_file.ics",
      Buffer.from(icsString).toString("base64"));


    if (url) {
      if (instance.extras.fieldContents[targetField] == null) {
        instance.extras.fieldContents[targetField] = { type: "ProcessHubFileUpload", value: null } as PH.Data.IFieldValue;
      }
      (instance.extras.fieldContents[targetField] as PH.Data.IFieldValue).value = [url];
      await environment.instances.updateInstance(instance);

      return true;
    }

    return false;
  } catch (ex) {
    return false;
  }
}