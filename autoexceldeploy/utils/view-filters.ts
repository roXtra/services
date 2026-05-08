import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { getResolvedValue, toStr } from "./field-resolver.js";

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

// Type guard to check if a filter entry is a group (has logic and filters) or a condition
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
 * @param instances The list of instances to filter.
 * @param filterGroup The filter group containing conditions and logic.
 * @returns The filtered list of instances that match the filter group conditions.
 */
export function applyViewFilters(instances: IInstanceDetails[], filterGroup: IGridFilterGroup): IInstanceDetails[] {
  return instances.filter((instance) => evaluateFilterGroup(instance, filterGroup));
}

/**
 * Recursively evaluate a filter group (and/or) against an instance.
 * @param instance The instance to evaluate.
 * @param group The filter group to evaluate.
 * @return True if the instance matches the filter group, false otherwise.
 */
function evaluateFilterGroup(instance: IInstanceDetails, group: IGridFilterGroup): boolean {
  if (group.filters.length === 0) {
    return true;
  }

  const results = group.filters.map((entry) => {
    if (isFilterGroup(entry)) {
      return evaluateFilterGroup(instance, entry);
    }
    const fieldKey = entry.field;
    const value = getResolvedValue(instance, fieldKey);
    const matchValue = matchesFilter(value, entry);
    return matchValue;
  });

  if (group.logic === "or") {
    return results.some((r) => r);
  }
  // Default: "and"
  return results.every((r) => r);
}

/**
 * Evaluate a single filter condition against a value.
 * @param value The value to evaluate.
 * @param filter The filter condition to apply.
 * @returns True if the value matches the filter condition, false otherwise.
 */
function matchesFilter(value: unknown, filter: IGridFilterCondition): boolean {
  const filterValue = filter.value;
  const cmpValue = toStr(value).toLocaleLowerCase();
  const cmpFilter = toStr(filterValue).toLocaleLowerCase();
  const numericValue = toComparableNumber(value);
  // For date-only filter strings (YYYY-MM-DD), lte/gt must use end-of-day so
  // that instances timestamped during that day are included correctly.
  const dateOnlyFilter = /^\d{4}-\d{2}-\d{2}$/.test(toStr(filterValue).trim());
  const numericFilter = dateOnlyFilter && (filter.operator === "lte" || filter.operator === "gt") ? toEndOfDay(toStr(filterValue).trim()) : toComparableNumber(filterValue);
  switch (filter.operator) {
    case "eq":
      // Date-only eq: compare truncated-to-day timestamps
      if (dateOnlyFilter && numericValue !== null) {
        return toStartOfDay(numericValue) === toComparableNumber(filterValue);
      }
      return cmpValue === cmpFilter;
    case "neq":
      if (dateOnlyFilter && numericValue !== null) {
        return toStartOfDay(numericValue) !== toComparableNumber(filterValue);
      }
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
      return numericValue !== null && numericFilter !== null && numericValue > numericFilter;
    case "gte":
      return numericValue !== null && numericFilter !== null && numericValue >= numericFilter;
    case "lt":
      return numericValue !== null && numericFilter !== null && numericValue < numericFilter;
    case "lte":
      return numericValue !== null && numericFilter !== null && numericValue <= numericFilter;
    default:
      return true;
  }
}

function toComparableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return stripMilliseconds(value.getTime());
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    const parsedDate = Date.parse(trimmed);
    if (Number.isFinite(parsedDate)) {
      return stripMilliseconds(parsedDate);
    }
  }

  return null;
}

function stripMilliseconds(timestamp: number): number {
  return Math.floor(timestamp / 1000) * 1000;
}

/** Returns the start-of-day (00:00:00.000 UTC) timestamp for a given ms timestamp. */
function toStartOfDay(timestamp: number): number {
  return Math.floor(timestamp / 86_400_000) * 86_400_000;
}

/** Parses a YYYY-MM-DD string and returns end-of-day (23:59:59.999 UTC) as a stripped timestamp. */
function toEndOfDay(dateStr: string): number | null {
  const base = Date.parse(dateStr);
  if (!Number.isFinite(base)) return null;
  return stripMilliseconds(base + 86_400_000 - 1);
}
