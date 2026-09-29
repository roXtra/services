import { IUserFieldsConfig } from "processhub-sdk/lib/config.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IRoleOwnerMap } from "processhub-sdk/lib/process/processrights.js";

function filterValueToText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "";
  return JSON.stringify(value) ?? "";
}

function serializeFilterString(value: unknown): string {
  return JSON.stringify(filterValueToText(value)) ?? '""';
}

export function quoteFilterPlaceholderValues(
  filter: string,
  process: BpmnProcess,
  instance: IInstanceDetails,
  roleOwners: IRoleOwnerMap,
  userFieldsConfig: IUserFieldsConfig,
): string {
  let safeFilter = filter.replace(/instance\['([^'\]]*)'\]/g, (placeholder, key: string) => {
    if (!key) return placeholder;
    const value = key === "instanceId" ? instance.instanceId.toLowerCase() : (instance as unknown as Record<string, unknown>)[key];
    return serializeFilterString(value);
  });

  const lanes = process.getLanes(false);
  const getRoleOwner = (roleName: string) => {
    const laneId = lanes.find((lane) => lane.name === roleName)?.id;
    return laneId ? roleOwners[laneId]?.[0] : undefined;
  };

  safeFilter = safeFilter.replace(/role\['([^'\]]*)'\]\.fields\.([a-zA-Z0-9]+)?/g, (placeholder) => {
    const [, roleName, fieldId] = /^role\['([^'\]]*)'\]\.fields\.([a-zA-Z0-9]+)?$/.exec(placeholder) ?? [];
    if (roleName === undefined || fieldId === undefined) return serializeFilterString("");
    const userFields = (getRoleOwner(roleName)?.user as unknown as { fields?: Record<string, unknown> } | undefined)?.fields;
    const rawValue = userFields?.[fieldId];
    let value = filterValueToText(rawValue);
    const userField = userFieldsConfig.fields.find((field) => field.id === fieldId);
    if (userField?.type === "select") {
      value = userField.fieldvalueswithcaption?.find((fieldValue) => fieldValue.value === value)?.caption ?? value;
    }
    return serializeFilterString(value);
  });

  safeFilter = safeFilter.replace(/[{]\s?role\[['"]?(.+?)['"]?\][\s]?[}]/g, (placeholder) => {
    const [, roleName] = /^[{]\s?role\[['"]?(.+?)['"]?\][\s]?[}]$/.exec(placeholder) ?? [];
    return serializeFilterString(roleName === undefined ? "" : getRoleOwner(roleName)?.displayName);
  });

  return safeFilter.replace(/role\['([^'\]]*)'\](?:\.(firstName|lastName|displayName|mail))?/g, (placeholder) => {
    const [, roleName, property] = /^role\['([^'\]]*)'\](?:\.(firstName|lastName|displayName|mail))?$/.exec(placeholder) ?? [];
    if (roleName === undefined) return serializeFilterString("");
    const owner = getRoleOwner(roleName);
    const user = owner?.user as unknown as Record<string, unknown> | undefined;
    const value = property && user ? user[property] : owner?.displayName;
    return serializeFilterString(value);
  });
}
