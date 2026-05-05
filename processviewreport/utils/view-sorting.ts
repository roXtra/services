import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { IGridOptions } from "./view-filters.js";
import { getResolvedValue, toStr } from "./field-resolver.js";

/**
 * Apply sorting from gridOptions.
 */
export function applyViewSorting(instances: IInstanceDetails[], gridOptions: IGridOptions): IInstanceDetails[] {
  const sort = gridOptions.sort;
  if (!Array.isArray(sort) || sort.length === 0) return instances;

  return [...instances].sort((a, b) => {
    for (const s of sort) {
      const field = s.field;
      const dir = s.dir || "asc";
      if (!field) continue;

      const valA = getResolvedValue(a, field);
      const valB = getResolvedValue(b, field);

      let cmp = 0;
      // Date comparison
      if (valA instanceof Date && valB instanceof Date) {
        cmp = valA.getTime() - valB.getTime();
      } else if (typeof valA === "string" && typeof valB === "string" && (field.includes("At") || field.includes("Date"))) {
        // Try date parsing for date-like fields
        const dA = new Date(valA).getTime();
        const dB = new Date(valB).getTime();
        if (!isNaN(dA) && !isNaN(dB)) {
          cmp = dA - dB;
        } else {
          cmp = valA.localeCompare(valB, "de-DE");
        }
      } else if (typeof valA === "number" && typeof valB === "number") {
        cmp = valA - valB;
      } else {
        const strA = toStr(valA);
        const strB = toStr(valB);
        cmp = strA.localeCompare(strB, "de-DE");
      }

      if (cmp !== 0) return dir === "desc" ? -cmp : cmp;
    }
    return 0;
  });
}
