import { FieldTypeOptions } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";

/**
 * Get the resolved value for a given field key from an instance.
 * @param fieldKey The field key to resolve (e.g. "field_VGl0ZWw_ProcessHubTextInput", "lane_Lane_7A0DD19E05A33282", "state", etc.)
 * @returns The resolved value for the field key, checking fieldContents, roleOwners, direct properties, and computed fields.
 */
export function decodeFieldKey(fieldKey: string): string {
  // Strip "field_" prefix
  const withoutPrefix = fieldKey.substring("field_".length);

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
 * @param type Optional field type to guide formatting (e.g. "ProcessHubFileUpload", "ProcessHubRadioButton", etc.)
 * @returns The resolved display value, formatted according to type if provided.
 */
export function resolveFieldDisplayValue(value: unknown, type?: string): unknown {
  if (value == null) return "";

  if (typeof value === "string") {
    if (type === "ProcessHubTextArea") return value.replace(/<[^>]*>/g, "").trim();
    return value;
  }

  // Primitives pass through unchanged (important for numeric / date sort comparisons)
  if (typeof value === "number" || typeof value === "boolean" || value instanceof Date) {
    return value;
  }

  // --- Array types ---
  if (Array.isArray(value)) {
    if (value.length === 0) return "";

    if (type === "ProcessHubFileUpload") {
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

  // --- Object types ---
  if (typeof value !== "object" || value === null) return toStr(value);

  // RadioButton: { radioButtons: [{ name }], selectedRadio: number }
  if (type === "ProcessHubRadioButton" && "radioButtons" in value && "selectedRadio" in value) {
    const rb = value as { radioButtons: Array<{ name?: string } | undefined>; selectedRadio: number | undefined };
    const idx = rb.selectedRadio;
    if (idx != null && rb.radioButtons[idx] != null) return rb.radioButtons[idx]?.name ?? "";
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
  if (type === "ProcessHubSignature") return "";

  return toStr(value);
}

/**
 * Get the resolved value for a given field key from an instance.
 * @param instance The instance details object to resolve the field value from.
 * @param fieldKey The field key to resolve (e.g. "field_VGl0ZWw_ProcessHubTextInput", "lane_Lane_7A0DD19E05A33282", "state", etc.)
 * @returns The resolved value for the field key, checking fieldContents, roleOwners, direct properties, and computed fields.
 */
export function getResolvedValue(instance: IInstanceDetails, fieldKey: string): unknown {
  const fc = instance.extras?.fieldContents || {};
  const roleOwners = instance.extras?.roleOwners || {};
  const todos = instance.extras?.todos || [];

  if (fieldKey.startsWith("field_")) {
    const fieldName = decodeFieldKey(fieldKey);
    const fieldValue = fc[fieldName];
    if (fieldValue !== undefined) {
      return resolveFieldDisplayValue(fieldValue.value, fieldValue.type);
    }
    return "";
  }

  if (fieldKey.startsWith("lane_")) {
    const laneId = fieldKey.replace("lane_", "");
    const owners = roleOwners[laneId];
    return owners && owners.length > 0 ? owners.map((o) => o.displayName || o.memberId).join(", ") : "";
  }

  if (fieldKey === "state") return instance.state ?? 0;
  if (fieldKey === "createdAt") return instance.createdAt ?? "";
  if (fieldKey === "createdAtDate") {
    return formatDateOnly(instance.createdAt);
  }
  if (fieldKey === "completedAt") return instance.completedAt ?? "";
  if (fieldKey === "completedAtDate") {
    return formatDateOnly(instance.completedAt);
  }
  if (fieldKey === "todos") return todos.map((t) => t.displayName || t.bpmnTaskId).join(", ");
  if (fieldKey === "idLowercase") return instance.instanceId?.toLowerCase() ?? "";
  if (fieldKey === "title") return instance.title ?? "";

  const fieldValue = instance[fieldKey as keyof IInstanceDetails];
  if (fieldValue instanceof Date) return fieldValue.toISOString();
  return fieldValue ?? "";
}

/**
 * Return a date with out time
 */
export function formatDateOnly(date: Date | string | null | undefined): Date {
  if (!date) return new Date(NaN);
  const d = date instanceof Date ? date : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
