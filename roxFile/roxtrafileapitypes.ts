import { RequestInit } from "node-fetch";

export enum ErrorCodes {
  API_ERROR = "API_ERROR",
}

export const SelectTypes = {
  SELECT: "select",
  COMPLEXSELECT: "complexselect",
  MULTISELECT: "multiselect",
  TREESELECT: "treeselect",
};

export interface IRequestHeader extends Record<string, string> {
  Accept: "application/json";
  "Content-Type": "application/json";
  "ef-authtoken": string;
  authtoken: string;
}

export interface IPostRequest extends RequestInit {
  method: "POST";
  body: string;
  headers: IRequestHeader;
}

export interface IGetRequest extends RequestInit {
  method: "GET";
}

export interface ICreateFileRequestBody {
  DestinationID: string;
  DestinationType: string;
  DocTypeID: string;
  Fields?: ISetFileFieldsObject[];
  FileData: {
    Base64EncodedData: string;
    Filename: string;
  };
}

export interface ISetFileFieldsObject {
  FieldCaption?: string;
  Id: string;
  IsWFWritable?: string;
  IsWritable?: string;
  RoxFieldType?: number;
  RoxSelection?: string;
  RoxType?: string;
  Value: string;
  ValueIds?: string;
}

export interface ISelection {
  Id: string;
  SelectionCaption: string;
  SelectionType: number;
  SelectionsList: ISelectionsListObject[];
  SimpleSelectionsList: ISimpleSelectionsListObject[];
  TreeSelectionsList: ITreeSelectionsListObject[];
}

interface ISelectionsListObject {
  Deleted: boolean;
  GUID: string;
  ID: number;
  PreSelect: boolean;
  Value: string;
}

interface ISimpleSelectionsListObject {
  ID: string;
  Value: string;
}

interface ITreeSelectionsListObject {
  ID: number;
  ListID: string;
  ParentID: number;
  Text: string;
}

export interface IMissingField {
  isMissing: boolean;
  key?: string;
}
