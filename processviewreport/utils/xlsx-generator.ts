import { IInstanceDetails, State } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { IBaseStateColumn } from "processhub-sdk/lib/process/legacyapi.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { decodeFieldKey, toStr } from "./field-resolver.js";
import { getBackendUrl } from "processhub-sdk/lib/config.js";
import * as XLSX from "xlsx";

/**
 * Generate XLSX buffer from instances using the columns defined in the view.
 */
export function generateXLSX(instances: IInstanceDetails[], viewColumns: IBaseStateColumn[], environment: IServiceTaskEnvironment): Buffer {
  const rows: Record<string, unknown>[] = [];
  for (const instance of instances) {
    rows.push(instanceToRow(instance, viewColumns, environment));
  }
  return generateXLSXFromRows(rows, viewColumns);
}

/**
 * Convert a single instance to a flat row object, filtered by view columns.
 * Checks extras.fieldContents, extras.roleOwners (lane_*), direct instance properties,
 * and computed fields (link, idLowercase, state).
 */
export function instanceToRow(instance: IInstanceDetails, viewColumns: IBaseStateColumn[], environment: IServiceTaskEnvironment): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const fc = instance.extras?.fieldContents || {};
  const roleOwners = instance.extras?.roleOwners || {};
  const todos = instance.extras?.todos || [];

  const instanceId = instance.instanceId;
  const workspaceId = instance.workspaceId;

  environment.logger.debug(`Processing instance ${instanceId} with workspace ${workspaceId}`);

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
      row[col.title || fieldKey] = `${getBackendUrl()}/p/i/${workspaceId}/${instanceId}`;
      continue;
    }
    if (fieldKey === "idLowercase") {
      row[col.title || fieldKey] = instanceId?.toLowerCase() ?? "";
      continue;
    }

    // State as readable text
    if (fieldKey === "state") {
      row[col.title || fieldKey] = stateToString(instance.state);
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
    // FileUpload: array of URLs or file objects
    return value
      .map((v) => {
        if (typeof v === "string") {
          // Extract filename from URL if possible
          const parts = v.split("/");
          return parts[parts.length - 1] || v;
        }
        return toStr(v);
      })
      .join(", ");
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

function stateToString(state: State | undefined): string {
  switch (state) {
    case State.Running:
      return "Laufend";
    case State.Finished:
      return "Beendet";
    case State.Canceled:
      return "Abgebrochen";
    case State.Error:
      return "Fehler";
    default:
      return "";
  }
}

/**
 * Generate XLSX buffer from already prepared rows, preserving column order from view.
 */
export function generateXLSXFromRows(rows: Record<string, unknown>[], viewColumns: IBaseStateColumn[]): Buffer {
  const headers = viewColumns.map((col) => col.title || col.field);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = { Sheets: { Report: sheet }, SheetNames: ["Report"] };
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}
