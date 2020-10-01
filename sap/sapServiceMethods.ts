import * as PH from "processhub-sdk";
import * as hanaClient from "@sap/hana-client";

export default class SAPServiceMethods {
  static parseFieldsOfQuery(query: string, instance: PH.Instance.IInstanceDetails): string {
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

  static buildInsertQuery(tableName: string, columns: string, values: string, instance: PH.Instance.IInstanceDetails): string {
    let query: string = "INSERT INTO " + tableName + " (" + columns + ") " + "VALUES (" + values + ");";

    query = SAPServiceMethods.parseFieldsOfQuery(query, instance);

    return query;
  }

  static buildSelectQuery(tableName: string, columns: string, where: string, instance: PH.Instance.IInstanceDetails): string {
    let selectQuery = "SELECT " + columns + " FROM " + tableName + " WHERE " + where + ";";

    selectQuery = SAPServiceMethods.parseFieldsOfQuery(selectQuery, instance);
    selectQuery = selectQuery.replace(/\s{2,}/g, " ");

    if (selectQuery.endsWith("WHERE ;")) {
      selectQuery = selectQuery.substring(0, selectQuery.length - 8) + ";";
    }

    return selectQuery;
  }

  static buildDeleteQuery(tableName: string, where: string, instance: PH.Instance.IInstanceDetails): string {
    let deleteQuery = "DELETE FROM " + tableName + " WHERE " + where + ";";

    deleteQuery = SAPServiceMethods.parseFieldsOfQuery(deleteQuery, instance);

    return deleteQuery;
  }

  static async execQuery(connectionParams: any, query: string, updateMethod: Function): Promise<boolean> {
    let noErrors = true;

    const connection = await hanaClient.createConnection();
    await connection.connect(connectionParams, async (err: any) => {
      noErrors = this.errorOutput(err, "Connection error", noErrors);

      await connection.exec(query, async (err: any, rows: Array<any>) => {
        await connection.disconnect();

        if (noErrors) {
          noErrors = this.errorOutput(err, "SQL execute error:", noErrors);
        }

        if (noErrors) {
          noErrors = await updateMethod(rows);
        }
      });
    });

    return noErrors;
  }

  private static errorOutput(err: any, errorMessage: string, currentErrorState: boolean): boolean {
    if (err) {
      console.error(errorMessage, err);
      return false;
    }
    return currentErrorState;
  }

  static async serviceOutputLogic(
    rows: Array<any>,
    newValue: any,
    environment: PH.ServiceTask.IServiceTaskEnvironment,
    instance: any,
    targetFieldTable: string,
    targetFieldCSV: string,
  ): Promise<boolean> {
    let url: string;

    if (rows && rows.length) {
      newValue.value = this.generateTable(rows);
      instance.extras.fieldContents[targetFieldTable] = newValue;

      url = await environment.instances.uploadAttachment(instance.processId, instance.instanceId, "results.csv", Buffer.from(this.generateCSV(rows)).toString("base64"));
    }

    if (url && url.length > 0) {
      if (instance.extras.fieldContents[targetFieldCSV] == null) {
        instance.extras.fieldContents[targetFieldCSV] = { type: "ProcessHubFileUpload", value: null } as PH.Data.IFieldValue;
      }
      (instance.extras.fieldContents[targetFieldCSV] as PH.Data.IFieldValue).value = [url];
    }

    await environment.instances.updateInstance(environment.instanceDetails);
    return true;
  }

  private static generateTable(rows: Array<any>): string {
    const keys = Object.keys(rows[0]);
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

  private static generateCSV(rows: Array<any>): string {
    const keys = Object.keys(rows[0]);
    let data = "";
    keys.forEach((key: any) => {
      data += String(key) + ",";
    });
    data = data.substring(0, data.length - 1);
    data += "\r\n";
    rows.forEach((row: any) => {
      keys.forEach((key) => {
        data += String(row[key]) + ",";
      });
      data = data.substring(0, data.length - 1);
      data += "\r\n";
    });
    return data;
  }
}
