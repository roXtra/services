import * as PH from "processhub-sdk";
const hanaClient = require("@sap/hana-client");

export default class SAPServiceMethods {
  static parseFieldsOfQuery(query: string, instance: PH.Instance.InstanceDetails): string {
    let modifiedQuery = query;

    while (modifiedQuery.includes("@@")) {
      const pos1 = modifiedQuery.search("@@") + 2;
      const subString = modifiedQuery.substring(pos1, modifiedQuery.length);
      const pos2 = pos1 + subString.search("@@");
      const fieldName = modifiedQuery.substring(pos1, pos2);

      modifiedQuery = modifiedQuery.replace("@@" + fieldName + "@@", (instance.extras.fieldContents[fieldName] as PH.Data.FieldValue).value as string);
    }
    return modifiedQuery;
  }

  static buildInsertQuery(tableName: string, columns: string, values: string, instance: PH.Instance.InstanceDetails): string {
    let query: string = "INSERT INTO " + tableName
      + " (" + columns + ") "
      + "VALUES (" + values + ");";

    query = SAPServiceMethods.parseFieldsOfQuery(query, instance);

    return query;
  }

  static buildSelectQuery(tableName: string, columns: string, where: string, instance: PH.Instance.InstanceDetails): string {
    let selectQuery = "SELECT " + columns
      + " FROM " + tableName
      + " WHERE " + where + ";";

    selectQuery = SAPServiceMethods.parseFieldsOfQuery(selectQuery, instance);
    selectQuery = selectQuery.replace(/\s{2,}/g, " ");

    if (selectQuery.endsWith("WHERE ;")) {
      selectQuery = selectQuery.substring(0, selectQuery.length - 8) + ";";
    }

    return selectQuery;
  }

  static buildDeleteQuery(tableName: string, where: string, instance: PH.Instance.InstanceDetails): string {
    let deleteQuery = "DELETE FROM " + tableName
      + " WHERE " + where + ";";

    deleteQuery = SAPServiceMethods.parseFieldsOfQuery(deleteQuery, instance);

    return deleteQuery;
  }

  static async execQuery(connectionParams: any, query: string, updateMethod: Function): Promise<boolean> {
    let noErrors: boolean = true;

    const connection = await hanaClient.createConnection();
    await connection.connect(connectionParams, async (err: any) => {

      noErrors = await this.errorOutput(err, "Connection error", noErrors);

      await connection.exec(query, async (err: any, rows: Array<any>) => {
        await connection.disconnect();

        if (noErrors) {
          noErrors = await this.errorOutput(err, "SQL execute error:", noErrors);
        }

        if (noErrors) {
          noErrors = await updateMethod(rows);
        }
      });
    });

    return noErrors;
  }

  private static async errorOutput(err: any, errorMessage: string, currentErrorState: boolean): Promise<boolean> {
    if (err) {
      console.error(errorMessage, err);
      return false;
    }
    return currentErrorState;
  }

  static async serviceOutputLogic(rows: Array<any>, newValue: any, accessToken: string, instance: any, targetFieldTable: string, targetFieldCSV: string): Promise<boolean> {
    let noErrors = true;
    let response: PH.Instance.UploadAttachmentReply = null;

    if (rows && rows.length) {
      newValue.value = this.generateTable(rows);
      instance.extras.fieldContents[targetFieldTable] = newValue;

      response = await PH.LegacyApi.postJson(PH.Instance.ProcessEngineApiRoutes.uploadAttachment, {
        data: Buffer.from(this.generateCSV(rows)).toString("base64"),
        fileName: "results.csv",
        instanceId: instance.instanceId,
        processId: instance.processId,
      } as PH.Instance.UploadAttachmentRequest, accessToken) as PH.Instance.UploadAttachmentReply;
    }

    if (response && response.result == PH.LegacyApi.ApiResult.API_OK) {
      if (instance.extras.fieldContents[targetFieldCSV] == null) {
        instance.extras.fieldContents[targetFieldCSV] = { type: "ProcessHubFileUpload", value: null } as PH.Data.FieldValue;
      }
      (instance.extras.fieldContents[targetFieldCSV] as PH.Data.FieldValue).value = [response.url];
    }

    const updateResult = await PH.Instance.updateInstance(instance, accessToken);
    return await this.errorOutput(updateResult.result !== PH.LegacyApi.ApiResult.API_OK, "SAP service: updateInstance call failed", noErrors);
  }

  private static generateTable(rows: Array<any>): string {
    const keys = Object.keys(rows[0]);
    let table = "<table><tr>";
    keys.forEach((key: any) => {
      table += "<th>" + key + "</th>";
    });
    table += "</tr>";
    rows.forEach((row: any) => {
      table += "<tr>";
      keys.forEach(key => {
        table += "<th>" + row[key] + "</th>";
      });
      table += "</tr>";
    });
    return table += "</table>";
  }

  private static generateCSV(rows: Array<any>): string {
    const keys = Object.keys(rows[0]);
    let data = "";
    keys.forEach((key: any) => {
      data += key + ",";
    });
    data = data.substring(0, data.length - 1);
    data += "\r\n";
    rows.forEach((row: any) => {
      keys.forEach(key => {
        data += row[key] + ",";
      });
      data = data.substring(0, data.length - 1);
      data += "\r\n";
    });
    return data;
  }
}