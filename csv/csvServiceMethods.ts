import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";

export class CSVServiceMethods {
  public static query(objectArray: Record<string, unknown>[], queryString: string): Record<string, unknown>[] {
    const result: Record<string, unknown>[] = [];
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

  public static generateTable(rows: Array<Record<string, unknown>>): string {
    let keys: string[];
    try {
      keys = Object.keys(rows[0]);
    } catch {
      return "";
    }

    let table = "<table><tr>";
    keys.forEach((key) => {
      table += "<th>" + String(key) + "</th>";
    });
    table += "</tr>";
    rows.forEach((row) => {
      table += "<tr>";
      keys.forEach((key) => {
        table += "<th>" + String(row[key]) + "</th>";
      });
      table += "</tr>";
    });
    return (table += "</table>");
  }

  public static parseFieldsOfQuery(query: string, instance: IInstanceDetails): string {
    let modifiedQuery = query;

    if (instance.extras.fieldContents === undefined) {
      throw new Error("fieldContents are undefined, cannot proceed!");
    }

    while (modifiedQuery.includes("@@")) {
      const pos1 = modifiedQuery.search("@@") + 2;
      const subString = modifiedQuery.substring(pos1, modifiedQuery.length);
      const pos2 = pos1 + subString.search("@@");
      const fieldName = modifiedQuery.substring(pos1, pos2);

      modifiedQuery = modifiedQuery.replace("@@" + fieldName + "@@", String((instance.extras.fieldContents[fieldName] as IFieldValue).value));
    }
    return modifiedQuery;
  }
}
