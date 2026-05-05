import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { getResolvedValue, toStr } from "./utilize.js";

interface IGridFilterCondition {
  field: string;
  operator: string;
  value: string;
}

interface IGridFilterGroup {
  logic: "and" | "or";
  filters: (IGridFilterCondition | IGridFilterGroup)[];
}

type IGridFilterEntry = IGridFilterCondition | IGridFilterGroup;

export function isFilterGroup(entry: IGridFilterEntry): entry is IGridFilterGroup {
  return "logic" in entry && "filters" in entry;
}

interface ISort {
  field: string;
  dir: "asc" | "desc";
}

export interface IGridOptions {
  filter?: IGridFilterGroup;
  sort?: ISort[];
  skip?: number;
  take?: number;
}

/**
 * Apply the gridOptions filter to instances.
 * Supports recursive nested filter groups with "and"/"or" logic.
 */
export function applyViewFilters(instances: IInstanceDetails[], filterGroup: IGridFilterGroup, environment: IServiceTaskEnvironment): IInstanceDetails[] {
  return instances.filter((instance) => evaluateFilterGroup(instance, filterGroup, environment));
}

/**
 * Recursively evaluate a filter group (and/or) against an instance.
 */
function evaluateFilterGroup(instance: IInstanceDetails, group: IGridFilterGroup, environment: IServiceTaskEnvironment): boolean {
  const results = group.filters.map((entry) => {
    if (isFilterGroup(entry)) {
      return evaluateFilterGroup(instance, entry, environment);
    }
    // It's a condition
    const fieldKey = entry.field;
    const value = getResolvedValue(instance, fieldKey, environment);
    environment.logger.debug(
      `Evaluating filter on instance ${instance.instanceId}: field ${fieldKey} with value ${toStr(value)} against condition ${entry.operator} ${toStr(entry.value)}`,
    );
    const matchValue = matchesFilter(value, entry);
    environment.logger.debug(`Filter condition result: ${matchValue}`);
    return matchValue;
  });

  if (group.logic === "or") {
    return results.some((r) => r);
  }
  // Default: "and"
  return results.every((r) => r);
}

function matchesFilter(value: unknown, filter: IGridFilterCondition): boolean {
  const filterValue = filter.value;
  const cmpValue = toStr(value).toLocaleLowerCase();
  const cmpFilter = toStr(filterValue).toLocaleLowerCase();
  switch (filter.operator) {
    case "eq":
      return cmpValue === cmpFilter;
    case "neq":
      return cmpValue !== cmpFilter;
    case "contains":
      return cmpValue.includes(cmpFilter);
    case "doesnotcontain":
      return !cmpValue.includes(cmpFilter);
    case "startswith":
      return cmpValue.startsWith(cmpFilter);
    case "endswith":
      return cmpValue.endsWith(cmpFilter);
    case "isnull":
    case "isempty":
      return !value || value === undefined || cmpValue === "" || (Array.isArray(value) && value.length === 0);
    case "isnotnull":
    case "isnotempty":
      return !!value && value !== undefined && cmpValue !== "" && (!Array.isArray(value) || value.length > 0);
    case "gt":
      return Number(value) > Number(filterValue);
    case "gte":
      return Number(value) >= Number(filterValue);
    case "lt":
      return Number(value) < Number(filterValue);
    case "lte":
      return Number(value) <= Number(filterValue);
    default:
      return true;
  }
}
