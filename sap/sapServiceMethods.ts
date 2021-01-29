import * as PH from "processhub-sdk";
import * as hanaClient from "@sap/hana-client";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance";

export default class SAPServiceMethods {
  static buildInsertQuery(
    tableName: string,
    columns: string,
    values: string,
    instance: PH.Instance.IInstanceDetails,
    processObject: PH.Process.BpmnProcess,
  ): string | undefined {
    let query: string | undefined = "INSERT INTO " + tableName + " (" + columns + ") " + "VALUES (" + values + ");";

    if (instance.extras.roleOwners === undefined) {
      throw new Error("instance.extras.roleOwners is undefined, cannot proceed!");
    }

    query = PH.Data.parseAndInsertStringWithFieldContent(query, instance.extras.fieldContents, processObject, instance.extras.roleOwners, true);

    return query;
  }

  static buildSelectQuery(
    tableName: string,
    columns: string,
    where: string,
    instance: PH.Instance.IInstanceDetails,
    processObject: PH.Process.BpmnProcess,
  ): string | undefined {
    let selectQuery: string | undefined = "SELECT " + columns + " FROM " + tableName + " WHERE " + where + ";";

    if (instance.extras.roleOwners === undefined) {
      throw new Error("instance.extras.roleOwners is undefined, cannot proceed!");
    }

    selectQuery = PH.Data.parseAndInsertStringWithFieldContent(selectQuery, instance.extras.fieldContents, processObject, instance.extras.roleOwners, true);
    selectQuery = selectQuery?.replace(/\s{2,}/g, " ");

    if (selectQuery !== undefined && selectQuery.endsWith("WHERE ;")) {
      selectQuery = selectQuery.substring(0, selectQuery.length - 8) + ";";
    }

    return selectQuery;
  }

  static buildDeleteQuery(tableName: string, where: string, instance: PH.Instance.IInstanceDetails, processObject: PH.Process.BpmnProcess): string | undefined {
    let deleteQuery: string | undefined = "DELETE FROM " + tableName + " WHERE " + where + ";";

    if (instance.extras.roleOwners === undefined) {
      throw new Error("instance.extras.roleOwners is undefined, cannot proceed!");
    }

    deleteQuery = PH.Data.parseAndInsertStringWithFieldContent(deleteQuery, instance.extras.fieldContents, processObject, instance.extras.roleOwners, true);

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
      throw new BpmnError(ErrorCode.UnknownError, `${errorMessage}: ${String(err)}`);
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
    let url: string | undefined = undefined;

    if (rows && rows.length) {
      newValue.value = this.generateTable(rows);
      instance.extras.fieldContents[targetFieldTable] = newValue;

      url = await environment.instances.uploadAttachment(instance.processId, instance.instanceId, "results.csv", Buffer.from(this.generateCSV(rows)).toString("base64"));
    }

    if (url && url.length > 0) {
      if (instance.extras.fieldContents[targetFieldCSV] == null) {
        instance.extras.fieldContents[targetFieldCSV] = { type: "ProcessHubFileUpload", value: undefined } as PH.Data.IFieldValue;
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
