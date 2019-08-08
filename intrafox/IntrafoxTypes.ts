export interface IntraFoxRequest extends RequestInit {
    method: "POST",
    body: string, // JSON.stringify(IntraFoxBody)
    headers: any,
}

export interface GetGlobalActivityListResponse {
    "ACTIVITY_ACTIVITYNUMBER": string,
    "ACTIVITY_ABBREVIATION": string,
    "ACTIVITY_DESCRIPTION": string,
    "ORGANIZATIONUNIT_IDENTIFIERS": string[][],
    "ORGANIZATIONUNIT_NAMES": string[][]
}

export interface IntraFoxErrorResponse extends IntraFoxRequest {
    "ERRORCODE": string,
    "REASON": string,
    "MESSAGE": string
}

export interface IntraFoxHeader {
    "X-INTRAFOX-ROXTRA-TOKEN": string
}

export interface IntraFoxBody {
    "FUNCTION": string,
    "USERNAME": string,
    "ARGS": CreateActivityARGS,
}

export interface CreateActivityARGS {
    "ACTIVITY_ABBREVIATION"?: string,
    "ACTIVITY_DESCRIPTION"?: string,
    "ACTIVITY_EXPIRATIONDATE"?: string
}