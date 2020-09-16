import * as Types from "./roxtrafileapitypes";
import * as fs from "fs";
import * as PH from "processhub-sdk";
import { IRoXtraFileApi } from "./iroxtrafileapi";
import fetch, { Response } from "node-fetch";

async function post(apiUrl: string, requestBody: Types.ICreateFileRequestBody | Types.ISetFileFieldsObject[], eftoken: string, token: string): Promise<Response> {
  const headers: Types.IRequestHeader = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    "authtoken": token
  };

  const req: Types.IPostRequest = {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: headers,
  };

  return await fetch(apiUrl, req);
}

async function get(apiUrl: string, eftoken: string, token: string): Promise<Response> {
  const headers: Types.IRequestHeader = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    "authtoken": token
  };

  const req: Types.IGetRequest = {
    method: "GET",
    headers: headers,
  };
  return await fetch(apiUrl, req);
}

export class RoXtraFileApi implements IRoXtraFileApi {

  public async createRoxFileCall(apiUrl: string, body: Types.ICreateFileRequestBody, eftoken: string, token: string): Promise<any> {
    const response = await post(apiUrl + "CreateNewDocument", body, eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }
  }

  public async setFileFieldsCall(apiUrl: string, body: Types.ISetFileFieldsObject[], fileId: string, eftoken: string, token: string): Promise<any> {
    const response = await post(apiUrl + "SetFileFields/" + fileId, body, eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }
  }

  public async getSelectionsCall(apiUrl: string, eftoken: string, token: string): Promise<Types.ISelection[]> {
    const response = await get(apiUrl + "GetSelections", eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }
  }

  public async getFileDetailsCall(apiUrl: string, fileID: string, eftoken: string, token: string): Promise<any> {
    const response = await get(apiUrl + "GetFileDetails/" + fileID, eftoken, token);
    if (response.status === 200) {
      return await response.json();
    }
  }

}

export async function readFileBase64Async(path: string): Promise<string> {
  return await new Promise<string>((resolve, reject): void => {
    fs.readFile(path, "base64", (err: any, buf: any) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(buf.toString());
      }
    });
  });
}

export function initRequiredFields(keys: string[], fields: PH.Data.IServiceActionConfigField[]): Map<string, PH.Data.IServiceActionConfigField> {
  const requiredFields: Map<string, PH.Data.IServiceActionConfigField> = new Map();

  for (const key of keys) {
    requiredFields.set(key, fields.find(f => f.key === key));
  }

  return requiredFields;
}

export function missingRequiredField(requiredFields: Map<string, PH.Data.IServiceActionConfigField>): Types.IMissingField {
  const keys = requiredFields.keys();
  for (const key of keys) {
    if (!requiredFields.get(key) || !requiredFields.get(key).value) {
      return {
        "isMissing": true,
        "key": key
      };
    }
  }

  return {
    "isMissing": false
  };
}

function errorHandlingCreateRoxFile(errorState: number, errorField: PH.Data.IFieldValue): PH.Data.IFieldValue {
  switch (errorState) {
    case Types.ERRORCODES.MISSING_DOCTYPE: {
      errorField.value = PH.tl("Der Dokumententyp wurde nicht angegeben.");
      return errorField;
    }

    case Types.ERRORCODES.MISSING_DESTINATIONID: {
      errorField.value = PH.tl("Die ID des Ziels wurde nicht angegeben.");
      return errorField;
    }

    case Types.ERRORCODES.MISSING_DESTINATIONTYPE: {
      errorField.value = PH.tl("Der Typ des Ziels wurde nicht angegeben.");
      return errorField;
    }

    case Types.ERRORCODES.UNKNOWNERROR_CREATE: {
      errorField.value = PH.tl("Ein Fehler ist aufgetreten, überprüfen Sie die eingegebenen Daten.");
      return errorField;
    }
  }
  return errorField;
}

function errorHandlingSetRoxFileField(errorState: number, errorField: PH.Data.IFieldValue): PH.Data.IFieldValue {
  switch (errorState) {

    case Types.ERRORCODES.MISSING_FILEID: {
      errorField.value = PH.tl("Die ID des Dokuments wurde nicht gefunden");
      return errorField;
    }

    case Types.ERRORCODES.MISSING_FIELDID: {
      errorField.value = PH.tl("Die ID des Dokumentenfeldes wurde nicht gefunden");
      return errorField;
    }

    case Types.ERRORCODES.NO_FILEIDFIELD: {
      errorField.value = PH.tl("Das Feld für die ID des Dokumentenfeldes wurde nicht gefunden");
      return errorField;
    }

    case Types.ERRORCODES.UNKNOWNERROR_SET: {
      errorField.value = PH.tl("Ein Fehler ist aufgetreten, überprüfen Sie die eingegebenen Daten.");
      return errorField;
    }
  }
  return errorField;
}

function errorHandlingAPICall(errorState: number, errorField: PH.Data.IFieldValue): PH.Data.IFieldValue {
  switch (errorState) {

    case Types.ERRORCODES.APICALLERROR: {
      errorField.value = PH.tl("Es ist etwas beim Aufruf der roXtra-Schnittstelle schief gelaufen, bitte überprüfen Sie Ihre Eingaben.");
      return errorField;
    }
  }
  return errorField;
}

export function errorHandling(errorState: number, instance: PH.Instance.IInstanceDetails): PH.Instance.IInstanceDetails {
  let errorField: PH.Data.IFieldValue = {
    value: "",
    type: "ProcessHubTextArea"
  };

  if (errorState === Types.ERRORCODES.NOERROR) {
    return instance;
  }

  errorField = errorHandlingCreateRoxFile(errorState, errorField);
  if (errorField.value) {
    instance.extras.fieldContents[PH.tl("ERROR beim Erstellen einer Datei")] = errorField;
    return instance;
  }

  errorField = errorHandlingSetRoxFileField(errorState, errorField);
  if (errorField.value) {
    instance.extras.fieldContents[PH.tl("ERROR beim Bearbeiten eines Dokumentenfeldes")] = errorField;
    return instance;
  }

  errorField = errorHandlingAPICall(errorState, errorField);
  if (errorField.value) {
    instance.extras.fieldContents[PH.tl("ERROR beim Aufruf der roXtra-Schnittstelle")] = errorField;
    return instance;
  }
}