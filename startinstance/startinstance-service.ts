import * as PH from "processhub-sdk";

async function getServiceTaskConfig(
  environment: PH.ServiceTask.IServiceTaskEnvironment,
): Promise<{ workspaceAndProcessId: string; fields: string[]; executingUserId: string }> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
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

export async function startinstance(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  try {
    const { workspaceAndProcessId, fields, executingUserId } = await getServiceTaskConfig(environment);
    const workspaceId = workspaceAndProcessId.split("/")[0];
    const processId = workspaceAndProcessId.split("/")[1];

    const accessToken = await environment.roxApi.getRoxtraTokenByUserId(executingUserId);

    const oldFieldContents = environment.instanceDetails.extras.fieldContents;
    const newFieldContents: PH.Data.IFieldContentMap = {};
    if (oldFieldContents !== undefined) {
      for (const fieldName of fields) {
        newFieldContents[fieldName] = oldFieldContents[fieldName];
      }
    }

    const newInstance: PH.Instance.IInstanceDetails = {
      title: "",
      instanceId: PH.Tools.createId(),
      workspaceId,
      processId,
      extras: {
        instanceState: undefined,
        fieldContents: newFieldContents,
      },
    };

    await environment.instances.executeInstance(processId, newInstance, undefined, accessToken);
    return true;
  } catch (ex) {
    console.error(ex);

    if (environment.instanceDetails.extras.fieldContents === undefined) {
      environment.instanceDetails.extras.fieldContents = {};
    }

    environment.instanceDetails.extras.fieldContents["ErrorField"] = {
      type: "ProcessHubTextInput",
      value: PH.tl("Fehler beim Ausführen des Services: ") + JSON.stringify(ex),
    };
    await environment.instances.updateInstance(environment.instanceDetails);
    return false;
  }
}
