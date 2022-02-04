import * as hanaClient from "@sap/hana-client";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";

export default class SAPServiceMethods {
  static buildInsertQuery(
    environment: IServiceTaskEnvironment,
    tableName: string,
    columns: string,
    values: string,
    instance: IInstanceDetails,
    processObject: BpmnProcess,
  ): string | undefined {
    let query: string | undefined = "INSERT INTO " + tableName + " (" + columns + ") " + "VALUES (" + values + ");";

    if (instance.extras.roleOwners === undefined) {
      throw new Error("instance.extras.roleOwners is undefined, cannot proceed!");
    }

    query = parseAndInsertStringWithFieldContent(
      query,
      instance.extras.fieldContents,
      processObject,
      instance.extras.roleOwners,
      environment.sender.language || "de-DE",
      true,
    );

    return query;
  }

  static buildSelectQuery(
    environment: IServiceTaskEnvironment,
    tableName: string,
    columns: string,
    where: string,
    instance: IInstanceDetails,
    processObject: BpmnProcess,
  ): string | undefined {
    let selectQuery: string | undefined = "SELECT " + columns + " FROM " + tableName + " WHERE " + where + ";";

    if (instance.extras.roleOwners === undefined) {
      throw new Error("instance.extras.roleOwners is undefined, cannot proceed!");
    }

    selectQuery = parseAndInsertStringWithFieldContent(
      selectQuery,
      instance.extras.fieldContents,
      processObject,
      instance.extras.roleOwners,
      environment.sender.language || "de-DE",
      true,
    );
    selectQuery = selectQuery?.replace(/\s{2,}/g, " ");

    if (selectQuery !== undefined && selectQuery.endsWith("WHERE ;")) {
      selectQuery = selectQuery.substring(0, selectQuery.length - 8) + ";";
    }

    return selectQuery;
  }

  static buildDeleteQuery(environment: IServiceTaskEnvironment, tableName: string, where: string, instance: IInstanceDetails, processObject: BpmnProcess): string | undefined {
    let deleteQuery: string | undefined = "DELETE FROM " + tableName + " WHERE " + where + ";";

    if (instance.extras.roleOwners === undefined) {
      throw new Error("instance.extras.roleOwners is undefined, cannot proceed!");
    }

    deleteQuery = parseAndInsertStringWithFieldContent(
      deleteQuery,
      instance.extras.fieldContents,
      processObject,
      instance.extras.roleOwners,
      environment.sender.language || "de-DE",
      true,
    );

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
    environment: IServiceTaskEnvironment,
    instance: any,
    targetFieldTable: string,
    targetFieldCSV: string,
  ): Promise<boolean> {
    let url: string | undefined = undefined;

    if (rows && rows.length) {
      newValue.value = this.generateTable(rows);
      instance.extras.fieldContents[targetFieldTable] = newValue;

      url = await environment.instances.uploadAttachment(instance.instanceId, "results.csv", Buffer.from(this.generateCSV(rows)));
    }

    if (url && url.length > 0) {
      if (instance.extras.fieldContents[targetFieldCSV] == null) {
        instance.extras.fieldContents[targetFieldCSV] = { type: "ProcessHubFileUpload", value: undefined } as IFieldValue;
      }
      (instance.extras.fieldContents[targetFieldCSV] as IFieldValue).value = [url];
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
