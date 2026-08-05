import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IInstanceDetails, InstanceExtras } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IProcessDetails, ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools.js";

/**
 * Escape a string so it can be used safely inside a regular expression.
 * @param value The string to escape.
 * @returns The escaped string.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert a filter value into a JavaScript literal string for expression evaluation.
 * @param value The value to serialize.
 * @returns The serialized filter value.
 */
function serializeFilterValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "undefined";
  }

  if (typeof value === "string") {
    return `'${value.replace(/'/g, "\\'")}'`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

/**
 * Evaluate a filter expression for a single instance.
 * Field placeholders like field['Name'] are resolved before execution.
 * @param filter The filter expression to evaluate.
 * @param instance The instance to test.
 * @returns True when the instance matches the filter.
 */
function evaluateFilter(filter: string | undefined, instance: IInstanceDetails): boolean {
  if (!filter?.trim()) {
    return true;
  }

  const fieldReferences = Array.from(filter.matchAll(/field\[['"]([^'"]+)['"]\]/g), (match) => match[1]);
  const resolvedValues = fieldReferences.map((fieldName) => serializeFilterValue(instance.extras?.fieldContents?.[fieldName]?.value));
  let resolvedFilter = filter;

  fieldReferences.forEach((fieldName, index) => {
    resolvedFilter = resolvedFilter.replace(new RegExp(`field\\[['"]${escapeRegExp(fieldName)}['"]\\]`, "g"), resolvedValues[index]);
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
    return Boolean(Function(`return (${resolvedFilter});`)());
  } catch (error) {
    throw new Error(`FILTER_ERROR: ${filter} Error: ${String(error)}`);
  }
}

/**
 * Format a resolved placeholder value as a string for expression replacement.
 * @param value The resolved value.
 * @returns The string representation of the value.
 */
function formatExpressionValue(value: unknown): string {
  if (typeof value === "number") {
    return String(value);
  }

  if (value === undefined || value === null) {
    return "";
  }

  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(value);
}

// Funktionen zum zählen der Instanzen, die in einem bestimmten Zeitraum erstellt wurden
/**
 * Count all matched instances regardless of creation date.
 * @param instances The list of instances to count.
 * @param filterEvaluator A predicate to include instances.
 * @returns The total number of matching instances.
 */
function getTotalNumberOfInstances(instances: IInstanceDetails[], filterEvaluator: (instance: IInstanceDetails) => boolean): number {
  return instances.reduce((count, instance) => {
    if (instance.createdAt === undefined) {
      throw new Error(`createdAt is undefined for instance ${instance.instanceId}, cannot proceed with service!`);
    }

    return filterEvaluator(instance) ? count + 1 : count;
  }, 0);
}

/**
 * Count matching instances created in a specific year.
 * @param instances The list of instances to count.
 * @param year The target year to match.
 * @param filterEvaluator A predicate to include instances.
 * @returns The number of matching instances in the year.
 */
function getNumberOfInstancesOfSpecificYear(instances: IInstanceDetails[], year: number, filterEvaluator: (instance: IInstanceDetails) => boolean): number {
  return instances.reduce((count, instance) => {
    if (instance.createdAt === undefined) {
      throw new Error(`createdAt is undefined for instance ${instance.instanceId}, cannot proceed with service!`);
    }

    return new Date(instance.createdAt).getFullYear() === year && filterEvaluator(instance) ? count + 1 : count;
  }, 0);
}

/**
 * Count matching instances created in a specific month.
 * @param instances The list of instances to count.
 * @param year The target year to match.
 * @param month The target month to match.
 * @param filterEvaluator A predicate to include instances.
 * @returns The number of matching instances in the month.
 */
function getNumberOfInstancesOfSpecificMonth(instances: IInstanceDetails[], year: number, month: number, filterEvaluator: (instance: IInstanceDetails) => boolean): number {
  return instances.reduce((count, instance) => {
    if (instance.createdAt === undefined) {
      throw new Error(`createdAt is undefined for instance ${instance.instanceId}, cannot proceed with service!`);
    }

    const date = new Date(instance.createdAt);

    return date.getFullYear() === year && date.getMonth() === month && filterEvaluator(instance) ? count + 1 : count;
  }, 0);
}

/**
 * Count matching instances created on a specific day.
 * @param instances The list of instances to count.
 * @param year The target year to match.
 * @param month The target month to match.
 * @param day The target day to match.
 * @param filterEvaluator A predicate to include instances.
 * @returns The number of matching instances on the day.
 */
function getNumberOfInstancesOfSpecificDay(
  instances: IInstanceDetails[],
  year: number,
  month: number,
  day: number,
  filterEvaluator: (instance: IInstanceDetails) => boolean,
): number {
  return instances.reduce((count, instance) => {
    if (instance.createdAt === undefined) {
      throw new Error(`createdAt is undefined for instance ${instance.instanceId}, cannot proceed with service!`);
    }

    const date = new Date(instance.createdAt);

    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day && filterEvaluator(instance) ? count + 1 : count;
  }, 0);
}

// Auflösen der Variablen in der Ausdruckslogik
/**
 * Resolve placeholders inside the expression string and replace them with actual values.
 * Supports JavaScript expressions inside ${...} blocks.
 * @param expression The template expression to resolve.
 * @param dailyInstanceNumber The count of matching instances for the current day.
 * @param monthlyInstanceNumber The count of matching instances for the current month.
 * @param yearlyInstanceNumber The count of matching instances for the current year.
 * @param totalInstanceNumber The total count of matching instances.
 * @param instanceYear The current instance year.
 * @param instanceMonth The current instance month.
 * @param instanceDay The current instance day.
 * @returns The resolved string with placeholder values inserted.
 */
function resolveExpressionLogic(
  expression: string,
  dailyInstanceNumber: number,
  monthlyInstanceNumber: number,
  yearlyInstanceNumber: number,
  totalInstanceNumber: number,
  instanceYear: number,
  instanceMonth: number,
  instanceDay: number,
): string {
  const template = expression || "";

  if (!template.trim()) {
    throw new Error("EXPRESSION_ERROR: Expression is empty, cannot proceed with service!");
  }

  const variables: Record<string, string | number> = {
    dailyInstanceNumber,
    monthlyInstanceNumber,
    yearlyInstanceNumber,
    totalInstanceNumber,
    instanceYear,
    instanceMonth,
    instanceDay,
  };

  return template.replace(/\$\{([^}]+)\}/g, (match: string, expressionCode: string) => {
    const expressionCodeTrimmed = expressionCode.trim();

    if (!expressionCodeTrimmed) {
      throw new Error("EXPRESSION_ERROR: Expression placeholder is empty, cannot proceed with service!");
    }

    try {
      const argNames = Object.keys(variables);
      const argValues = Object.values(variables);

      // Require that the placeholder references at least one allowed variable
      // to avoid allowing arbitrary expressions that don't use any provided data.
      const varPattern = new RegExp(`\\b(${argNames.map((n) => escapeRegExp(n)).join("|")})\\b`);
      if (!varPattern.test(expressionCodeTrimmed)) {
        throw new Error(`EXPRESSION_ERROR: Expression placeholder must reference at least one of: ${argNames.join(", ")}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const rawExprFn = Function(...argNames, `return (${expressionCodeTrimmed});`);
      const exprFn = rawExprFn as (...args: unknown[]) => unknown;
      const value = exprFn(...(argValues as unknown[]));
      return formatExpressionValue(value);
    } catch (error) {
      throw new Error(`EXPRESSION_ERROR: Unable to resolve expression placeholder: ${expressionCodeTrimmed} Error: ${String(error)}`);
    }
  });
}

export async function serviceLogic(
  processDetails: IProcessDetails,
  environment: IServiceTaskEnvironment,
  targetField: string,
  expression: string,
  filter?: string,
): Promise<void> {
  const instances = await environment.instances.getAllInstancesForProcess(processDetails.processId, InstanceExtras.None);

  if (instances === undefined) {
    throw new Error("instances are undefined, cannot proceed with service!");
  }
  if (environment.instanceDetails.createdAt === undefined) {
    throw new Error("instanceDetails.createdAt is undefined, cannot proceed with service!");
  }
  if (environment.instanceDetails.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  const instanceYear = environment.instanceDetails.createdAt.getFullYear();
  const instanceMonth = environment.instanceDetails.createdAt.getMonth();
  const instanceDay = environment.instanceDetails.createdAt.getDate();
  const filterEvaluator = (instance: IInstanceDetails) => evaluateFilter(filter, instance);
  const dailyInstanceNumber = expression.includes("{dailyInstanceNumber}")
    ? getNumberOfInstancesOfSpecificDay(instances, instanceYear, instanceMonth, instanceDay, filterEvaluator)
    : 0;
  const monthlyInstanceNumber = expression.includes("{monthlyInstanceNumber}")
    ? getNumberOfInstancesOfSpecificMonth(instances, instanceYear, instanceMonth, filterEvaluator)
    : 0;
  const yearlyInstanceNumber = expression.includes("{yearlyInstanceNumber}") ? getNumberOfInstancesOfSpecificYear(instances, instanceYear, filterEvaluator) : 0;
  const totalInstanceNumber = expression.includes("{totalInstanceNumber}") ? getTotalNumberOfInstances(instances, filterEvaluator) : 0;
  const nr = resolveExpressionLogic(
    expression,
    dailyInstanceNumber,
    monthlyInstanceNumber,
    yearlyInstanceNumber,
    totalInstanceNumber,
    instanceYear,
    instanceMonth,
    instanceDay,
  );

  const newValue: IFieldValue = {
    value: nr,
    type: "ProcessHubTextInput",
  };

  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
}

export async function vorgangsnrAction(environment: IServiceTaskEnvironment): Promise<boolean> {
  const language = environment.sender.language || "de-DE";
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);

  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, die Konfiguration konnte nicht geladen werden.", language));
  }

  const fields = config.fields;
  const targetField = fields.find((f) => f.key === "targetfield")?.value;
  const expression = fields.find((f) => f.key === "expressionfield")?.value;
  const filter = fields.find((f) => f.key === "conditionfield")?.value;
  const roleOwners = environment.instanceDetails.extras.roleOwners ?? {};
  const filterWithValues = parseAndInsertStringWithFieldContent(
    filter ?? "",
    environment.instanceDetails.extras.fieldContents,
    processObject,
    roleOwners,
    environment.sender.language || "de-DE",
    await environment.roxApi.getUsersConfig(),
    false,
    "",
    (fieldName, valueObject) => serializeFilterValue(valueObject.value),
    environment.instanceDetails,
  );

  if (targetField === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, das Zielfeld wurde nicht ausgefüllt.", language));
  }

  if (typeof expression !== "string" || !expression.trim()) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguriert, das Ausdrucksfeld wurde nicht ausgefüllt.", language));
  }

  const processDetails = await environment.processes.getProcessDetails(environment.instanceDetails.processId, ProcessExtras.ExtrasInstances);
  await serviceLogic(processDetails, environment, targetField, expression, filterWithValues);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
