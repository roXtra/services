import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IProcessDetails, ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";

function getNumberOfInstancesOfSpecificMonth(instances: IInstanceDetails[], year: number, month: number): number {
  const instancesOfTheMonth: IInstanceDetails[] = [];

  for (let i = 0; i < instances.length; i++) {
    const currentInstance = instances[i];
    const { createdAt } = currentInstance;
    if (createdAt === undefined) {
      throw new Error(`createdAt is undefined for instance ${currentInstance.instanceId}, cannot proceed with service!`);
    }

    const instanceYear = new Date(createdAt).getFullYear();
    const instanceMonth = new Date(createdAt).getMonth();

    if (year === instanceYear && month === instanceMonth) {
      instancesOfTheMonth.push(instances[i]);
    }
  }
  return instancesOfTheMonth.length;
}

export function serviceLogic(processDetails: IProcessDetails, environment: IServiceTaskEnvironment, targetField: string): void {
  const instances = processDetails.extras.instances;

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
  const numberOfInstances = getNumberOfInstancesOfSpecificMonth(instances, instanceYear, instanceMonth);
  const nr: string =
    "B" +
    instanceYear.toString() +
    "-" +
    (instanceMonth + 1 < 10 ? "0" : "") +
    (instanceMonth + 1).toString() +
    "-" +
    (numberOfInstances < 100 ? "0" : "") +
    (numberOfInstances < 10 ? "0" : "") +
    numberOfInstances.toString();

  const newValue: IFieldValue = {
    value: nr,
    type: "ProcessHubTextInput",
  };

  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
}

export async function complaintnrAction(environment: IServiceTaskEnvironment): Promise<boolean> {
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

  if (targetField === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, das Zielfeld wurde nicht ausgefüllt.", language));
  }

  const processDetails = await environment.processes.getProcessDetails(environment.instanceDetails.processId, ProcessExtras.ExtrasInstances);
  serviceLogic(processDetails, environment, targetField);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
