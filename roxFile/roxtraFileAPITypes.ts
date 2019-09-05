export const SelectTypes = {
    SELECT: "select",
    COMPLEXSELECT: "complexselect",
    MULTISELECT: "multiselect",
    TREESELECT: "treeselect"
}

export const ERRORCODES = {
    NOERROR: 0,
    MISSING_DOCTYPE: 1,
    MISSING_DESTINATIONID: 2,
    MISSING_DESTINATIONTYPE: 3,
    MISSING_FILEID: 4,
    MISSING_FIELDID: 5,
    NO_FILEIDFIELD: 6,
    UNKNOWNERROR_CREATE: 7,
    UNKNOWNERROR_SET: 8,
    APICALLERROR: 9
}

export interface RequestHeader extends Record<string, string> {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": string,
    "authtoken": string
}

export interface PostRequest extends RequestInit {
    method: "POST",
    body: string,
    headers: RequestHeader,
}

export interface GetRequest extends RequestInit {
    method: "GET",
    headers: any,
}

export interface CreateFileRequestBody {
    "DestinationID": string,
    "DestinationType": string,
    "DocTypeID": string,
    "Fields"?: SetFileFieldsObject[],
    "FileData": {
        "Base64EncodedData": string,
        "Filename": string
    }
}

export interface SetFileFieldsObject {
    "FieldCaption"?: string,
    "Id": string,
    "IsWFWritable"?: string,
    "IsWritable"?: string,
    "RoxFieldType"?: number,
    "RoxSelection"?: string,
    "RoxType"?: string,
    "Value": string,
    "ValueIds"?: string
}

export interface Selection {
    "Id": string,
    "SelectionCaption": string,
    "SelectionType": number,
    "SelectionsList": SelectionsListObject[],
    "SimpleSelectionsList": SimpleSelectionsListObject[],
    "TreeSelectionsList": TreeSelectionsListObject[]
}

interface SelectionsListObject {
    "Deleted": boolean,
    "GUID": string,
    "ID": number,
    "PreSelect": boolean,
    "Value": string
}

interface SimpleSelectionsListObject {
    "ID": string,
    "Value": string
}

interface TreeSelectionsListObject {
    "ID": number,
    "ListID": string,
    "ParentID": number,
    "Text": string
}

export interface MissingField {
    "isMissing": boolean,
    "key"?: string
}


