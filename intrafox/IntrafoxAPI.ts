import * as IntrafoxTypes from "./IntrafoxTypes";
import DateFormat from "dateformat";
import * as PH from "processhub-sdk";

async function post(url: string, requestBody: IntrafoxTypes.IIntraFoxBody, token: string): Promise<any> {
  const headers: IntrafoxTypes.IIntraFoxHeader = {
    "X-INTRAFOX-ROXTRA-TOKEN": token
  };

  const req: IntrafoxTypes.IIntraFoxRequest = {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: headers,
  };

  try {
    const response = await fetch(url, req);
    return await response.json();
  } catch (ex) {
    throw new Error(ex.message);
  }
}

/**
 * Gets an activity of the specified user and the corresponding activity number.
 *
 * @param url url of the Intrafox API, currently https://asp3.intrafox.net/cgi-bin/ws.app?D=P32zdyNCFcIwZ40HE1RY. The only reason this is a parameter, is for testing purpose.
 * @param username the username of the user in the Intrafox instance
 * @param token the access token of the Intrafox API
*/
export async function getActivityByNumber(url: string, activityNumber: string, username: string, token: string): Promise<IntrafoxTypes.IGetGlobalActivityListResponse | IntrafoxTypes.IIntraFoxErrorResponse> {
  const body: IntrafoxTypes.IIntraFoxBody = {
    "FUNCTION": "GetGlobalActivityList",
    "USERNAME": username,
    "ARGS": {}
  };

  const result = await post(url, body, token);
  const activities: IntrafoxTypes.IGetGlobalActivityListResponse[] = result.ACTIVITIES;

  for (let i = 0; i < activities.length; i++) {
    if (activities[i].ACTIVITY_ACTIVITYNUMBER === activityNumber) {
      return activities[i];
    }
  }
}

/**
 * Creates a new Activity in Intrafox with abbrevation, description and expiration date. The activity number will be automattically generateted by the Intrafox API.
 *
 * @param url url of the Intrafox API, currently https://asp3.intrafox.net/cgi-bin/ws.app?D=P32zdyNCFcIwZ40HE1RY. The only reason this is a parameter, is for testing purpose.
 * @param username the username of the user in the Intrafox instance
 * @param activityAbbrevation the abbrevation of the new activity
 * @param activityDescription the description of the new activity
 * @param activityExpirationdate the date when the activity will be expired
 * @param token the access token of the Intrafox API
*/
export async function createGlobalActivity(url: string, username: string, activityAbbrevation: string, activityDescription: string, activityExpirationdate: Date, token: string): Promise<string | IntrafoxTypes.IIntraFoxErrorResponse> {
  const args: IntrafoxTypes.ICreateActivityARGS = {
    "ACTIVITY_ABBREVIATION": activityAbbrevation,
    "ACTIVITY_DESCRIPTION": activityDescription,
    "ACTIVITY_EXPIRATIONDATE": DateFormat(activityExpirationdate, "yyyy-mm-dd")
  };

  const body: IntrafoxTypes.IIntraFoxBody = {
    "FUNCTION": "CreateGlobalActivity",
    "USERNAME": username,
    "ARGS": args
  };



  return await post(url, body, token);
}

export async function setGlobalActivityValues(url: string, username: string, token: string): Promise<string | IntrafoxTypes.IIntraFoxErrorResponse> {
  const args: IntrafoxTypes.ISetGlobalActivityARGS = {
    "ACTIVITYIDENTIFIER": "32qKep2gQa",
    "SIMPLE_DATASOURCES": {
      "ACTIVITY_ABBREVIATION": "Kurzbezeichnung",
      "ACTIVITY_DESCRIPTION": "Hello World",
      "ACTIVITY_EXPIRATIONDATE": new Date("2019.12.31 23:59"),
      "ACTIVITY_USERMEMO01": "MEMOTEXT1 MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT",
      "ACTIVITY_USERMEMO05": "MEMOTEXT5 MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT MEMOTEXT",
      "ACTIVITY_USERFLAG01": "1",
      "ACTIVITY_USERFLAG10": "0",
      "ACTIVITY_USERTEXT01": "TEXT01",
      "ACTIVITY_USERTEXT10": "TEXT10",
      "ACTIVITY_USERDATE01": new Date("2019.09.01"),
      "ACTIVITY_USERNUMBER01": "1",
      "ACTIVITY_USERNUMBER99": "99",
    }
  };

  const body: IntrafoxTypes.IIntraFoxBody = {
    "FUNCTION": "SetGlobalActivityValues",
    "USERNAME": username,
    "ARGS": args
  };



  return await post(url, body, token);
}

/**
   * Handles all errors that can be responded of the Intrafox API
   *
   * @param instance current process instance
   * @param errorCode error code of the Intrafox API response
   */
export function errorHandling(instance: PH.Instance.IInstanceDetails, errorCode: string): void {
  switch (errorCode) {
    case (""): {
      // No Errors
      break;
    }
    case ("ERRORCODE_REQUESTMETHOD"): {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, falsche HTTP Methode benutzt. Zur Zeit wird nur POST untersützt.",
        type: "ProcessHubTextArea"
      };
      break;
    }
    case ("ERRORCODE_A1"): {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, Authentifizierungstoken fehlt im Header.",
        type: "ProcessHubTextArea"
      };
      break;
    }
    case ("ERRORCODE_A2"): {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, Authentifizierungstoken ist ungültig.",
        type: "ProcessHubTextArea"
      };
      break;
    }
    case ("ERRORCODE_INVALID_BODY"): {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, der Body ist falsch.",
        type: "ProcessHubTextArea"
      };
      break;
    }
    case ("ERRORCODE_INVALID_JSON"): {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, falsches JSON Format.",
        type: "ProcessHubTextArea"
      };
      break;
    }
    case ("ERRORCODE_ARGUMENTS"): {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, ARGS wurden falsch gesetzt.",
        type: "ProcessHubTextArea"
      };
      break;
    }
    case ("ERRORCODE_FUNCTION"): {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, die API Funktion konnte nicht ausgeführt werden.",
        type: "ProcessHubTextArea"
      };
      break;
    }
    default: {
      instance.extras.fieldContents["ERROR"] = {
        value: "Ein Fehler ist aufgetreten, Activity konnte nicht erstellt werden.",
        type: "ProcessHubTextArea"
      };
      break;
    }
  }
}