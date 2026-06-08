import { FieldTypeOptions, FieldType, FieldValueType } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IRadioButtonGroupFieldValue } from "processhub-sdk/lib/data/fields/radiobutton.js";
import { ITreeViewEntry, ITreeViewFieldValue } from "processhub-sdk/lib/data/fields/treeview.js";
import { ITasksFieldValue } from "processhub-sdk/lib/data/fields/tasks.js";
import { IDateRangeFieldValue } from "processhub-sdk/lib/data/fields/daterange.js";
import { ISVGDropdownOption } from "processhub-sdk/lib/data/fields/svgdropdown.js";
import { IProcessLinkValue } from "processhub-sdk/lib/data/fields/processlink.js";
import { IRoxFileFieldValue } from "processhub-sdk/lib/data/fields/roxfilefield.js";
import { IRoxFileLinkValue } from "processhub-sdk/lib/data/fields/roxfilelink.js";
import { IInstanceDetails, State } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { IDataTableFieldValue } from "processhub-sdk/lib/data/fields/datatable.js";
import { IGenerateXLSXOptions } from "./xlsx-generator.js";
import { DefaultColumns, DIMENSIONTEXT_KEY_PREFIX, DIMENSIONVALUE_KEY_PREFIX, FIELD_KEY_PREFIX, LANE_KEY_PREFIX } from "./field-keys.js";
import { ISpreadSheetFieldValue } from "processhub-sdk/lib/data/fields/spreadsheet.js";
import { getBackendUrl } from "processhub-sdk/lib/config.js";

export interface IHyperlinkCell {
  xlsxUrl: string;
  label: string;
}

export interface IRiskManagementRPZ {
  value: number;
  color: string;
}

export interface IRiskTrendCell {
  trend: number;
  color: string;
}

export type RiskTrendColors = "red" | "orange" | "green" | "olive" | "yellow";

/**
 * Get the resolved value for a given field key from an instance.
 * @param fieldKey The field key to resolve (e.g. "field_VGl0ZWw_ProcessHubTextInput", "lane_Lane_7A0DD19E05A33282", "state", etc.)
 * @returns The resolved value for the field key, checking fieldContents, roleOwners, direct properties, and computed fields.
 */
export function decodeFieldKey(fieldKey: string): string {
  const withoutPrefix = fieldKey.substring(FIELD_KEY_PREFIX.length);

  let base64Part = withoutPrefix;
  for (const type of FieldTypeOptions) {
    if (withoutPrefix.endsWith(type)) {
      base64Part = withoutPrefix.substring(0, withoutPrefix.length - type.length);
      break;
    }
  }

  // Restore base64 padding: trailing '_' -> '='
  const restored = base64Part.replace(/_/g, "=");

  try {
    return Buffer.from(restored, "base64").toString("utf-8");
  } catch {
    return fieldKey;
  }
}

/**
 * Resolve a field value for display, handling different types and formatting as needed.
 * @param value The raw value to resolve.
 * @param type The field type to guide formatting (e.g. "ProcessHubFileUpload", "ProcessHubRadioButton", etc.)
 * @param instance The instance details, used for certain computed fields.
 * @param options Additional options for XLSX generation, including module code and language.
 * @returns The resolved display value, formatted according to type if provided.
 */
export function resolveFieldDisplayValue(value: FieldValueType | null | undefined, type: FieldType, instance: IInstanceDetails, options: IGenerateXLSXOptions): unknown {
  options.environment?.logger.debug(`Resolving display value for type "${type}" with raw value: ${toStr(JSON.stringify(value))}`);

  // --- Instance number field ---
  if (type === "ProcessHubInstanceNumber") {
    const num = instance?.instanceNumber;
    if (num == null) return "";
    const count = options.instanceCount ?? num;
    const year = instance.createdAt ? new Date(instance.createdAt).getFullYear() : null;
    if (options.module.name === "action" || options.module.name === "action_basic") {
      return year != null ? `${options.module.urlPrefix.toUpperCase()}${num}/${count}-${year}` : String(num);
    } else {
      return `${num}/${count}`;
    }
  }

  // --- Always empty string types ---
  if (type === "ProcessHubSignature") {
    return "";
  }

  if (type === "ProcessHubAuditQuestions") {
    return "";
  }

  // --- DateTime type ---
  if (type === "ProcessHubDateTime") {
    return formatDate(value as string);
  }

  // --- Date type ---
  if (type === "ProcessHubDate") {
    return formatDateOnly(value as string);
  }

  // --- Assessment cycle field (risk management module) ---
  if (type === "ProcessHubRiskAssessmentCycle" && (typeof value === "string" || typeof value === "number")) {
    return getAssessmentCycle(value, options.language);
  }

  // --- Number types ---
  if (type === "ProcessHubCalculatedField") {
    if (value == null || value === undefined) return "undefined";
    const num = Number(value);
    return isNaN(num) ? "undefined" : num;
  }

  if (type === "ProcessHubNumber") {
    if (value == null) return "";
    const num = Number(value);
    return isNaN(num) ? "" : num;
  }

  // --- String types ---
  if (type === "ProcessHubTextInput" || type === "ProcessHubInstanceTitle" || type === "ProcessHubRoleOwner" || type === "ProcessHubLabel" || type === "ProcessHubMail") {
    return toStr(value);
  }

  if (type === "ProcessHubTextArea") {
    return toStr(value)
      .replace(/<[^>]*>/g, "")
      .trim();
  }

  if (type === "ProcessHubDropdown") {
    if (value == null || value === undefined || toStr(value).trim() === "") return tl("keine Auswahl", options.language);
    return toStr(value);
  }

  // --- Array types ---
  if (Array.isArray(value)) {
    if (value.length === 0) return "";

    if (type === "ProcessHubFileUpload") {
      return (value as string[])
        .map((v) => {
          if (typeof v === "string") {
            const parts = v.split("/");
            const lastSegment = parts[parts.length - 1] || v;
            try {
              return Buffer.from(lastSegment, "base64").toString("utf-8");
            } catch {
              return decodeURIComponent(lastSegment);
            }
          }
          return toStr(v);
        })
        .join(", ");
    }

    if (type === "ProcessHubRoxFileLink") {
      return (value as IRoxFileLinkValue)
        .map((v) => v.roxFileName ?? "")
        .filter(Boolean)
        .join(", ");
    }

    return value.map((v) => (typeof v === "string" ? v : toStr(v))).join(", ");
  }

  // --- Object types ---
  if (typeof value === "object") {
    // DataTable: { columns: [...], rows: [{ data: { <columnKey>: cellValue> }, selected }] }
    if (type === "ProcessHubDataTable") {
      const data = value as IDataTableFieldValue;
      return data.rows
        .filter((row) => row.data && Object.keys(row.data).length > 0 && row.selected)
        .map((row) => Object.values(row.data)[0] ?? "")
        .map((cell) => toStr(cell))
        .join(", ");
    }

    // RadioButton: { radioButtons: [{ name }], selectedRadio: number }
    if (type === "ProcessHubRadioButton") {
      if (value != null && value !== undefined && "radioButtons" in value && "selectedRadio" in value) {
        const rb = value as IRadioButtonGroupFieldValue;
        const idx = rb.selectedRadio;
        if (idx != null && idx !== undefined && rb.radioButtons[idx] != null && rb.radioButtons[idx] !== undefined) return rb.radioButtons[idx].name;
      }
      return tl("keine Auswahl", options.language);
    }

    // Checklist / Decision: { [label: string]: boolean } – return checked labels
    if (type === "ProcessHubChecklist" || type === "ProcessHubDecision") {
      if (value != null && value !== undefined) {
        const checkedItems = Object.entries(value as Record<string, boolean>)
          .filter(([, checked]) => checked)
          .map(([key]) => key);
        if (checkedItems.length > 0) return checkedItems.join(", ");
      }
      return tl("keine Auswahl", options.language);
    }

    // TreeView: { entries: [{ name, checked, subItems }] } – collect all checked names recursively
    if (type === "ProcessHubTreeView") {
      if (value != null && value !== undefined && "entries" in value) {
        const collectChecked = (entries: ITreeViewEntry[]): string[] => {
          const result: string[] = [];
          for (const e of entries) {
            if (e.checked) result.push(e.name);
            result.push(...collectChecked(e.subItems));
          }
          return result;
        };
        const checked = collectChecked((value as ITreeViewFieldValue).entries);
        if (checked.length > 0) return checked.join(", ");
      }
      return tl("keine Auswahl", options.language);
    }

    // Tasks: { tasks: [{ checked, text }] }
    if (type === "ProcessHubTasks") {
      if (value != null && value !== undefined && "tasks" in value) {
        const tasks = (value as ITasksFieldValue).tasks;
        return tasks.map((t) => (t.checked ? `[x] ${t.text}` : `[ ] ${t.text}`)).join(", ");
      }
      return "";
    }

    // DateRange: { start: Date, end: Date }
    if (type === "ProcessHubDateRange") {
      if (value != null && value !== undefined && "start" in value && "end" in value) {
        const dr = value as IDateRangeFieldValue;
        const fmtDate = (d: Date | string | null | undefined): string => {
          if (!d) return "";
          const s = d instanceof Date ? d.toISOString() : String(d);
          return s.slice(0, 10);
        };
        return `${fmtDate(dr.start)} – ${fmtDate(dr.end)}`;
      }
      return "";
    }

    // SVGDropdown: { text: string, svgData: ... } - return text or "keine Auswahl"
    if (type === "ProcessHubSVGDropdown") {
      if (value != null && value !== undefined) {
        if ("text" in value) return (value as ISVGDropdownOption).text;
      }
      return tl("keine Auswahl", options.language);
    }

    // ProcessLink: { linkedInstances: [{ title?, instanceId }] }
    if (type === "ProcessHubProcessLink") {
      if (value != null && value !== undefined && "linkedInstances" in value) {
        const pl = value as IProcessLinkValue;
        return pl.linkedInstances.map((i) => i.title || i.instanceId).join(", ");
      }
      return "";
    }

    // RoxFile: { url?, ... }
    if (type === "ProcessHubRoxFile") {
      if (value != null && value !== undefined && "url" in value) {
        const url = (value as IRoxFileFieldValue).url;
        if (url === undefined) return "";
        const parts = url.split("/");
        const lastSegment = parts[parts.length - 1] || url;
        return decodeKey(lastSegment);
      }
      return "";
    }

    // Spreedsheet field: value is { url, label }
    if (type === "ProcessHubSpreadSheet") {
      if (value != null && value !== undefined && "url" in value) {
        const url = (value as ISpreadSheetFieldValue).url;
        const fullUrl = getBackendUrl() + url;
        return fullUrl;
      }
      return "";
    }
  }

  // Fallback: convert to string
  return toStr(value);
}

/**
 * Get the resolved value for a given field key from an instance.
 * @param instance The instance details object to resolve the field value from.
 * @param fieldKey The field key to resolve (e.g. "field_VGl0ZWw_ProcessHubTextInput", "lane_Lane_7A0DD19E05A33282", "state", etc.)
 * @returns The resolved value for the field key, checking fieldContents, roleOwners, direct properties, and computed fields.
 */
export function getResolvedValue(instance: IInstanceDetails, fieldKey: string, options: IGenerateXLSXOptions): unknown {
  options.environment?.logger.debug(`Resolving field key "${fieldKey}" for instance ${instance.instanceId}`);

  const fc = instance.extras?.fieldContents || {};
  const roleOwners = instance.extras?.roleOwners || {};
  const todos = instance.extras?.todos || [];

  // Field contents (extras.fieldContents with base64-encoded field keys)
  if (fieldKey.startsWith(FIELD_KEY_PREFIX)) {
    const fieldName = decodeFieldKey(fieldKey);
    const fieldValue = fc[fieldName];
    if (fieldValue !== undefined) {
      return resolveFieldDisplayValue(fieldValue.value, fieldValue.type, instance, options);
    }
    // Field absent from fieldContents – derive type from key suffix for correct default
    const withoutPrefix = fieldKey.substring(FIELD_KEY_PREFIX.length);
    for (const t of FieldTypeOptions) {
      if (withoutPrefix.endsWith(t)) {
        return resolveFieldDisplayValue(null, t, instance, options);
      }
    }
    return "";
  }

  // Risk dimension fields: dimensionvalue_<16-char-dimensionId><fieldNameBase64>
  //                        dimensiontext_<16-char-dimensionId><fieldNameBase64>
  if (fieldKey.startsWith(DIMENSIONVALUE_KEY_PREFIX) || fieldKey.startsWith(DIMENSIONTEXT_KEY_PREFIX)) {
    const isText = fieldKey.startsWith(DIMENSIONTEXT_KEY_PREFIX);
    const rest = fieldKey.substring(isText ? DIMENSIONTEXT_KEY_PREFIX.length : DIMENSIONVALUE_KEY_PREFIX.length);
    const dimensionId = rest.substring(0, 16);
    // Find the latest riskAssessment for this fieldName (last entry wins)
    const assessments = instance.riskAssessments ?? [];
    const first = assessments[0];
    if (!first) return "";
    const val = first.assessments[dimensionId];
    if (val == null) return "";
    if (isText) {
      const keyIndex = Object.keys(first.assessments).indexOf(dimensionId);
      if (keyIndex === 1) return getRiskManagementImpact(val, options.language);
      return getRiskManagementProbability(val, options.language);
    }
    return val;
  }

  // Lane/role owner fields
  if (fieldKey.startsWith(LANE_KEY_PREFIX)) {
    const laneId = fieldKey.replace(LANE_KEY_PREFIX, "");
    const owners = roleOwners[laneId];
    return owners && owners.length > 0 ? owners.map((o) => o.displayName || o.memberId).join(", ") : "";
  }

  // Computed/virtual fields
  if (fieldKey === DefaultColumns.id.field) return instance.instanceId.toLowerCase();
  if (fieldKey === DefaultColumns.state.field) return stateToString(instance.state ?? undefined, options);
  if (fieldKey === DefaultColumns.createdAt.field) return formatDate(instance.createdAt);
  if (fieldKey === DefaultColumns.createdAtDate.field) return formatDateOnly(instance.createdAt);
  if (fieldKey === DefaultColumns.completedAt.field) return formatDate(instance.completedAt);
  if (fieldKey === DefaultColumns.completedAtDate.field) return formatDateOnly(instance.completedAt);
  if (fieldKey === DefaultColumns.todos.field) return todos.map((t) => t.displayName || t.bpmnTaskId).join(", ");
  if (fieldKey === DefaultColumns.startEvent.field) return instance.takenStartEvent;
  if (fieldKey === DefaultColumns.endEvent.field) return (instance.reachedEndEvents || []).join(", ");
  if (fieldKey === DefaultColumns.riskTitle.field) return instance.title;
  if (fieldKey === DefaultColumns.openAssessments.field) {
    const assessments = instance.extras.todos
      ?.filter((todo) => todo.data.isAssessmentTodo)
      .map((todo) => todo.displayName)
      .join(", ");
    return assessments ?? "";
  }

  // Base64-encoded field format): base64(<UUID><fieldName>)
  // Used by ProcessHub views for risk assessment dimension columns
  {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    try {
      const decoded = Buffer.from(fieldKey, "base64").toString("utf-8");
      const uuidMatch = decoded.match(UUID_REGEX);
      if (uuidMatch) {
        const fieldKey = uuidMatch[0];
        if (fieldKey === DefaultColumns.riskMetric.field || fieldKey === DefaultColumns.riskMetricText.field) {
          const riskAssessments = instance.riskAssessments ?? [];
          if (riskAssessments.length === 0) return "";
          const assessmentValues = Object.values(riskAssessments[0].assessments);
          if (fieldKey === DefaultColumns.riskMetricText.field) {
            return getRiskManagementRPZName(assessmentValues[0] * assessmentValues[1], options.language);
          } else if (fieldKey === DefaultColumns.riskMetric.field) {
            return getRiskManagementRPZ(assessmentValues[0] * assessmentValues[1]);
          }
        } else if (fieldKey === DefaultColumns.auditMetric.field) {
          const auditMetric = instance.auditMetric;
          if (auditMetric == null) return "";
          return Math.round(auditMetric * 100);
        } else if (fieldKey === DefaultColumns.auditMetricText.field) {
          const auditMetric = instance.auditMetric;
          if (auditMetric == null) return "";
          const auditMetricCategory = options.auditsSettings?.auditMetricCategories.find(({ from, to }) => auditMetric <= to && auditMetric >= from);
          return auditMetricCategory?.label ?? "";
        }
      }
    } catch {
      // Not a valid base64 string, ignore and treat as normal field key
    }
  }

  // Risk trend field: compute trend and color based on latest two assessments
  if (fieldKey === DefaultColumns.riskTrend.field || fieldKey === DefaultColumns.riskTrend.field + encodeKey(options.module.title)) {
    const riskAssessments = instance.riskAssessments ?? [];
    if (riskAssessments.length > 1) {
      const latest = riskAssessments[0];
      const previous = riskAssessments[1];
      const latestValues = Object.values(latest.assessments);
      const previousValues = Object.values(previous.assessments);

      const value = latestValues[0] * latestValues[1] - previousValues[0] * previousValues[1];
      const trendColor: RiskTrendColors = +value < 0 ? "green" : +value > 0 ? "red" : "yellow";

      if (fieldKey === DefaultColumns.riskTrend.field) {
        return {
          trend: value,
          color: riskTrendToHexColor(trendColor),
        };
      } else {
        return value;
      }
    }
  }

  // Direct instance properties as fallback
  const fieldValue = instance[fieldKey as keyof IInstanceDetails];
  return fieldValue ?? "";
}

/**
 * Return a date with out time
 * @param date The input date which may be a Date object, an ISO string, or null/undefined.
 * @returns A Date object with time set to 00:00:00, or null if input is null/undefined.
 */
export function formatDateOnly(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Return a date with time
 * @param date The input date which may be a Date object, an ISO string, or null/undefined.
 * @returns A Date object with time included (time set to 00:00:00 if original value was date-only), or null if input is null/undefined.
 */
export function formatDate(date: Date | string | null | undefined): Date | null {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
}

function stateToString(state: State | undefined, options: IGenerateXLSXOptions): string {
  const language = options.language ?? "de";
  if (options.module.name === "risks") {
    switch (state) {
      case State.Running:
        return tl("Aktiv", language, "risks");
      case State.Finished:
        return tl("Inaktiv", language, "risks");
      default:
        return "";
    }
  }
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

function getAssessmentCycle(value: number | string, language: string): string {
  const num = typeof value === "number" ? value : parseInt(value, 10);
  if (isNaN(num)) return toStr(value);
  switch (num) {
    case 1:
      return tl("Monatlich", language, "risks");
    case 2:
      return tl("Quartalsweise", language, "risks");
    case 3:
      return tl("Halbjährlich", language, "risks");
    case 4:
      return tl("Jährlich", language, "risks");
    case 5:
      return tl("Zweijährig", language, "risks");
    default:
      return toStr(value);
  }
}

function getRiskManagementRPZName(value: number | string, language: string): string {
  const num = typeof value === "number" ? value : parseInt(value, 10);
  if (isNaN(num)) return toStr(value);
  if (num >= 1 && num <= 2) {
    return tl("unkritisch", language, "risks");
  } else if (num >= 3 && num <= 4) {
    return tl("eher unkritisch", language, "risks");
  } else if (num >= 5 && num <= 10) {
    return tl("mittel", language, "risks");
  } else if (num >= 11 && num <= 19) {
    return tl("eher kritisch", language, "risks");
  } else if (num >= 20 && num <= 25) {
    return tl("kritisch", language, "risks");
  } else {
    return toStr(value);
  }
}

function getRiskManagementRPZ(value: number): IRiskManagementRPZ {
  const num = typeof value === "number" ? value : parseInt(value, 10);
  if (isNaN(num)) return { value: 0, color: "#FFFFFF" };
  if (num >= 1 && num <= 2) {
    return { value: value, color: "#007f00" };
  } else if (num >= 3 && num <= 4) {
    return { value: value, color: "#80AB00" };
  } else if (num >= 5 && num <= 10) {
    return { value: value, color: "#FFD700" };
  } else if (num >= 11 && num <= 19) {
    return { value: value, color: "#E0750E" };
  } else if (num >= 20 && num <= 25) {
    return { value: value, color: "#C1121C" };
  } else {
    return { value: value, color: "#FFFFFF" };
  }
}

export function getRiskManagementProbability(value: number | string, language: string): string {
  const num = typeof value === "number" ? value : parseInt(value, 10);
  if (isNaN(num)) return toStr(value);
  switch (num) {
    case 1:
      return tl("sehr gering", language, "risks");
    case 2:
      return tl("gering", language, "risks");
    case 3:
      return tl("mittel", language, "risks");
    case 4:
      return tl("hoch", language, "risks");
    case 5:
      return tl("sehr hoch", language, "risks");
    default:
      return toStr(value);
  }
}

export function getRiskManagementImpact(value: number | string, language: string): string {
  const num = typeof value === "number" ? value : parseInt(value, 10);
  if (isNaN(num)) return toStr(value);
  switch (num) {
    case 1:
      return tl("unbedeutend", language, "risks");
    case 2:
      return tl("begrenzt", language, "risks");
    case 3:
      return tl("kritisch", language, "risks");
    case 4:
      return tl("katastrophal", language, "risks");
    case 5:
      return tl("sehr katastrophal", language, "risks");
    default:
      return toStr(value);
  }
}

export function riskTrendToHexColor(riskTrendColor: RiskTrendColors): string {
  switch (riskTrendColor) {
    case "red":
      return "#ff7e67";
    case "orange":
      return "#f2711c";
    case "green":
      return "#7ae08b";
    case "olive":
      return "#b5cc18";
    case "yellow":
      return "#f5e15d";
  }
}

/**
 * Convert a value to string for comparison in filters.
 * @param value The value to convert to string.
 * @returns The string representation of the value, or empty string for null/undefined.
 */
export function toStr(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return value.toString();
  return JSON.stringify(value);
}

export function getFieldKey(fieldName: string, fieldType: FieldType): string {
  const base64 = Buffer.from(fieldName, "utf-8").toString("base64").replace(/=/g, "_");
  return `${FIELD_KEY_PREFIX}${base64}${fieldType}`;
}

export function getLaneKey(laneId: string): string {
  return `${LANE_KEY_PREFIX}${laneId}`;
}

export function encodeKey(key: string): string {
  return Buffer.from(key, "utf-8").toString("base64").replace(/=/g, "_");
}

export function decodeKey(encoded: string): string {
  const restored = encoded.replace(/_/g, "=");
  try {
    return Buffer.from(restored, "base64").toString("utf-8");
  } catch {
    return encoded;
  }
}
