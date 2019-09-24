import * as PH from "processhub-sdk";
import { missingRequiredField, initRequiredFields, RoXtraFileApi, errorHandling } from "./roxtrafileapi";
import { SetFileFieldsObject, Selection, SelectTypes, ERRORCODES } from "./roxtrafileapitypes";
import * as JSONQuery from "json-query";
import { IRoXtraFileApi } from "./iroxtrafileapi";

export let errorState: number = ERRORCODES.NOERROR;
let APIUrl: string;
let efAccessToken: string;

function handleSelectField(selectID: string, value: string, selection: Selection): any {
  switch (selectID) {

    case SelectTypes.COMPLEXSELECT: {
      return JSONQuery("SelectionsList[Value = " + value.split(",")[0].trim() + "].GUID", { data: selection }).value;
    }
    case SelectTypes.MULTISELECT: {
      let multiGUIDString = "";
      value.split(",").forEach(val => {
        multiGUIDString += JSONQuery("SelectionsList[Value = " + val.trim() + "].GUID", { data: selection }).value + ",";
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

function errorHandlingMissingField(key: string): number {
  if (key === "fileId") {
    return ERRORCODES.MISSING_FILEID;
  } else if (key === "fieldId") {
    return ERRORCODES.MISSING_FIELDID;
  }

  return errorState;
}

async function selectionValueIDMapping(body: SetFileFieldsObject, selectionID: string, selectID: string, environment: PH.ServiceTask.ServiceTaskEnvironment, roxFileApi: IRoXtraFileApi): Promise<any> {
  const selections: Selection[] = await roxFileApi.getSelectionsCall(APIUrl, efAccessToken, environment.roxApi.getApiToken());
  const data = {
    body: body,
    selections: selections
  };

  const selection: Selection = JSONQuery("selections[Id = " + selectionID + "]", { data: data }).value;

  return handleSelectField(selectID, body.Value, selection);
}

function parseFileID(fieldID: string, environment: PH.ServiceTask.ServiceTaskEnvironment): string {
  const fieldIDSplit = fieldID.split("@@");

  if (fieldIDSplit.length > 1) {
    fieldID = fieldIDSplit[1].trim();
    try {
      return ((environment.instanceDetails.extras.fieldContents[fieldID] as PH.Data.FieldValue).value as string);
    } catch (e) {
      errorState = ERRORCODES.NO_FILEIDFIELD;
    }
  } else {
    return fieldID.trim();
  }
}

async function getFieldDetails(fileID: string, fieldID: string, environment: PH.ServiceTask.ServiceTaskEnvironment, roxFileApi: IRoXtraFileApi): Promise<any> {
  const fileDetails = await roxFileApi.getFileDetailsCall(APIUrl, fileID, efAccessToken, environment.roxApi.getApiToken());

  const data = {
    fieldID: fieldID,
    fields: fileDetails.Fields
  };

  return JSONQuery("fields[Id = {fieldID}]", { data: data }).value;
}

export async function serviceLogic(environment: PH.ServiceTask.ServiceTaskEnvironment, roxFileApi: IRoXtraFileApi): Promise<PH.Instance.InstanceDetails> {
  errorState = ERRORCODES.NOERROR;
  const fields = await PH.ServiceTask.getFields(environment);
  const instance = environment.instanceDetails;

  const requiredFields = initRequiredFields(["fileId", "fieldId"], fields);
  const missingField = missingRequiredField(requiredFields);

  if (missingField.isMissing) {
    errorState = errorHandlingMissingField(missingField.key);
    return instance;
  }

  // Get field name of the corresponding field ID
  let fileId = requiredFields.get("fileId").value;
  const fieldId = requiredFields.get("fieldId").value;

  const valueField = fields.find(f => f.key === "value").value;

  // Get the value of a selected field
  const value = ((environment.instanceDetails.extras.fieldContents[valueField] as PH.Data.FieldValue).value as string);

  try {

    fileId = parseFileID(fileId, environment);

    const body: SetFileFieldsObject[] = [{
      "Id": fieldId,
      "Value": value
    }];

    if (value) {
      const fieldDetails = await getFieldDetails(fileId, fieldId, environment, roxFileApi);
      body[0].ValueIds = await selectionValueIDMapping(body[0], fieldDetails.RoxSelection, fieldDetails.RoxType, environment, roxFileApi);
      await roxFileApi.setFileFieldsCall(APIUrl, body, fileId, efAccessToken, environment.roxApi.getApiToken());
    }

    return instance;
  } catch (e) {
    console.log(e);
    errorState = ERRORCODES.UNKNOWNERROR_SET;
    return instance;
  }
}

export async function setRoxFileField(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  errorState = ERRORCODES.NOERROR;
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