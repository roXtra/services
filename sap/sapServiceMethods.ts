import * as hanaClient from "@sap/hana-client";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools";
import { ConnectionOptions } from "@sap/hana-client";

export default class SAPServiceMethods {
  static async buildInsertQuery(
    environment: IServiceTaskEnvironment,
    tableName: string,
    columns: string,
    values: string,
    instance: IInstanceDetails,
    processObject: BpmnProcess,
  ): Promise<string | undefined> {
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
      await environment.roxApi.getUsersConfig(),
      true,
    );

    return query;
  }

  static async buildSelectQuery(
    environment: IServiceTaskEnvironment,
    tableName: string,
    columns: string,
    where: string,
    instance: IInstanceDetails,
    processObject: BpmnProcess,
  ): Promise<string | undefined> {
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
      await environment.roxApi.getUsersConfig(),
      true,
    );
    selectQuery = selectQuery?.replace(/\s{2,}/g, " ");

    if (selectQuery !== undefined && selectQuery.endsWith("WHERE ;")) {
      selectQuery = selectQuery.substring(0, selectQuery.length - 8) + ";";
    }

    return selectQuery;
  }

  static async buildDeleteQuery(
    environment: IServiceTaskEnvironment,
    tableName: string,
    where: string,
    instance: IInstanceDetails,
    processObject: BpmnProcess,
  ): Promise<string | undefined> {
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
      await environment.roxApi.getUsersConfig(),
      true,
    );

    return deleteQuery;
  }

  static async execQuery(connectionParams: ConnectionOptions | string, query: string, updateMethod: Function): Promise<boolean> {
    let noErrors = true;
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const connection = await hanaClient.createConnection();
    // eslint-disable-next-line @typescript-eslint/await-thenable
    await connection.connect(connectionParams, async (err) => {
      noErrors = this.errorOutput(err, "Connection error", noErrors);
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await connection.exec(query, async (err, rows) => {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await connection.disconnect();

        if (noErrors) {
          noErrors = this.errorOutput(err, "SQL execute error:", noErrors);
        }

        if (noErrors) {
          // eslint-disable-next-line @typescript-eslint/await-thenable
          noErrors = await updateMethod(rows);
        }
      });
    });

    return noErrors;
  }

  private static errorOutput(err: unknown, errorMessage: string, currentErrorState: boolean): boolean {
    if (err) {
      console.error(errorMessage, err);
      throw new BpmnError(ErrorCode.UnknownError, `${errorMessage}: ${String(err)}`);
    }
    return currentErrorState;
  }

  static async serviceOutputLogic(
    rows: Array<{ [key: string]: unknown }>,
    newValue: IFieldValue,
    environment: IServiceTaskEnvironment,
    instance: IInstanceDetails,
    targetFieldTable: string,
    targetFieldCSV: string,
  ): Promise<boolean> {
    if (!instance.extras.fieldContents) {
      throw new Error("Missing fieldcontents");
    }
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

  private static generateTable(rows: Array<{ [key: string]: unknown }>): string {
    const keys = Object.keys(rows[0] as {});
    let table = "<table><tr>";
    keys.forEach((key: unknown) => {
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

  private static generateCSV(rows: Array<{ [key: string]: unknown }>): string {
    const keys = Object.keys(rows[0] as {});
    let data = "";
    keys.forEach((key) => {
      data += String(key) + ",";
    });
    data = data.substring(0, data.length - 1);
    data += "\r\n";
    rows.forEach((row) => {
      keys.forEach((key) => {
        data += String(row[key]) + ",";
      });
      data = data.substring(0, data.length - 1);
      data += "\r\n";
    });
    return data;
  }
}
