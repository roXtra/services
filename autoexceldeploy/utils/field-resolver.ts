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
      return fieldValue.value ?? "";
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
    if (!instance.createdAt) return "";
    const d = instance.createdAt instanceof Date ? instance.createdAt.toISOString() : String(instance.createdAt);
    return d.slice(0, 10);
  }
  if (fieldKey === "completedAt") return instance.completedAt ?? "";
  if (fieldKey === "completedAtDate") {
    if (!instance.completedAt) return "";
    const d = instance.completedAt instanceof Date ? instance.completedAt.toISOString() : String(instance.completedAt);
    return d.slice(0, 10);
  }
  if (fieldKey === "todos") return todos.map((t) => t.displayName || t.bpmnTaskId).join(", ");
  if (fieldKey === "idLowercase") return instance.instanceId?.toLowerCase() ?? "";
  if (fieldKey === "title") return instance.title ?? "";

  return instance[fieldKey as keyof IInstanceDetails] ?? "";
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
