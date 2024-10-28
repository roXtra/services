import { ICreateFileRequestBody } from "./roxtrafileapitypes.js";
import { missingRequiredField, initRequiredFields, RoXtraFileApi, readFileBase64Async } from "./roxtrafileapi.js";
import { IRoXtraFileApi } from "./iroxtrafileapi.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IServiceTaskEnvironment, getFields } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { getLastArrayEntry } from "processhub-sdk/lib/tools/array.js";
import { decodeURLSafeBase64 } from "processhub-sdk/lib/tools/stringtools.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";

let APIUrl: string;
let efAccessToken: string;

function createFileIDField(fileIDFieldName: string, response: { Fields: { Value: string }[] }, instance: IInstanceDetails): void {
  if (fileIDFieldName) {
    if (instance.extras.fieldContents === undefined) {
      throw new Error("instance.extras.fieldContents are undefined, cannot proceed with service!");
    }

    instance.extras.fieldContents[fileIDFieldName] = {
      value: response.Fields[0].Value,
      type: "ProcessHubTextArea",
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

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: IServiceTaskEnvironment, roxtraFileAPI: IRoXtraFileApi): Promise<IInstanceDetails> {
  const fields = await getFields(environment);
  const instance = environment.instanceDetails;

  const requiredFields = initRequiredFields(["docType", "destinationID", "destinationType"], fields);
  const missingField = missingRequiredField(requiredFields);

  if (missingField.isMissing) {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Ein Feld in der Konfiguration wurde nicht gesetzt: ${String(missingField.key)}`);
  }

  // Get field name of the corresponding field ID
  const docType = requiredFields.get("docType")?.value;
  const destinationID = requiredFields.get("destinationID")?.value;
  const destinationType = requiredFields.get("destinationType")?.value;

  const roxFileField = fields.find((f) => f.key === "roxFile")?.value;
  const titleField = fields.find((f) => f.key === "title")?.value;
  const descriptionField = fields.find((f) => f.key === "description")?.value;
  const fileIDFieldName = fields.find((f) => f.key === "fileIDFieldName")?.value;

  if (docType === undefined) {
    throw new Error("docType is undefined, cannot proceed!");
  }
  if (destinationID === undefined) {
    throw new Error("destinationID is undefined, cannot proceed!");
  }
  if (destinationType === undefined) {
    throw new Error("destinationType is undefined, cannot proceed!");
  }
  if (roxFileField === undefined) {
    throw new Error("roxFileField is undefined, cannot proceed!");
  }
  if (titleField === undefined) {
    throw new Error("titleField is undefined, cannot proceed!");
  }
  if (descriptionField === undefined) {
    throw new Error("descriptionField is undefined, cannot proceed!");
  }
  if (fileIDFieldName === undefined) {
    throw new Error("fileIDFieldName is undefined, cannot proceed!");
  }

  // Get the value of a selected field
  const roxFile = (environment.instanceDetails.extras.fieldContents?.[roxFileField] as IFieldValue).value as string;
  const title = (environment.instanceDetails.extras.fieldContents?.[titleField] as IFieldValue).value as string;
  const description = (environment.instanceDetails.extras.fieldContents?.[descriptionField] as IFieldValue).value as string;

  let relativePath = roxFile[0].split("modules/files/")[1];
  const pathParts = relativePath.split("/");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  pathParts[pathParts.length - 1] = decodeURLSafeBase64(getLastArrayEntry(pathParts)!);
  relativePath = pathParts.join("/");

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const titleWithEnding = generateTitleWithDataType(title, getLastArrayEntry(pathParts)!);

  const filePath = decodeURIComponent(environment.fileStore.getPhysicalPath(relativePath));

  const fileData = await readFileBase64Async(filePath);

  const body: ICreateFileRequestBody = {
    DestinationID: destinationID,
    DestinationType: destinationType,
    DocTypeID: docType,
    Fields: [
      {
        Id: "Description",
        Value: description,
      },
    ],
    FileData: {
      Base64EncodedData: fileData,
      Filename: titleWithEnding,
    },
  };

  // Code for Post Request
  const response = await roxtraFileAPI.createRoxFileCall(APIUrl, body, efAccessToken, environment.roxApi.getApiToken());
  createFileIDField(fileIDFieldName, response, instance);
  return instance;
}

export async function createRoxFile(environment: IServiceTaskEnvironment): Promise<boolean> {
  APIUrl = environment.roxApi.getEfApiEndpoint();
  efAccessToken = await environment.roxApi.getEfApiToken();

  await serviceLogic(environment, new RoXtraFileApi());
  await environment.instances.updateInstance(environment.instanceDetails);

  return true;
}
