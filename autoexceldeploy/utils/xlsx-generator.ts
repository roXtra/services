import { IInstanceDetails, State } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { IBaseStateColumn } from "processhub-sdk/lib/process/legacyapi.js";
import { decodeFieldKey, toStr } from "./field-resolver.js";
import { getBackendUrl } from "processhub-sdk/lib/config.js";
import * as XLSX from "xlsx";
import { tl } from "processhub-sdk/lib/tl.js";

interface IHyperlinkCell {
  xlsxUrl: string;
  label: string;
}

function isHyperlink(v: unknown): v is IHyperlinkCell {
  return typeof v === "object" && v !== null && "xlsxUrl" in v;
}

/**
 * Generate XLSX buffer from instances using the columns defined in the view.
 */
export function generateXLSX(instances: IInstanceDetails[], viewColumns: IBaseStateColumn[], language: string): Buffer {
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
 * Handles arrays (FileUpload), HTML (TextArea), etc.
 */
function formatFieldValue(value: unknown, type?: string): unknown {
  if (value == null) return "";
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    if (type === "ProcessHubFileUpload") {
      // Single file: return as clickable hyperlink
      if (value.length === 1 && typeof value[0] === "string") {
        const url = value[0];
        const parts = url.split("/");
        const label = decodeURIComponent(parts[parts.length - 1] || url);
        return { xlsxUrl: url, label };
      }
      // Multiple files: join filenames as plain text (one cell can't hold multiple hyperlinks)
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
    // Non-FileUpload arrays
    return value.map((v) => (typeof v === "string" ? v : toStr(v))).join(", ");
  }
  if (typeof value === "string" && type === "ProcessHubTextArea") {
    // Strip HTML tags
    return value.replace(/<[^>]*>/g, "").trim();
  }
  return value;
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
 * Generate XLSX buffer from already prepared rows, preserving column order from view.
 */
export function generateXLSXFromRows(rows: Record<string, unknown>[], viewColumns: IBaseStateColumn[]): Buffer {
  const headers = viewColumns.map((col) => col.title || col.field);

  // Separate hyperlink metadata from plain values before passing to json_to_sheet
  const hyperlinkCells = new Map<string, string>(); // "rowIdx:header" -> url
  const plainRows = rows.map((row, rowIdx) => {
    const plain: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      if (isHyperlink(val)) {
        hyperlinkCells.set(`${rowIdx}:${key}`, val.xlsxUrl);
        plain[key] = val.label;
      } else {
        plain[key] = val;
      }
    }
    return plain;
  });

  const sheet = XLSX.utils.json_to_sheet(plainRows, { header: headers });

  // Post-process: write =HYPERLINK formula into marked cells
  if (hyperlinkCells.size > 0) {
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

    // Build header-value -> column-index map from row 0
    const headerColMap = new Map<string, number>();
    for (let c = range.s.c; c <= range.e.c; c++) {
      const hCell = sheet[XLSX.utils.encode_cell({ r: 0, c })] as { v?: string | number } | undefined;
      if (hCell?.v != null) headerColMap.set(String(hCell.v), c);
    }

    for (let r = 1; r <= range.e.r; r++) {
      const rowIdx = r - 1;
      for (const [header, colIdx] of headerColMap) {
        const url = hyperlinkCells.get(`${rowIdx}:${header}`);
        if (!url) continue;
        const addr = XLSX.utils.encode_cell({ r, c: colIdx });
        const cell = sheet[addr] as { v?: string | number; f?: string; t?: string } | undefined;
        if (cell) {
          const label = typeof cell.v === "string" || typeof cell.v === "number" ? String(cell.v) : "Link";
          // Escape double quotes inside url/label to avoid breaking the formula
          const safeUrl = url.replace(/"/g, "'");
          const safeLabel = label.replace(/"/g, "'");
          cell.f = `HYPERLINK("${safeUrl}","${safeLabel}")`;
          cell.v = label;
          cell.t = "s";
        }
      }
    }
  }

  const workbook = { Sheets: { Report: sheet }, SheetNames: ["Report"] };
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}
