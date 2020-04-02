import * as PH from "processhub-sdk";
import * as Types from "./roxtrafileapitypes";
import { missingRequiredField, initRequiredFields, RoXtraFileApi, errorHandling } from "./roxtrafileapi";
import { IRoXtraFileApi } from "./iroxtrafileapi";
import http from "http";

export let errorState: number = Types.ERRORCODES.NOERROR;
let APIUrl: string;
let efAccessToken: string;

async function getFileContent(downloadUrl: string): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    http.get(downloadUrl, function (response) {
      response.on("data", (chunk: Buffer) => {
        if (response.statusCode === 200) {
          resolve(chunk.toString("base64"));
        }
        reject(response.statusCode);
      });

      response.on("error", (err: Error) => {
        reject(err + ": " + response.statusCode);
      });
    });
  });
}

function createFileIDField(fileIDFieldName: string, response: any, instance: PH.Instance.IInstanceDetails) {
  if (fileIDFieldName) {
    instance.extras.fieldContents[fileIDFieldName] = {
      value: response.Fields[0].Value,
      type: "ProcessHubTextArea"
    };
  }
}

function generateTitleWithDataType(title: string, fileName: string): string {
  if (!title.trim()) return fileName;

  const titlePart = title.trim().split(".")[0];

  const splittedFileName = fileName.trim().split(".");
  splittedFileName[0] = titlePart;

  return splittedFileName.join(".");
}

function errorHandlingMissingField(key: string): number {
  if (key === "docType") {
    return Types.ERRORCODES.MISSING_DOCTYPE;
  } else if (key === "destinationID") {
    return Types.ERRORCODES.MISSING_DESTINATIONID;
  } else if (key === "destinationType") {
    return Types.ERRORCODES.MISSING_DESTINATIONTYPE;
  }

  return errorState;
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.IServiceTaskEnvironment, roxtraFileAPI: IRoXtraFileApi) {
  errorState = Types.ERRORCODES.NOERROR;
  const fields = await PH.ServiceTask.getFields(environment);
  const instance = environment.instanceDetails;

  const requiredFields = initRequiredFields(["docType", "destinationID", "destinationType"], fields);
  const missingField = missingRequiredField(requiredFields);

  if (missingField.isMissing) {
    errorState = errorHandlingMissingField(missingField.key);
    return instance;
  }

  // Get field name of the corresponding field ID
  const docType = requiredFields.get("docType").value;
  const destinationID = requiredFields.get("destinationID").value;
  const destinationType = requiredFields.get("destinationType").value;

  const roxFileField = fields.find(f => f.key === "roxFile").value;
  const titleField = fields.find(f => f.key === "title").value;
  const descritionField = fields.find(f => f.key === "description").value;
  const fileIDFieldName = fields.find(f => f.key === "fileIDFieldName").value;

  // Get the value of a selected field
  const roxFile = ((environment.instanceDetails.extras.fieldContents[roxFileField] as PH.Data.IFieldValue).value as string);
  const title = ((environment.instanceDetails.extras.fieldContents[titleField] as PH.Data.IFieldValue).value as string);
  const description = ((environment.instanceDetails.extras.fieldContents[descritionField] as PH.Data.IFieldValue).value as string);

  try {
    const titleWithEnding = generateTitleWithDataType(title, roxFile[0].split("/").last());

    const fileDataBase64 = await getFileContent(roxFile[0]);

    const body: Types.ICreateFileRequestBody = {
      "DestinationID": destinationID,
      "DestinationType": destinationType,
      "DocTypeID": docType,
      "Fields": [
        {
          "Id": "Description",
          "Value": description
        }
      ],
      "FileData": {
        "Base64EncodedData": fileDataBase64,
        "Filename": titleWithEnding
      }
    };

    // Code for Post Request
    const response = await roxtraFileAPI.createRoxFileCall(APIUrl, body, efAccessToken, environment.roxApi.getApiToken());
    if (response) {
      createFileIDField(fileIDFieldName, response, instance);
      return instance;
    } else {
      errorState = Types.ERRORCODES.APICALLERROR;
      return instance;
    }
  }
  catch (e) {
    console.error(e);
    errorState = Types.ERRORCODES.UNKNOWNERROR_CREATE;
    return instance;
  }
}

export async function createRoxFile(environment: PH.ServiceTask.IServiceTaskEnvironment) {
  APIUrl = environment.serverConfig.roXtra.efApiEndpoint;
  efAccessToken = await environment.roxApi.getEfApiToken();

  // Get the instance to manipulate and add fields
  const instance = await serviceLogic(environment, new RoXtraFileApi());

  // Update the Instance with changes
  if (errorState) {
    errorHandling(errorState, instance);
  }

  await environment.instances.updateInstance(environment.instanceDetails);

  return !errorState;
}