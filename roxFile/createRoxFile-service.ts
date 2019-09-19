import * as PH from "processhub-sdk";
import * as Types from "./roxtraFileAPITypes";
import { readFileBase64Async, createRoxFileCall, missingRequiredField, initRequiredFields, errorHandling } from "./roxtraFileAPI";

let errorState: number = Types.ERRORCODES.NOERROR;
let APIUrl: string;
let efAccessToken: string;

export async function createRoxFile(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  errorState = Types.ERRORCODES.NOERROR;
  APIUrl = environment.serverConfig.roXtra.efApiEndpoint;
  efAccessToken = await environment.roxApi.getEfApiToken();

  // Get the instance to manipulate and add fields
  let instance = await serviceLogic(environment);

  // update the Instance with changes
  if (errorState) {
    instance = errorHandling(errorState, instance);
  }

  await environment.instances.updateInstance(environment.instanceDetails);

  return !errorState;
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.ServiceTaskEnvironment) {
  let fields = await PH.ServiceTask.getFields(environment);
  let instance = environment.instanceDetails;

  const requiredFields = initRequiredFields(["docType", "destinationID", "destinationType"], fields);
  const missingField = missingRequiredField(requiredFields);

  if (missingField.isMissing) {
    errorState = errorHandlingMissingField(missingField.key);
    return instance;
  }

  // Get field name of the corresponding field ID
  let docType = requiredFields.get("docType").value;
  let destinationID = requiredFields.get("destinationID").value;
  let destinationType = requiredFields.get("destinationType").value;

  let roxFileField = fields.find(f => f.key == "roxFile").value;
  let titleField = fields.find(f => f.key == "title").value;
  let descritionField = fields.find(f => f.key == "description").value;
  let fileIDFieldName = fields.find(f => f.key == "fileIDFieldName").value;

  // Get the value of a selected field
  let roxFile = ((environment.instanceDetails.extras.fieldContents[roxFileField] as PH.Data.FieldValue).value as string);
  let title = ((environment.instanceDetails.extras.fieldContents[titleField] as PH.Data.FieldValue).value as string);
  let description = ((environment.instanceDetails.extras.fieldContents[descritionField] as PH.Data.FieldValue).value as string);

  try {
    const relativePath = roxFile[0].split("eformulare/files/")[1];

    title = generateTitleWithDataType(title, relativePath);

    const filePath = environment.fileStore.getPhysicalPath(relativePath);

    const fileData = await readFileBase64Async(filePath);

    const body: Types.CreateFileRequestBody = {
      "DestinationID": destinationID,
      "DestinationType": destinationType,
      "DocTypeID": docType,
      "Fields": [{
        "Id": "Description",
        "Value": description
      }],
      "FileData": {
        "Base64EncodedData": fileData,
        "Filename": title
      }
    };

    // code for Post Request
    const response = await createRoxFileCall(APIUrl, body, efAccessToken, environment.roxApi.getApiToken());
    if (response) {
      await createFileIDField(fileIDFieldName, response, instance);
      return instance;
    } else {
      errorState = Types.ERRORCODES.APICALLERROR;
      return instance;
    }
  }
  catch (e) {
    errorState = Types.ERRORCODES.UNKNOWNERROR_CREATE;
    return instance;
  }
}

async function createFileIDField(fileIDFieldName: string, response: any, instance: PH.Instance.InstanceDetails) {
  if (fileIDFieldName) {
    instance.extras.fieldContents[fileIDFieldName] = {
      value: response.Fields[0].Value,
      type: "ProcessHubTextArea"
    };
  }
}

function generateTitleWithDataType(title: string, dataPath: string): string {
  if (!title.trim()) {
    const dataPathSegments = dataPath.split("/");
    return dataPathSegments[dataPathSegments.length - 1];
  }

  const splittedTitle = title.trim().split(".");

  for (let titlePart of splittedTitle) {
    if (titlePart) {
      return titlePart.trim() + dataPath.substring(dataPath.lastIndexOf("."), dataPath.length);
    }
  }
}

function errorHandlingMissingField(key: string): number {
  if (key == "docType") {
    return Types.ERRORCODES.MISSING_DOCTYPE;
  } else if (key == "destinationID") {
    return Types.ERRORCODES.MISSING_DESTINATIONID;
  } else if (key == "destinationType") {
    return Types.ERRORCODES.MISSING_DESTINATIONTYPE;
  }

  return errorState;
}
