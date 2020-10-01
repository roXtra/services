import * as PH from "processhub-sdk";

export enum ErrorStates {
  NOERROR = 0,
  ERRORCODE_NORESULTS = 1,
  ERRORCODE_NOSUCHFILE = 2,
  ERRORCODE_FILEPATHNOTFOUND = 3,
  ERRORCODE_NOSUCHPROJECT = 4,
}

export class CSVServiceMethods {
  public static query(objectArray: any[], queryString: string): any[] {
    const result: any[] = [];
    const queryArray = queryString.split("&");
    objectArray.forEach((object) => {
      let isCandidate = true;
      queryArray.forEach((query) => {
        const arr = query.split("=");
        const key = arr[0];
        const value = arr[1];
        if (object[key] !== value) {
          isCandidate = false;
        }
      });
      if (isCandidate) {
        result.push(object);
      }
    });
    return result;
  }

  public static generateTable(rows: Array<any>): string {
    let keys: string[];
    try {
      keys = Object.keys(rows[0]);
    } catch {
      return "";
    }

    let table = "<table><tr>";
    keys.forEach((key: any) => {
      table += "<th>" + String(key) + "</th>";
    });
    table += "</tr>";
    rows.forEach((row: any) => {
      table += "<tr>";
      keys.forEach((key) => {
        table += "<th>" + String(row[key]) + "</th>";
      });
      table += "</tr>";
    });
    return (table += "</table>");
  }

  public static parseFieldsOfQuery(query: string, instance: PH.Instance.IInstanceDetails): string {
    let modifiedQuery = query;

    while (modifiedQuery.includes("@@")) {
      const pos1 = modifiedQuery.search("@@") + 2;
      const subString = modifiedQuery.substring(pos1, modifiedQuery.length);
      const pos2 = pos1 + subString.search("@@");
      const fieldName = modifiedQuery.substring(pos1, pos2);

      modifiedQuery = modifiedQuery.replace("@@" + fieldName + "@@", (instance.extras.fieldContents[fieldName] as PH.Data.IFieldValue).value as string);
    }
    return modifiedQuery;
  }
}
