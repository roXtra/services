import * as PH from "processhub-sdk";

export async function generate(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  try {
    let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
    await processObject.loadXml(environment.bpmnXml);
    let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
    let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
    let config = extensionValues.serviceTaskConfigObject;
    let fields = config.fields;
    let instance = environment.instanceDetails;

    let title = fields.find(f => f.key == "titleField").value;
    let fromField = fields.find(f => f.key == "fromField").value;
    let tillField = fields.find(f => f.key == "tillField").value;
    let targetField = fields.find(f => f.key == "targetField").value;
    let descriptionField = fields.find(f => f.key == "descriptionField") != null ? fields.find(f => f.key == "descriptionField").value : null;



    let icsString: string = "";
    icsString += "BEGIN:VCALENDAR\n";
    icsString += "VERSION:2.0\n";
    icsString += "PRODID:--//rossmanith//DE\n";
    icsString += "CALSCALE:GREGORIAN\n";

    // create a time zone if needed, TZID to be used in the event itself
    // icsString += "BEGIN:VTIMEZONE\n";
    // icsString += "TZID:Europe/Berlin\n";
    // icsString += "BEGIN:STANDARD\n";
    // icsString += "TZOFFSETTO:+0100\n";
    // icsString += "TZOFFSETFROM:+0100\n";
    // icsString += "END:STANDARD\n";
    // icsString += "END:VTIMEZONE\n";

    // add the event
    icsString += "BEGIN:VEVENT\n";

    // with time zone specified
    let fromValue = (instance.extras.fieldContents[fromField] as PH.Data.FieldValue).value;
    let fromDate = new Date(fromValue as string);

    let tillValue = (instance.extras.fieldContents[tillField] as PH.Data.FieldValue).value;
    let tillDate = new Date(tillValue as string);

    // icsString += "DTSTART;TZID=Europe/Amsterdam:" + getDateFormatted(fromDate, true) + "\n";
    // icsString += "DTEND;TZID=Europe/Amsterdam:" + getDateFormatted(tillDate, false) + "\n";
    // or without
    icsString += "DTSTART:" + getDateFormatted(fromDate, true) + "\n";
    icsString += "DTEND:" + getDateFormatted(tillDate, false) + "\n";

    let parsedSummary = PH.Data.parseAndInsertStringWithFieldContent(title, instance.extras.fieldContents, processObject, instance.extras.roleOwners);

    icsString += "SUMMARY:" + parsedSummary + "\n";
    // icsString += "LOCATION:" + Location + "";
    
    let descriptionValue =  instance.extras.fieldContents[descriptionField] != null ? (instance.extras.fieldContents[descriptionField] as PH.Data.FieldValue).value : "";
    icsString += "DESCRIPTION:" + descriptionValue + "\n";
    // icsString += "PRIORITY:3\n";
    icsString += "END:VEVENT\n";

    // end calendar item
    icsString += "END:VCALENDAR\n";



    const response: PH.Instance.UploadAttachmentReply = await PH.LegacyApi.postJson(PH.Instance.ProcessEngineApiRoutes.uploadAttachment, {
      data: Buffer.from(icsString).toString("base64"),
      fileName: "ics_import_file.ics",
      instanceId: instance.instanceId,
      processId: instance.processId,
    } as PH.Instance.UploadAttachmentRequest, environment.accessToken) as PH.Instance.UploadAttachmentReply;


    if (response.result == PH.LegacyApi.ApiResult.API_OK) {
      if (instance.extras.fieldContents[targetField] == null) {
        instance.extras.fieldContents[targetField] = { type: "ProcessHubFileUpload", value: null } as PH.Data.FieldValue;
      }
      (instance.extras.fieldContents[targetField] as PH.Data.FieldValue).value = [response.url];
      const updateResult = await PH.Instance.updateInstance(instance, environment.accessToken);
      if (updateResult.result !== PH.LegacyApi.ApiResult.API_OK) {
        console.log("ICS service: updateInstance call failed");        
        return false;
      }
      return true;
    }

    return true;
  } catch (ex) {
    return false;
  }
}

function getDateFormatted(date: Date, start: boolean) {
  let month = (date.getMonth() + 1);
  let monthString = month < 10 ? "0" + month : month;
  let endDay = start ? date.getDate() : +date.getDate() + 1;
  return date.getFullYear().toString() + monthString + endDay; // + "T" + time;
}