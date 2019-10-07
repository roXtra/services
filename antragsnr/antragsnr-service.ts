import * as PH from "processhub-sdk";
import { setError } from "./errorhelper";
import { ProcessExtras } from "processhub-sdk/lib/process";

function getNumberOfInstancesOfSpecificYear(instances: PH.Instance.IInstanceDetails[], year: number): number {
  const instancesOfTheYear: PH.Instance.IInstanceDetails[] = [];

  for (let i = 0; i < instances.length; i++) {
    const instanceYear = new Date(instances[i].createdAt).getFullYear();

    if (year === instanceYear) {
      instancesOfTheYear.push(instances[i]);
    }
  }
  return instancesOfTheYear.length;
}

export function serviceLogic(processDetails: PH.Process.IProcessDetails, environment: PH.ServiceTask.IServiceTaskEnvironment, targetField: string): void {
  const instances: PH.Instance.IInstanceDetails[] = processDetails.extras.instances;
  const instanceYear = environment.instanceDetails.createdAt.getFullYear();
  const numberOfInstances = getNumberOfInstancesOfSpecificYear(instances, instanceYear);
  const nr: string = (numberOfInstances < 10) ? instanceYear.toString() + "/0" + numberOfInstances : instanceYear.toString() + "/" + numberOfInstances;

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
    const fields = config.fields;
    const targetField = fields.find(f => f.key === "targetfield").value;

    const processDetails = await environment.processes.getProcessDetails(environment.instanceDetails.processId, ProcessExtras.ExtrasInstances);
    serviceLogic(processDetails, environment, targetField);
    await environment.instances.updateInstance(environment.instanceDetails);
  } catch (ex) {
    await setError(environment, "(StartUpdateProcess): " + ex.toString());
    return false;
  }
  return true;
}