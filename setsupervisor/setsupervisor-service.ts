import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces";
import { getFields, IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess";

const ErrorCodes = {
  API_ERROR: "API_ERROR",
  INPUT_ERROR: "INPUT_ERROR",
  SUPERVISOR_ERROR: "SUPERVISOR_ERROR",
  INSTANCE_ERROR: "INSTANCE_ERROR",
};

// Extract the serviceLogic that testing is possible
export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<IInstanceDetails> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);

  const fields = await getFields(environment);
  const instance = environment.instanceDetails;

  // Get field names of the corresponding field ID's
  const selectedFieldUser = fields.find((f) => f.key === "userRoleId")?.value;
  const selectedFieldSupervisor = fields.find((f) => f.key === "supervisorRoleId")?.value;

  // Check the field inputs
  if (selectedFieldUser === undefined) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Die Rolle des Mitarbeiters wurde nicht definiert!");
  }
  if (selectedFieldSupervisor === undefined) {
    throw new BpmnError(ErrorCodes.INPUT_ERROR, "Die Rolle des Vorgesetzten wurde nicht definiert!");
  }

  // Get the laneId for selectedFieldUser
  const roleId = processObject.getLanes(false).find((l) => l.name === selectedFieldUser)?.id;
  if (!roleId) {
    throw new BpmnError(ErrorCodes.API_ERROR, `Es konnte keine Rolle "${selectedFieldUser}" gefunden werden!`);
  }

  // Get the laneId for selectedFieldSupervisor
  const roleIdSupervisor = processObject.getLanes(false).find((l) => l.name === selectedFieldSupervisor)?.id;
  if (!roleIdSupervisor) {
    throw new BpmnError(ErrorCodes.API_ERROR, `Es konnte keine Rolle "${selectedFieldSupervisor}" gefunden werden!`);
  }

  // Check if the selectedFieldUser role is assigned
  if (!(instance.extras.roleOwners && instance.extras.roleOwners[roleId] && instance.extras.roleOwners[roleId].length > 0)) {
    throw new BpmnError(ErrorCodes.API_ERROR, `Es ist kein Benutzer der Rolle "${selectedFieldUser}" zugewiesen werden!`);
  }

  const userId = instance.extras.roleOwners[roleId][0].memberId;
  const supervisorObject = await environment.roxApi.getSupervisor(userId);

  // Add supervisor and selected role to roleOwners
  if (supervisorObject.type === "user" && typeof supervisorObject.value === "number") {
    const supervisorId = supervisorObject.value.toString();
    instance.extras.roleOwners[roleIdSupervisor] = [{ memberId: supervisorId }];
  } else if (supervisorObject.type === "error") {
    throw new BpmnError(ErrorCodes.API_ERROR, "Der Vorgesetzte wurde nicht gefunden!");
  } else if (supervisorObject.type === "group") {
    throw new BpmnError(ErrorCodes.SUPERVISOR_ERROR, "Gruppen werden als Vorgesetzte nicht unterstützt!");
  }
  return instance;
}

export async function setsupervisor(environment: IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  try {
    await environment.instances.updateInstance(environment.instanceDetails);
  } catch (error) {
    throw new BpmnError(ErrorCodes.INSTANCE_ERROR, "Die Instanz konnte nicht aktualisiert werden!");
  }

  return true;
}
