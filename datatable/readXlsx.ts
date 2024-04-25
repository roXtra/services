import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { tl } from "processhub-sdk/lib/tl.js";
import * as XLSX from "xlsx";
import { IDataTableFieldConfig, IDataTableFieldValue } from "processhub-sdk/lib/data/fields/datatable.js";
import fs from "fs";

export enum ErrorCodes {
  FILE_ERROR = "FILE_ERROR",
  SHEET_ERROR = "SHEET_ERROR",
  FILTER_ERROR = "FILTER_ERROR",
}

export async function readXlsx(environment: IServiceTaskEnvironment): Promise<boolean> {
  await readXlsxFile(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}

export async function readXlsxFile(environment: IServiceTaskEnvironment): Promise<IDataTableFieldValue> {
  const language = environment.sender.language || "en-US";

  const bpmnProcess = new BpmnProcess();
  await bpmnProcess.loadXml(environment.bpmnXml);
  const taskObject = bpmnProcess.getExistingTask(bpmnProcess.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, die Konfiguration konnte nicht geladen werden.", language));
  }

  const fields = config.fields;

  const filePath = fields.find((f) => f.key === "filePath")?.value || "";
  const sheetName = fields.find((f) => f.key === "sheetName")?.value || "";
  const dataTableField = fields.find((f) => f.key === "dataTableField")?.value || "";
  const rowFilter = fields.find((f) => f.key === "rowFilter")?.value || "";

  if (!filePath) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Dateipfad ist leer.", language));
  }
  if (!dataTableField) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist leer.", language));
  }

  const fieldDefinition = bpmnProcess.getFieldDefinitions().find((f) => f.name === dataTableField);
  if (!fieldDefinition) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist nicht im Prozess definiert.", language));
  }
  if (fieldDefinition.type !== "ProcessHubDataTable") {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist nicht vom Typ 'Tabellarische Daten'.", language));
  }
  const fieldConfig = fieldDefinition.config as IDataTableFieldConfig;

  XLSX.set_fs(fs);
  let xlsxfile: XLSX.WorkBook;
  try {
    xlsxfile = XLSX.readFile(filePath);
  } catch (e) {
    environment.logger.error(`XLSX.readFile exception: ${String(e)}`);
    throw new BpmnError(ErrorCodes.FILE_ERROR, tl(`Fehler beim Lesen der Datei: ` + String(e), language));
  }

  let sheet: XLSX.WorkSheet;
  if (sheetName) {
    sheet = xlsxfile.Sheets[sheetName];
  } else {
    sheet = xlsxfile.Sheets[xlsxfile.SheetNames[0]];
  }
  if (!sheet) {
    throw new BpmnError(ErrorCodes.SHEET_ERROR, tl(`Das Arbeitsblatt konnte nicht gefunden werden.`, language));
  }
  const json = XLSX.utils.sheet_to_json<Record<string, string | number | Date>>(sheet);

  const fieldValue: IDataTableFieldValue = {
    rows: [],
  };

  using vm = environment.getVM();

  for (const rawRow of json) {
    // Copy only the columns that are defined in the field config
    const data: { [field: string]: string | number | Date } = {};
    for (const col of fieldConfig.columns) {
      const value = rawRow[col.name];
      if (value !== undefined) {
        switch (col.type) {
          case "numeric":
            data[col.name] = Number(value);
            break;
          case "date":
            data[col.name] = new Date(value);
            break;
          case "text":
            data[col.name] = String(value);
            break;
          default:
            throw new BpmnError(ErrorCode.ConfigInvalid, tl("Ungültiger Spaltentyp: ", language) + col.name + " (" + String(col.type) + ")");
        }
      }
    }
    // Filter the row if a filter is defined
    if (rowFilter) {
      vm.setGlobal("row", data);
      try {
        const filterResult = vm.evalCode(rowFilter);
        if (!filterResult) {
          // The row does not match the filter
          continue;
        }
      } catch (e) {
        environment.logger.error(`Filter error: ${String(e)}`);
        throw new BpmnError(ErrorCodes.FILTER_ERROR, tl(`Fehler beim Auswerten des Filters: `, language) + String(e));
      }
    }

    fieldValue.rows.push({
      data,
      selected: false,
    });
  }

  const instance = environment.instanceDetails;
  const fieldContents = instance.extras.fieldContents || {};

  fieldContents[dataTableField] = {
    type: "ProcessHubDataTable",
    value: fieldValue,
  };
  return fieldValue;
}
