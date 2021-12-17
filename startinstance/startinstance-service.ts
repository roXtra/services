import { IFieldContentMap } from "processhub-sdk/lib/data/ifieldcontentmap";
import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { createId } from "processhub-sdk/lib/tools/guid";

async function getServiceTaskConfig(environment: IServiceTaskEnvironment): Promise<{ workspaceAndProcessId: string; fields: string[]; executingUserId: string }> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;
  const workspaceAndProcessId = fields.find((f) => f.key === "processId")?.value;
  const fieldsString = fields.find((f) => f.key === "fields");
  const executingUserId = fields.find((f) => f.key === "executingUserId")?.value;

  if (workspaceAndProcessId === undefined) {
    throw new Error("workspaceAndProcessId is undefined, cannot proceed!");
  }

  if (executingUserId === undefined) {
    throw new Error("executingUserId is undefined, cannot proceed!");
  }

  return {
    executingUserId,
    workspaceAndProcessId,
    fields: fieldsString !== undefined && fieldsString.value && fieldsString.value.length > 0 ? JSON.parse(fieldsString.value) : [],
  };
}

export async function startinstance(environment: IServiceTaskEnvironment): Promise<boolean> {
  const { workspaceAndProcessId, fields, executingUserId } = await getServiceTaskConfig(environment);
  const workspaceId = workspaceAndProcessId.split("/")[0];
  const processId = workspaceAndProcessId.split("/")[1];

  const accessToken = await environment.roxApi.getRoxtraTokenByUserId(executingUserId);

  const oldFieldContents = environment.instanceDetails.extras.fieldContents;
  const newFieldContents: IFieldContentMap = {};
  if (oldFieldContents !== undefined) {
    for (const fieldName of fields) {
      newFieldContents[fieldName] = oldFieldContents[fieldName];
    }
  }

  const newInstance: IInstanceDetails = {
    title: "",
    instanceId: createId(),
    workspaceId,
    processId,
    extras: {
      instanceState: undefined,
      fieldContents: newFieldContents,
    },
    takenStartEvent: "",
    reachedEndEvents: [],
  };

  await environment.instances.executeInstance(processId, newInstance, undefined, accessToken);
  return true;
}
