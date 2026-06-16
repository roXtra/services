import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { IBaseStateColumn } from "processhub-sdk/lib/process/legacyapi.js";
import { toStr, getResolvedValue, IHyperlinkCell, IRiskManagementRPZ, IRiskTrendCell } from "./field-resolver.js";
import { getBackendUrl } from "processhub-sdk/lib/config.js";
import { Workbook } from "@progress/kendo-ooxml";
import type { WorkbookSheetRow, WorkbookSheetRowCell } from "@progress/kendo-ooxml";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { DefaultColumns } from "./field-keys.js";
import IAuditsSettings from "processhub-sdk/lib/modules/audits/iauditssettings.js";
import { ModuleName } from "processhub-sdk/lib/modules/imodule.js";

function isHyperlink(value: unknown): value is IHyperlinkCell {
  return typeof value === "object" && value !== null && "xlsxUrl" in value;
}

function isRPZDimension(value: unknown): value is IRiskManagementRPZ {
  return typeof value === "object" && value !== null && "value" in value && "color" in value;
}

function isRiskTrendCell(value: unknown): value is IRiskTrendCell {
  return typeof value === "object" && value !== null && "trend" in value && "color" in value;
}

export interface IGenerateXLSXOptions {
  language: string;
  module: {
    name: ModuleName;
    urlPrefix: "p" | "r" | "m" | "mp" | "a";
    title: string;
  };
  instanceCount?: number;
  auditsSettings?: IAuditsSettings;
  environment?: IServiceTaskEnvironment;
}

/**
 * Generate XLSX buffer from instances using the columns defined in the view.
 */
export async function generateXLSX(instances: IInstanceDetails[], viewColumns: IBaseStateColumn[], options: IGenerateXLSXOptions): Promise<Buffer> {
  const rows: Record<string, unknown>[] = [];
  for (const instance of instances) {
    rows.push(instanceToRow(instance, viewColumns, options));
  }
  return generateXLSXFromRows(rows, viewColumns);
}

/**
 * Convert a single instance to a flat row object, filtered by view columns.
 * Checks extras.fieldContents, extras.roleOwners (lane_*), direct instance properties,
 * and computed fields (link, idLowercase, state).
 */
export function instanceToRow(instance: IInstanceDetails, viewColumns: IBaseStateColumn[], options: IGenerateXLSXOptions): Record<number, unknown> {
  const row: Record<number, unknown> = {};

  const instanceId = instance.instanceId;
  const workspaceId = instance.workspaceId;

  for (const [index, col] of viewColumns.entries()) {
    const fieldKey = col.field;

    // Link: URL construction requires backend URL + module + instance context
    if (
      fieldKey === DefaultColumns.link.field ||
      (options.module.name === "risks" && fieldKey === DefaultColumns.riskTitle.field) ||
      (options.module.name === "audit" && fieldKey === DefaultColumns.title.field)
    ) {
      const url = `${getBackendUrl()}/${options.module.urlPrefix}/i/${workspaceId}/${instanceId}`;
      const getLabel = () => {
        if (fieldKey === DefaultColumns.riskTitle.field) return instance.title;
        if (fieldKey === DefaultColumns.title.field) return instance.title;
        return "Link";
      };
      row[index] = { xlsxUrl: url, label: getLabel() };
      continue;
    }

    // All other fields: field_*, lane_*, dimension*, state, todos, dates, instance properties
    row[index] = getResolvedValue(instance, fieldKey, options);
  }
  return row;
}

/**
 * Safely converts any value to a type accepted by Kendo OOXML cell values.
 * Prevents empty cells when raw objects or unexpected types reach the sheet.
 */
function toKendoValue(value: unknown): string | number | boolean | Date {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date) return value;
  return toStr(value);
}

/**
 * Generate XLSX buffer from already prepared rows, preserving column order from view.
 */
export async function generateXLSXFromRows(rows: Record<number, unknown>[], viewColumns: IBaseStateColumn[]): Promise<Buffer> {
  const headers = viewColumns.map((col) => col.title || col.field);

  // Column widths – IBaseStateColumn.width is a string like "150px" or "150"
  const sheetColumns = viewColumns.map((col) => {
    const px = col.width ? parseInt(col.width, 10) : 150;
    return { width: px };
  });

  // Header row – grey background, white bold text
  const headerRow: WorkbookSheetRow = {
    cells: headers.map((header): WorkbookSheetRowCell => ({ value: header, background: "#4F4F4F", color: "#FFFFFF" })),
    type: "header",
  };

  // Data rows
  const dataRows: WorkbookSheetRow[] = rows.map((row) => ({
    cells: headers.map((header, colIndex): WorkbookSheetRowCell => {
      const value = row[colIndex];
      if (isHyperlink(value)) {
        // Escape double quotes inside url/label to avoid breaking the formula
        const safeUrl = value.xlsxUrl.replace(/"/g, "'");
        const safeLabel = value.label.replace(/"/g, "'");
        return {
          formula: `HYPERLINK("${safeUrl}","${safeLabel}")`,
          value: value.label,
          format: "[Blue]",
          underline: true,
        };
      }
      if (isRPZDimension(value)) {
        return {
          value: toKendoValue(value.value),
          format: "[White]",
          background: value.color,
        };
      }
      if (isRiskTrendCell(value)) {
        return {
          value: toKendoValue(value.trend),
          format: "[White]",
          background: value.color,
        };
      }
      return { value: toKendoValue(value) };
    }),
  }));

  const workbook = new Workbook({
    sheets: [{ name: "Report", columns: sheetColumns, rows: [headerRow, ...dataRows] }],
  });

  const dataUrl = await workbook.toDataURL();
  const base64 = dataUrl.split(",")[1];
  return Buffer.from(base64, "base64");
}

// Status muss noch bei Risiko Modul bearbeitet werden das verwende Aktiv statt Laufend !!!
