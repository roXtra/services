import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IProcessDetails, ProcessExtras } from "processhub-sdk/lib/process/processinterfaces";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { tl } from "processhub-sdk/lib/tl";

function getNumberOfInstancesOfSpecificYear(instances: IInstanceDetails[], year: number): number {
  const instancesOfTheYear: IInstanceDetails[] = [];

  for (let i = 0; i < instances.length; i++) {
    const currentInstance = instances[i];
    const { createdAt } = currentInstance;
    if (createdAt === undefined) {
      throw new Error(`createdAt is undefined for instance ${currentInstance.instanceId}, cannot proceed with service!`);
    }

    const instanceYear = new Date(createdAt).getFullYear();

    if (year === instanceYear) {
      instancesOfTheYear.push(instances[i]);
    }
  }
  return instancesOfTheYear.length;
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
  const numberOfInstances = getNumberOfInstancesOfSpecificYear(instances, instanceYear);
  const nr: string = numberOfInstances < 10 ? instanceYear.toString() + "/0" + numberOfInstances.toString() : instanceYear.toString() + "/" + numberOfInstances.toString();

  const newValue: IFieldValue = {
    value: nr,
    type: "ProcessHubTextInput",
  };

  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
}

export async function antragsnrAction(environment: IServiceTaskEnvironment): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);

  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, die Konfiguration konnte nicht geladen werden."));
  }

  const fields = config.fields;
  const targetField = fields.find((f) => f.key === "targetfield")?.value;

  if (targetField === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguiriert, das Zielfeld wurde nicht ausgefüllt."));
  }

  const processDetails = await environment.processes.getProcessDetails(environment.instanceDetails.processId, ProcessExtras.ExtrasInstances);
  serviceLogic(processDetails, environment, targetField);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
