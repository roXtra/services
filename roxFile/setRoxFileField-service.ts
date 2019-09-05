import * as PH from "processhub-sdk";
import { getSelectionsCall, getFileDetailsCall, setFileFieldsCall, missingRequiredField, initRequiredFields, errorHandling } from "./roxtraFileAPI";
import { SetFileFieldsObject, Selection, SelectTypes, ERRORCODES } from "./roxtraFileAPITypes";
import * as JSONQuery from "json-query";

let errorState: number = ERRORCODES.NOERROR;
let APIUrl: string;

export async function setRoxFileField(environment: PH.ServiceTask.ServiceTaskEnvironment) {
    errorState = ERRORCODES.NOERROR;
    APIUrl = environment.serverConfig.roXtra.efApiEndpoint;

    // Get the instance to manipulate and add fields
    let instance = await serviceLogic(environment);

    // update the Instance with changes
    if (errorState) {
        instance = errorHandling(errorState, instance);
    }

    await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);

    return !errorState;
}

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: PH.ServiceTask.ServiceTaskEnvironment) {
    let fields = await PH.ServiceTask.getFields(environment);
    let instance = environment.instanceDetails;

    const requiredFields = initRequiredFields(["fileId", "fieldId"], fields);
    const missingField = missingRequiredField(requiredFields);

    if (missingField.isMissing) {
        errorState = errorHandlingMissingField(missingField.key);
        return instance
    }

    // Get field name of the corresponding field ID
    let fileId = requiredFields.get("fileId").value;
    let fieldId = requiredFields.get("fieldId").value;

    let valueField = fields.find(f => f.key == "value").value;

    // Get the value of a selected field
    let value = ((environment.instanceDetails.extras.fieldContents[valueField] as PH.Data.FieldValue).value as string);

    try {
        fileId = parseFileID(fileId, environment)

        let body: SetFileFieldsObject[] = [{
            "Id": fieldId,
            "Value": value
        }]

        if (value) {
            const fieldDetails = await getFieldDetails(fileId, fieldId, environment.accessToken);

            body[0].ValueIds = await selectionValueIDMapping(body[0], fieldDetails.RoxSelection, fieldDetails.RoxType, environment.accessToken);

            await setFileFieldsCall(APIUrl, body, fileId, environment.accessToken);
        }

        return instance;
    } catch (e) {
        errorState = ERRORCODES.UNKNOWNERROR_SET;
        return instance;
    }
}

async function getFieldDetails(fileID: string, fieldID: string, token: string) {
    const fileDetails = await getFileDetailsCall(APIUrl, fileID, token);

    const data = {
        fieldID: fieldID,
        fields: fileDetails.Fields
    }

    return JSONQuery("fields[Id = {fieldID}]", { data: data }).value;
}

async function selectionValueIDMapping(body: SetFileFieldsObject, selectionID: string, selectID: string, token: string) {
    const selections: Selection[] = await getSelectionsCall(APIUrl, token);

    const data = {
        body: body,
        selections: selections
    }

    let selection: Selection = JSONQuery("selections[Id = " + selectionID + "]", { data: data }).value;

    return handleSelectField(selectID, body.Value, selection);
}

function handleSelectField(selectID: string, value: string, selection: Selection) {
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

function parseFileID(fieldID: string, environment: PH.ServiceTask.ServiceTaskEnvironment) {
    const fieldIDSplit = fieldID.split("@@");

    if (fieldIDSplit.length > 1) {
        fieldID = fieldIDSplit[1].trim();
    } else {
        fieldID = fieldIDSplit[0].trim();
    }
    try {
        return ((environment.instanceDetails.extras.fieldContents[fieldID] as PH.Data.FieldValue).value as string);
    } catch (e) {
        errorState = ERRORCODES.NO_FILEIDFIELD;
    }
}

function errorHandlingMissingField(key: string): number {
    if (key == "fileId") {
        return ERRORCODES.MISSING_FILEID;
    } else if (key == "fieldId") {
        return ERRORCODES.MISSING_FIELDID;
    }

    return errorState;
}
