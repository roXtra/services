import { RequestInit } from "node-fetch";

export enum ErrorCodes {
  API_ERROR = "API_ERROR",
}

export interface IGetGlobalActivityListResponse {
  ACTIVITY_ACTIVITYNUMBER: string;
  ACTIVITY_ABBREVIATION: string;
  ACTIVITY_DESCRIPTION: string;
  ORGANIZATIONUNIT_IDENTIFIERS: string[][];
  ORGANIZATIONUNIT_NAMES: string[][];
}

export interface IIntraFoxErrorResponse extends RequestInit {
  ERRORCODE: string;
  REASON: string;
  MESSAGE: string;
}

export interface IIntraFoxBody {
  FUNCTION: string;
  USERNAME: string;
  ARGS: ICreateActivityARGS | ISetGlobalActivityARGS;
}

export interface ICreateActivityARGS {
  ACTIVITY_ABBREVIATION?: string;
  ACTIVITY_DESCRIPTION?: string;
  ACTIVITY_EXPIRATIONDATE?: string;
}

export interface ISetGlobalActivityARGS {
  ACTIVITYIDENTIFIER: string;
  SIMPLE_DATASOURCES: ISimpleDatasources;
}

interface ISimpleDatasources {
  ACTIVITY_ABBREVIATION?: string;
  ACTIVITY_DESCRIPTION?: string;
  ACTIVITY_EXPIRATIONDATE?: Date;
  ACTIVITY_USERMEMO01?: string;
  ACTIVITY_USERMEMO05?: string;
  ACTIVITY_USERFLAG01?: string;
  ACTIVITY_USERFLAG10?: string;
  ACTIVITY_USERTEXT01?: string;
  ACTIVITY_USERTEXT10?: string;
  ACTIVITY_USERDATE01?: Date;
  ACTIVITY_USERNUMBER01?: string;
  ACTIVITY_USERNUMBER99?: string;
}
