import * as PH from "processhub-sdk";
import { setError } from "./errorhelper";
import { ProcessExtras } from "processhub-sdk/lib/process";

function getNumberOfInstancesOfSpecificYear(instances: PH.Instance.IInstanceDetails[], year: number): number {
  const instancesOfTheYear: PH.Instance.IInstanceDetails[] = [];

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

export function serviceLogic(processDetails: PH.Process.IProcessDetails, environment: PH.ServiceTask.IServiceTaskEnvironment, targetField: string): void {
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

  const newValue: PH.Data.IFieldValue = {
    value: nr,
    type: "ProcessHubTextInput",
  };

  environment.instanceDetails.extras.fieldContents[targetField] = newValue;
}

export async function antragsnrAction(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  try {
    const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
    await processObject.loadXml(environment.bpmnXml);
    const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
    const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);

    const config = extensionValues.serviceTaskConfigObject;

    if (config === undefined) {
      throw new Error("Config is undefined, cannot proceed with service!");
    }

    const fields = config.fields;
    const targetField = fields.find((f) => f.key === "targetfield")?.value;

    if (targetField === undefined) {
      throw new Error("targetField is undefined, cannot proceed with service!");
    }

    const processDetails = await environment.processes.getProcessDetails(environment.instanceDetails.processId, ProcessExtras.ExtrasInstances);
    serviceLogic(processDetails, environment, targetField);
    await environment.instances.updateInstance(environment.instanceDetails);
  } catch (ex) {
    await setError(environment, "(StartUpdateProcess): " + String(ex));
    return false;
  }
  return true;
}
