import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";

/**
 * Decode field key from view column format.
 * Format: field_<base64(fieldName)><fieldType>
 * Base64 padding '=' is replaced with '_' in the column field.
 * Example: field_VGl0ZWw_ProcessHubTextInput -> "Titel"
 */
export function decodeFieldKey(fieldKey: string): string {
  // Strip "field_" prefix
  const withoutPrefix = fieldKey.substring("field_".length);

  // Known field type suffixes
  const knownTypes = [
    "ProcessHubFileUpload",
    "ProcessHubTextInput",
    "ProcessHubTextArea",
    "ProcessHubDate",
    "ProcessHubDateTime",
    "ProcessHubDropdown",
    "ProcessHubNumericInput",
    "ProcessHubChecklist",
    "ProcessHubRiskAssessment",
    "ProcessHubSignature",
    "ProcessHubRoleOwner",
  ];

  let base64Part = withoutPrefix;
  for (const type of knownTypes) {
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

export function getResolvedValue(instance: IInstanceDetails, fieldKey: string, environment?: IServiceTaskEnvironment): unknown {
  const fc = instance.extras?.fieldContents || {};
  const roleOwners = instance.extras?.roleOwners || {};
  const todos = instance.extras?.todos || [];

  if (fieldKey.startsWith("field_")) {
    const fieldName = decodeFieldKey(fieldKey);
    const fieldValue = fc[fieldName];
    environment?.logger.debug(`Resolving field value for instance ${instance.instanceId}: field ${fieldName} with raw value ${toStr(fieldValue?.value)}`);
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

export function toStr(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return val.toString();
  return JSON.stringify(val);
}
