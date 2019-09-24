export interface IntraFoxRequest extends RequestInit {
  method: "POST";
  body: string; // JSON.stringify(IntraFoxBody)
  headers: any;
}

export interface GetGlobalActivityListResponse {
  "ACTIVITY_ACTIVITYNUMBER": string;
  "ACTIVITY_ABBREVIATION": string;
  "ACTIVITY_DESCRIPTION": string;
  "ORGANIZATIONUNIT_IDENTIFIERS": string[][];
  "ORGANIZATIONUNIT_NAMES": string[][];
}

export interface IntraFoxErrorResponse extends IntraFoxRequest {
  "ERRORCODE": string;
  "REASON": string;
  "MESSAGE": string;
}

export interface IntraFoxHeader {
  "X-INTRAFOX-ROXTRA-TOKEN": string;
}

export interface IntraFoxBody {
  "FUNCTION": string;
  "USERNAME": string;
  "ARGS": CreateActivityARGS | SetGlobalActivityARGS;
}

export interface CreateActivityARGS {
  "ACTIVITY_ABBREVIATION"?: string;
  "ACTIVITY_DESCRIPTION"?: string;
  "ACTIVITY_EXPIRATIONDATE"?: string;
}

export interface SetGlobalActivityARGS {
  "ACTIVITYIDENTIFIER": string;
  "SIMPLE_DATASOURCES": SimpleDatasources;
}

interface SimpleDatasources {
  "ACTIVITY_ABBREVIATION"?: string;
  "ACTIVITY_DESCRIPTION"?: string;
  "ACTIVITY_EXPIRATIONDATE"?: Date;
  "ACTIVITY_USERMEMO01"?: string;
  "ACTIVITY_USERMEMO05"?: string;
  "ACTIVITY_USERFLAG01"?: string;
  "ACTIVITY_USERFLAG10"?: string;
  "ACTIVITY_USERTEXT01"?: string;
  "ACTIVITY_USERTEXT10"?: string;
  "ACTIVITY_USERDATE01"?: Date;
  "ACTIVITY_USERNUMBER01"?: string;
  "ACTIVITY_USERNUMBER99"?: string;
}