import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IInstanceDetails, InstanceExtras } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IProcessDetails, ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import { parseAndInsertStringWithFieldContent } from "processhub-sdk/lib/data/datatools.js";
import { evaluateExpression, expressionUsesVariable, formatExpressionValue } from "./expression-evaluator.js";
import { quoteFilterPlaceholderValues } from "./filter-placeholder-values.js";

/**
 * Evaluate a filter expression for a single instance.
 * @param filter The filter expression to evaluate.
 * @param instance The instance to test.
 * @returns True when the instance matches the filter.
 */
function evaluateFilter(filter: string | undefined, instance: IInstanceDetails): boolean {
  if (!filter?.trim()) {
    return true;
  }

  // Keep values as data instead of interpolating them into the expression source.
  const fieldValues = Object.fromEntries(Object.entries(instance.extras?.fieldContents ?? {}).map(([fieldName, fieldValue]) => [fieldName, fieldValue?.value]));

  try {
    return Boolean(evaluateExpression(filter, { field: fieldValues, undefined: undefined }));
  } catch (error) {
    throw new Error(`FILTER_ERROR: ${filter} Error: ${String(error)}`);
  }
}

type InstanceMatcher = (instance: IInstanceDetails, createdAt: Date) => boolean;

function countInstancesMatching(instances: IInstanceDetails[], matches: InstanceMatcher): number {
  return instances.reduce((count, instance) => {
    if (instance.createdAt === undefined) {
      throw new Error(`createdAt is undefined for instance ${instance.instanceId}, cannot proceed with service!`);
    }

    return matches(instance, instance.createdAt) ? count + 1 : count;
  }, 0);
}

function getTotalNumberOfInstances(instances: IInstanceDetails[], filterEvaluator: (instance: IInstanceDetails) => boolean): number {
  return countInstancesMatching(instances, (instance) => filterEvaluator(instance));
}

function getNumberOfInstancesOfSpecificYear(instances: IInstanceDetails[], year: number, filterEvaluator: (instance: IInstanceDetails) => boolean): number {
  return countInstancesMatching(instances, (instance, createdAt) => new Date(createdAt).getFullYear() === year && filterEvaluator(instance));
}

function getNumberOfInstancesOfSpecificMonth(instances: IInstanceDetails[], year: number, month: number, filterEvaluator: (instance: IInstanceDetails) => boolean): number {
  return countInstancesMatching(instances, (instance, createdAt) => {
    const date = new Date(createdAt);
    return date.getFullYear() === year && date.getMonth() === month && filterEvaluator(instance);
  });
}

function getNumberOfInstancesOfSpecificDay(
  instances: IInstanceDetails[],
  year: number,
  month: number,
  day: number,
  filterEvaluator: (instance: IInstanceDetails) => boolean,
): number {
  return countInstancesMatching(instances, (instance, createdAt) => {
    const date = new Date(createdAt);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day && filterEvaluator(instance);
  });
}

interface IInstanceNumberValues {
  dailyInstanceNumber: number;
  monthlyInstanceNumber: number;
  yearlyInstanceNumber: number;
  totalInstanceNumber: number;
  instanceYear: number;
  instanceMonth: number;
  instanceDay: number;
}

/**
 * Resolve placeholders inside the expression string and replace them with actual values.
 * Supports arithmetic, comparisons, logical operators, and conditional expressions inside ${...} blocks.
 * @param expression The template expression to resolve.
 * @param values The available counts and date parts for the current instance.
 * @returns The resolved string with placeholder values inserted.
 */
function resolveExpressionLogic(expression: string, values: IInstanceNumberValues): string {
  const template = expression || "";

  if (!template.trim()) {
    throw new Error("EXPRESSION_ERROR: Expression is empty, cannot proceed with service!");
  }

  return template.replace(/\$\{([^}]+)\}/g, (match: string, expressionCode: string) => {
    const expressionCodeTrimmed = expressionCode.trim();

    if (!expressionCodeTrimmed) {
      throw new Error("EXPRESSION_ERROR: Expression placeholder is empty, cannot proceed with service!");
    }

    try {
      const value = evaluateExpression(expressionCodeTrimmed, { ...values, undefined: undefined }, new Set(Object.keys(values)));
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
  const instanceNumbers: IInstanceNumberValues = {
    dailyInstanceNumber: expressionUsesVariable(expression, "dailyInstanceNumber")
      ? getNumberOfInstancesOfSpecificDay(instances, instanceYear, instanceMonth, instanceDay, filterEvaluator)
      : 0,
    monthlyInstanceNumber: expressionUsesVariable(expression, "monthlyInstanceNumber")
      ? getNumberOfInstancesOfSpecificMonth(instances, instanceYear, instanceMonth, filterEvaluator)
      : 0,
    yearlyInstanceNumber: expressionUsesVariable(expression, "yearlyInstanceNumber") ? getNumberOfInstancesOfSpecificYear(instances, instanceYear, filterEvaluator) : 0,
    totalInstanceNumber: expressionUsesVariable(expression, "totalInstanceNumber") ? getTotalNumberOfInstances(instances, filterEvaluator) : 0,
    instanceYear,
    instanceMonth,
    instanceDay,
  };
  const nr = resolveExpressionLogic(expression, instanceNumbers);

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
  const userFieldsConfig = await environment.roxApi.getUsersConfig();
  const filterWithQuotedPlaceholders = quoteFilterPlaceholderValues(filter ?? "", processObject, environment.instanceDetails, roleOwners, userFieldsConfig);
  // The SDK helper replaces field placeholders; this proxy keeps absent fields replaceable too.
  const fieldContents = new Proxy(environment.instanceDetails.extras.fieldContents ?? {}, {
    get(target, property, receiver): unknown {
      if (typeof property === "string" && !Object.hasOwn(target, property)) {
        return { type: "ProcessHubTextInput", value: undefined };
      }
      return Reflect.get(target, property, receiver);
    },
  });
  const filterWithValues = parseAndInsertStringWithFieldContent(
    filterWithQuotedPlaceholders,
    fieldContents,
    {},
    {},
    environment.sender.language || "de-DE",
    userFieldsConfig,
    false,
    "",
    // Preserve placeholders as references so the evaluator reads the original typed field value.
    (fieldName) => `field[${JSON.stringify(fieldName)}]`,
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
