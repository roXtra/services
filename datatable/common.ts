import { IDataTableFieldConfig, IDataTableFieldValue } from "processhub-sdk/lib/data/fields/datatable.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { decodeURLSafeBase64 } from "processhub-sdk/lib/tools/stringtools.js";
import * as XLSX from "xlsx";
import fs from "fs";

export enum DataTableErrorCode {
  FILE_ERROR = "FILE_ERROR",
  DATA_ERROR = "DATA_ERROR",
  SHEET_ERROR = "SHEET_ERROR",
  FILTER_ERROR = "FILTER_ERROR",
  INPUT_FIELD_ERROR = "INPUT_FIELD_ERROR",
}

export async function loadConfig(environment: IServiceTaskEnvironment, language: string) {
  const bpmnProcess = new BpmnProcess();
  await bpmnProcess.loadXml(environment.bpmnXml);
  const taskObject = bpmnProcess.getExistingTask(bpmnProcess.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, die Konfiguration konnte nicht geladen werden.", language));
  }
  return { config, bpmnProcess };
}

export function getPhysicalPath(attachmentUrl: string, environment: IServiceTaskEnvironment) {
  let relativePath = attachmentUrl.split("modules/files/")[1];
  const pathParts = relativePath.split("/");
  pathParts[pathParts.length - 1] = decodeURLSafeBase64(pathParts[pathParts.length - 1]);
  relativePath = pathParts.join("/");

  return environment.fileStore.getPhysicalPath(relativePath);
}

export function checkResultField(bpmnProcess: BpmnProcess, dataTableField: string, language: string) {
  const fieldDefinition = bpmnProcess.getFieldDefinitions().find((f) => f.name === dataTableField);
  if (!fieldDefinition) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist nicht im Prozess definiert.", language));
  }
  if (fieldDefinition.type !== "ProcessHubDataTable") {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Das Ergebnisfeld ist nicht vom Typ 'Tabellarische Daten'.", language));
  }
  const fieldConfig = fieldDefinition.config as IDataTableFieldConfig;
  return fieldConfig;
}

/**
 * Reads data from an xlsx file
 * @param environment - The service task environment.
 * @param language - The language used for error messages.
 * @param rowFilter - The filter expression to apply to each row.
 * @param fieldConfig - The configuration for the DataTable field.
 * @param sheetName - The name of the sheet to read from the file - if undefined, the first sheet is read.
 * @param file - Can be set to a string containing the file path or a Buffer containing the file data.
 * @returns The structured DataTableFieldValue object containing the read data.
 * @throws BpmnError if there is an error reading the file or applying the filter.
 */
export function readFileData(
  environment: IServiceTaskEnvironment,
  language: string,
  rowFilter: string,
  fieldConfig: IDataTableFieldConfig,
  sheetName: string | undefined,
  file: string | Buffer,
) {
  const fieldValue: IDataTableFieldValue = {
    rows: [],
  };
  XLSX.set_fs(fs);
  let xlsxfile: XLSX.WorkBook;
  try {
    xlsxfile = typeof file === "string" ? XLSX.readFile(file) : XLSX.read(file);
  } catch (e) {
    environment.logger.error(`XLSX.readFile exception: ${String(e)}`);
    throw new BpmnError(DataTableErrorCode.FILE_ERROR, tl(`Fehler beim Lesen der Datei: ` + String(e), language));
  }

  let sheet: XLSX.WorkSheet;
  if (sheetName) {
    sheet = xlsxfile.Sheets[sheetName];
  } else {
    sheet = xlsxfile.Sheets[xlsxfile.SheetNames[0]];
  }
  if (!sheet) {
    throw new BpmnError(DataTableErrorCode.SHEET_ERROR, tl(`Das Arbeitsblatt konnte nicht gefunden werden.`, language));
  }
  const json = XLSX.utils.sheet_to_json<Record<string, string | number | Date>>(sheet);

  using vm = environment.getVM();

  for (const rawRow of json) {
    // Copy only the columns that are defined in the field config
    const data: { [field: string]: string | number | Date } = {};
    for (const col of fieldConfig.columns) {
      const value = rawRow[col.name];
      if (value !== undefined) {
        switch (col.type) {
          case "numeric":
            {
              const numValue = Number(value);
              if (isNaN(numValue)) {
                environment.logger.error(`Invalid numeric value when reading data from spreadsheet: ${col.name} (${String(value)})`);
                throw new BpmnError(DataTableErrorCode.DATA_ERROR, tl("Ungültiger numerischer Wert: ", language) + col.name + " (" + String(value) + ")");
              }
              data[col.name] = numValue;
            }
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
        throw new BpmnError(DataTableErrorCode.FILTER_ERROR, tl(`Fehler beim Auswerten des Filters: `, language) + String(e));
      }
    }

    fieldValue.rows.push({
      data,
      selected: false,
    });
  }
  return fieldValue;
}
