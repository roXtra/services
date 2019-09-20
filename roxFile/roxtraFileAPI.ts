import * as Types from "./roxtraFileAPITypes";
import * as fs from "fs";
import * as PH from "processhub-sdk";
import { IRoXtraFileApi } from "./iroxtrafileapi";

export class RoXtraFileApi implements IRoXtraFileApi {

  public async createRoxFileCall(APIUrl: string, body: Types.CreateFileRequestBody, eftoken: string, token: string): Promise<any> {
    const response = await post(APIUrl + "CreateNewDocument", body, eftoken, token);
    if (response.status == 200) {
      return await response.json();
    }
  }

  public async setFileFieldsCall(APIUrl: string, body: Types.SetFileFieldsObject[], fileId: string, eftoken: string, token: string): Promise<any> {
    const response = await post(APIUrl + "SetFileFields/" + fileId, body, eftoken, token);
    if (response.status == 200) {
      return await response.json();
    }
  }

  public async getSelectionsCall(APIUrl: string, eftoken: string, token: string): Promise<Types.Selection[]> {
    const response = await get(APIUrl + "GetSelections", eftoken, token);
    if (response.status == 200) {
      return await response.json();
    }
  }

  public async getFileDetailsCall(APIUrl: string, fileID: string, eftoken: string, token: string): Promise<any> {
    const response = await get(APIUrl + "GetFileDetails/" + fileID, eftoken, token);
    if (response.status == 200) {
      return await response.json();
    }
  }

}

async function post(APIUrl: string, requestBody: Types.CreateFileRequestBody | Types.SetFileFieldsObject[], eftoken: string, token: string) {
  const headers: Types.RequestHeader = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    "authtoken": token
  };

  let req: Types.PostRequest = {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: headers,
  };

  return await fetch(APIUrl, req);
}

async function get(APIUrl: string, eftoken: string, token: string) {
  const headers: Types.RequestHeader = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "ef-authtoken": eftoken,
    "authtoken": token
  };

  let req: Types.GetRequest = {
    method: "GET",
    headers: headers,
  };
  return await fetch(APIUrl, req);
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

export function initRequiredFields(keys: string[], fields: PH.Data.ServiceActionConfigField[]): Map<string, PH.Data.ServiceActionConfigField> {
  let requiredFields: Map<string, PH.Data.ServiceActionConfigField> = new Map();

  for (let key of keys) {
    requiredFields.set(key, fields.find(f => f.key == key));
  }

  return requiredFields;
}

export function missingRequiredField(requiredFields: Map<string, PH.Data.ServiceActionConfigField>): Types.MissingField {
  const keys = requiredFields.keys();
  for (let key of keys) {
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

export function errorHandling(errorState: number, instance: PH.Instance.InstanceDetails) {
  let errorField: PH.Data.FieldValue = {
    value: "",
    type: "ProcessHubTextArea"
  };

  if (errorState == Types.ERRORCODES.NOERROR) {
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

function errorHandlingCreateRoxFile(errorState: number, errorField: PH.Data.FieldValue): PH.Data.FieldValue {
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

function errorHandlingSetRoxFileField(errorState: number, errorField: PH.Data.FieldValue) {
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

function errorHandlingAPICall(errorState: number, errorField: PH.Data.FieldValue) {
  switch (errorState) {

    case Types.ERRORCODES.APICALLERROR: {
      errorField.value = PH.tl("Es ist etwas beim Aufruf der roXtra-Schnittstelle schief gelaufen, bitte überprüfen Sie Ihre Eingaben.");
      return errorField;
    }
  }
  return errorField;
}