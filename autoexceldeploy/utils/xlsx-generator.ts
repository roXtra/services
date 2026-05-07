import { IInstanceDetails, State } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { IBaseStateColumn } from "processhub-sdk/lib/process/legacyapi.js";
import { decodeFieldKey, toStr } from "./field-resolver.js";
import { getBackendUrl } from "processhub-sdk/lib/config.js";
import { Workbook } from "@progress/kendo-ooxml";
import type { WorkbookSheetRow, WorkbookSheetRowCell } from "@progress/kendo-ooxml";
import { tl } from "processhub-sdk/lib/tl.js";

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
      row[col.title || fieldKey] = stateToString(instance.state, language);
      continue;
    }

    // Date-only variants
    if (fieldKey === "createdAtDate") {
      row[col.title || fieldKey] = formatDateOnly(instance.createdAt);
      continue;
    }
    if (fieldKey === "completedAtDate") {
      row[col.title || fieldKey] = formatDateOnly(instance.completedAt);
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

    // Direct instance properties (title, createdAt, completedAt, cancellationReason, etc.)
    if (instance[fieldKey as keyof IInstanceDetails] !== undefined) {
      row[col.title || fieldKey] = instance[fieldKey as keyof IInstanceDetails];
      continue;
    }

    row[col.title || fieldKey] = "";
  }
  return row;
}

/**
 * Format a field value for display in XLSX.
 * Handles all ProcessHub field types (RadioButton, Checklist, TreeView, etc.).
 */
function formatFieldValue(value: unknown, type?: string): unknown {
  if (value == null) return "";

  // --- Array types ---
  if (Array.isArray(value)) {
    if (value.length === 0) return "";

    // FileUpload: array of URL strings
    if (type === "ProcessHubFileUpload") {
      if (value.length === 1 && typeof value[0] === "string") {
        const url = value[0];
        const parts = url.split("/");
        const label = decodeURIComponent(parts[parts.length - 1] || url);
        return { xlsxUrl: url, label };
      }
      return value
        .map((v) => {
          if (typeof v === "string") {
            const parts = v.split("/");
            return decodeURIComponent(parts[parts.length - 1] || v);
          }
          return toStr(v);
        })
        .join(", ");
    }

    // RoxFileLink: array of { roxFileName, roxFileId, ... }
    if (type === "ProcessHubRoxFileLink") {
      return value
        .map((v) => {
          if (typeof v === "object" && v !== null && "roxFileName" in v) {
            return (v as { roxFileName?: string }).roxFileName ?? "";
          }
          return toStr(v);
        })
        .filter(Boolean)
        .join(", ");
    }

    return value.map((v) => (typeof v === "string" ? v : toStr(v))).join(", ");
  }

  // --- String types ---
  if (typeof value === "string") {
    if (type === "ProcessHubTextArea") {
      return value.replace(/<[^>]*>/g, "").trim();
    }
    return value;
  }

  // --- Non-string primitives ---
  if (typeof value !== "object") return value;

  // --- Object types ---

  // RadioButton: { radioButtons: [{ name }], selectedRadio: number }
  if (type === "ProcessHubRadioButton" && "radioButtons" in value && "selectedRadio" in value) {
    const rb = value as { radioButtons: Array<{ name?: string } | undefined>; selectedRadio: number | undefined };
    const idx = rb.selectedRadio;
    if (idx != null && rb.radioButtons[idx] != null) {
      return rb.radioButtons[idx]?.name ?? "";
    }
    return "";
  }

  // Checklist / Decision: { [label: string]: boolean } – return checked labels
  if (type === "ProcessHubChecklist" || type === "ProcessHubDecision") {
    return Object.entries(value as Record<string, boolean>)
      .filter(([, checked]) => checked)
      .map(([key]) => key)
      .join(", ");
  }

  // Tasks: { tasks: [{ checked, text }] }
  if (type === "ProcessHubTasks" && "tasks" in value) {
    const tasks = (value as { tasks: Array<{ checked: boolean; text: string }> }).tasks;
    return tasks.map((t) => (t.checked ? `[x] ${t.text}` : `[ ] ${t.text}`)).join(", ");
  }

  // TreeView: { entries: [{ name, checked, subItems }] } – collect all checked names recursively
  if (type === "ProcessHubTreeView" && "entries" in value) {
    type TEntry = { name: string; checked: boolean; subItems: TEntry[] };
    const collectChecked = (entries: TEntry[]): string[] => {
      const result: string[] = [];
      for (const e of entries) {
        if (e.checked) result.push(e.name);
        result.push(...collectChecked(e.subItems));
      }
      return result;
    };
    return collectChecked((value as { entries: TEntry[] }).entries).join(", ");
  }

  // DateRange: { start: Date, end: Date }
  if (type === "ProcessHubDateRange" && "start" in value && "end" in value) {
    const dr = value as { start: Date | string | null | undefined; end: Date | string | null | undefined };
    const fmtDate = (d: Date | string | null | undefined): string => {
      if (!d) return "";
      const s = d instanceof Date ? d.toISOString() : String(d);
      return s.slice(0, 10);
    };
    return `${fmtDate(dr.start)} – ${fmtDate(dr.end)}`;
  }

  // SVGDropdown: { text: string, svgData: ... }
  if (type === "ProcessHubSVGDropdown" && "text" in value) {
    return (value as { text: string }).text;
  }

  // ProcessLink: { linkedInstances: [{ title?, instanceId }] }
  if (type === "ProcessHubProcessLink" && "linkedInstances" in value) {
    const pl = value as { linkedInstances: Array<{ title?: string; instanceId: string }> };
    return pl.linkedInstances.map((i) => i.title || i.instanceId).join(", ");
  }

  // RoxFile: { url?, ... }
  if (type === "ProcessHubRoxFile" && "url" in value) {
    return (value as { url?: string }).url ?? "";
  }

  // Signature: SVG data, not text-representable
  if (type === "ProcessHubSignature") {
    return "";
  }

  // Fallback: convert unrecognized objects to string so cells are never empty
  return toStr(value);
}

function formatDateOnly(date: Date | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date.toISOString() : String(date);
  return d.slice(0, 10);
}

function stateToString(state: State | undefined, language: string): string {
  switch (state) {
    case State.Running:
      return tl("Laufend", language);
    case State.Finished:
      return tl("Beendet", language);
    case State.Canceled:
      return tl("Abgebrochen", language);
    case State.Error:
      return tl("Fehler", language);
    default:
      return "";
  }
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
