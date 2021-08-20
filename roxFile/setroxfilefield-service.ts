import { missingRequiredField, initRequiredFields, RoXtraFileApi } from "./roxtrafileapi";
import { ISetFileFieldsObject, ISelection, SelectTypes } from "./roxtrafileapitypes";
import JSONQuery from "json-query";
import { IRoXtraFileApi } from "./iroxtrafileapi";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { IServiceTaskEnvironment, getFields } from "processhub-sdk/lib/servicetask";

let APIUrl: string;
let efAccessToken: string;

function handleSelectField(selectID: string, value: string, selection: ISelection): any {
  switch (selectID) {
    case SelectTypes.COMPLEXSELECT: {
      return JSONQuery("SelectionsList[Value = " + value.split(",")[0].trim() + "].GUID", { data: selection }).value;
    }
    case SelectTypes.MULTISELECT: {
      let multiGUIDString = "";
      value.split(",").forEach((val) => {
        multiGUIDString += String(JSONQuery("SelectionsList[Value = " + val.trim() + "].GUID", { data: selection }).value) + ",";
      });
      return multiGUIDString.substring(0, multiGUIDString.length - 1);
    }
    case SelectTypes.TREESELECT: {
      return JSONQuery("TreeSelectionsList[Value = " + value + "].GUID", { data: selection }).value;
    }
    case SelectTypes.SELECT: {
      return JSONQuery("SimpleSelectionsList[Value = " + value + "].ID", { data: selection }).value;
    }
  }
}

async function selectionValueIDMapping(
  body: ISetFileFieldsObject,
  selectionID: string,
  selectID: string,
  environment: IServiceTaskEnvironment,
  roxFileApi: IRoXtraFileApi,
): Promise<any> {
  const selections: ISelection[] = await roxFileApi.getSelectionsCall(APIUrl, efAccessToken, environment.roxApi.getApiToken());
  const data = {
    body: body,
    selections: selections,
  };

  const selection: ISelection = JSONQuery("selections[Id = " + selectionID + "]", { data: data }).value;

  return handleSelectField(selectID, body.Value, selection);
}

function parseFileID(fieldID: string, environment: IServiceTaskEnvironment): string | undefined {
  const fieldIDSplit = fieldID.split("@@");

  if (fieldIDSplit.length > 1) {
    fieldID = fieldIDSplit[1].trim();
    return (environment.instanceDetails.extras.fieldContents?.[fieldID] as IFieldValue).value as string;
  } else {
    return fieldID.trim();
  }
}

async function getFieldDetails(fileID: string, fieldID: string, environment: IServiceTaskEnvironment, roxFileApi: IRoXtraFileApi): Promise<any> {
  const fileDetails = await roxFileApi.getFileDetailsCall(APIUrl, fileID, efAccessToken, environment.roxApi.getApiToken());

  const data = {
    fieldID: fieldID,
    fields: fileDetails.Fields,
  };

  return JSONQuery("fields[Id = {fieldID}]", { data: data }).value;
}

export async function serviceLogic(environment: IServiceTaskEnvironment, roxFileApi: IRoXtraFileApi): Promise<IInstanceDetails> {
  const fields = await getFields(environment);
  const instance = environment.instanceDetails;

  const requiredFields = initRequiredFields(["fileId", "fieldId"], fields);
  const missingField = missingRequiredField(requiredFields);

  if (missingField.isMissing) {
    throw new BpmnError(ErrorCode.ConfigInvalid, `Ein Feld in der Konfiguration wurde nicht gesetzt: ${String(missingField.key)}`);
  }

  // Get field name of the corresponding field ID
  let fileId = requiredFields.get("fileId")?.value;
  const fieldId = requiredFields.get("fieldId")?.value;

  const valueField = fields.find((f) => f.key === "value")?.value;

  if (fileId === undefined) {
    throw new Error("fileId is undefined, cannot proceed!");
  }
  if (fieldId === undefined) {
    throw new Error("fieldId is undefined, cannot proceed!");
  }
  if (valueField === undefined) {
    throw new Error("valueField is undefined, cannot proceed!");
  }

  // Get the value of a selected field
  const value = (environment.instanceDetails.extras.fieldContents?.[valueField] as IFieldValue).value as string;

  fileId = parseFileID(fileId, environment);

  if (fileId === undefined) {
    throw new Error("fileId is undefined after parseFileID, cannot proceed!");
  }

  const body: ISetFileFieldsObject[] = [
    {
      Id: fieldId,
      Value: value,
    },
  ];

  if (value) {
    const fieldDetails = await getFieldDetails(fileId, fieldId, environment, roxFileApi);
    body[0].ValueIds = await selectionValueIDMapping(body[0], fieldDetails.RoxSelection, fieldDetails.RoxType, environment, roxFileApi);
    await roxFileApi.setFileFieldsCall(APIUrl, body, fileId, efAccessToken, environment.roxApi.getApiToken());
  }

  return instance;
}

export async function setRoxFileField(environment: IServiceTaskEnvironment): Promise<boolean> {
  APIUrl = environment.serverConfig.roXtra.efApiEndpoint;
  efAccessToken = await environment.roxApi.getEfApiToken();

  await serviceLogic(environment, new RoXtraFileApi());
  await environment.instances.updateInstance(environment.instanceDetails);

  return true;
}
