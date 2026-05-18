import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { IBaseStateColumn } from "processhub-sdk/lib/process/legacyapi.js";
import { FieldType, FieldValueType } from "processhub-sdk/lib/data/ifieldvalue.js";
import { decodeFieldKey, toStr, resolveFieldDisplayValue, getResolvedValue } from "./field-resolver.js";
import { getBackendUrl } from "processhub-sdk/lib/config.js";
import { Workbook } from "@progress/kendo-ooxml";
import type { WorkbookSheetRow, WorkbookSheetRowCell } from "@progress/kendo-ooxml";

interface IHyperlinkCell {
  xlsxUrl: string;
  label: string;
}

function isHyperlink(value: unknown): value is IHyperlinkCell {
  return typeof value === "object" && value !== null && "xlsxUrl" in value;
}

/**
 * Generate XLSX buffer from instances using the columns defined in the view.
 */
export async function generateXLSX(instances: IInstanceDetails[], viewColumns: IBaseStateColumn[], language: string): Promise<Buffer> {
  const rows: Record<string, unknown>[] = [];
  for (const instance of instances) {
    rows.push(instanceToRow(instance, viewColumns, language));
  }
  return generateXLSXFromRows(rows, viewColumns);
}

/**
 * Convert a single instance to a flat row object, filtered by view columns.
 * Checks extras.fieldContents, extras.roleOwners (lane_*), direct instance properties,
 * and computed fields (link, idLowercase, state).
 */
export function instanceToRow(instance: IInstanceDetails, viewColumns: IBaseStateColumn[], language: string): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const fc = instance.extras?.fieldContents || {};
  const roleOwners = instance.extras?.roleOwners || {};
  const todos = instance.extras?.todos || [];

  const instanceId = instance.instanceId;
  const workspaceId = instance.workspaceId;

  for (const col of viewColumns) {
    const fieldKey = col.field;

    // Check fieldContents for field_* columns (base64-encoded field name)
    if (fieldKey.startsWith("field_")) {
      const fieldName = decodeFieldKey(fieldKey);
      const fcVal = fc[fieldName];
      if (fcVal !== undefined) {
        row[col.title || fieldKey] = formatFieldValue(fcVal.value, fcVal.type);
      } else {
        row[col.title || fieldKey] = "";
      }
      continue;
    }

    // Lane/role owner fields (e.g. lane_Lane_7A0DD19E05A33282)
    if (fieldKey.startsWith("lane_")) {
      const laneId = fieldKey.replace("lane_", "");
      const owners = roleOwners[laneId];
      if (owners && owners.length > 0) {
        row[col.title || fieldKey] = owners.map((o) => o.displayName || o.memberId).join(", ");
      } else {
        row[col.title || fieldKey] = "";
      }
      continue;
    }

    // Computed/virtual fields
    if (fieldKey === "link") {
      const url = `${getBackendUrl()}/p/i/${workspaceId}/${instanceId}`;
      row[col.title || fieldKey] = { xlsxUrl: url, label: "Link" };
      continue;
    }
    if (fieldKey === "idLowercase") {
      row[col.title || fieldKey] = instanceId?.toLowerCase() ?? "";
      continue;
    }

    // State as readable text
    if (fieldKey === "state") {
      row[col.title || fieldKey] = getResolvedValue(instance, fieldKey, language);
      continue;
    }

    // Todos (pending tasks)
    if (fieldKey === "todos") {
      if (todos.length > 0) {
        row[col.title || fieldKey] = todos.map((t) => t.displayName || t.bpmnTaskId).join(", ");
      } else {
        row[col.title || fieldKey] = "";
      }
      continue;
    }

    // Start event / end events
    if (fieldKey.startsWith("startevent_")) {
      if (col.title?.toLowerCase().includes("end")) {
        row[col.title || fieldKey] = (instance.reachedEndEvents || []).join(", ");
      } else {
        row[col.title || fieldKey] = instance.takenStartEvent || "";
      }
      continue;
    }

    // Virtual date-only fields (computed from createdAt / completedAt)
    if (fieldKey === "createdAtDate" || fieldKey === "completedAtDate") {
      row[col.title || fieldKey] = getResolvedValue(instance, fieldKey);
      continue;
    }

    // Direct instance properties (title, createdAt, completedAt, cancellationReason, etc.)
    if (instance[fieldKey as keyof IInstanceDetails] !== undefined) {
      row[col.title || fieldKey] = getResolvedValue(instance, fieldKey);
      continue;
    }

    row[col.title || fieldKey] = "";
  }
  return row;
}

/**
 * Format a field value for display in XLSX.
 * Delegates type-aware parsing to resolveFieldDisplayValue, with one XLSX-specific
 * exception: a single-file ProcessHubFileUpload is returned as a hyperlink object
 * { xlsxUrl, label } so Kendo OOXML can render it as a clickable cell.
 */
function formatFieldValue(value: FieldValueType | null | undefined, type?: FieldType): unknown {
  if (value == null) return "";

  // FileUpload single-file: return XLSX hyperlink object instead of plain text
  if (type === "ProcessHubFileUpload" && Array.isArray(value) && value.length === 1 && typeof value[0] === "string") {
    const url = value[0];
    const parts = url.split("/");
    const label = decodeURIComponent(parts[parts.length - 1] || url);
    return { xlsxUrl: url, label };
  }

  return resolveFieldDisplayValue(value, type);
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
export async function generateXLSXFromRows(rows: Record<string, unknown>[], viewColumns: IBaseStateColumn[]): Promise<Buffer> {
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
    cells: headers.map((header): WorkbookSheetRowCell => {
      const value = row[header];
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
