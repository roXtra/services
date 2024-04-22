import { IInstanceDetails } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { getFields, IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import { isPotentialRoleOwner } from "processhub-sdk/lib/process/processrights.js";
import { UserExtras } from "processhub-sdk/lib/user/userinterfaces.js";
import { WorkspaceExtras } from "processhub-sdk/lib/workspace/workspaceinterfaces.js";

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
  const instance = environment.instanceDetails;
  const processDetails = await environment.processes.getProcessDetails(instance.processId, ProcessExtras.ExtrasProcessRolesWithMemberNames);

  const fields = await getFields(environment);

  const selectedFieldUser = fields.find((f) => f.key === "userRoleId")?.value;
  const selectedFieldSupervisor = fields.find((f) => f.key === "supervisorRoleId")?.value;

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

  switch (supervisorObject.type) {
    case "group": {
      throw new BpmnError(ErrorCodes.SUPERVISOR_ERROR, "Gruppen als Vorgesetzte werden nicht unterstützt!");
    }
    case "error": {
      throw new BpmnError(ErrorCodes.INSTANCE_ERROR, "Die Instanz konnte nicht aktualisiert werden!");
    }
  }

  const supervisor = await environment.users.getUserDetails(supervisorObject.value.toString(), UserExtras.ExtrasWorkspaces);
  const processWorkspace = await environment.workspaces.getWorkspaceDetails(processDetails.workspaceId, WorkspaceExtras.ExtrasMembers);

  // Check if supervisor is potentialRoleOwner & member of current workspace
  if (supervisor && processWorkspace) {
    const supervisorWorkspaces = supervisor.extras.workspaces;

    if (!isPotentialRoleOwner(supervisor.userId, roleIdSupervisor, processWorkspace, processDetails)) {
      throw new BpmnError(ErrorCodes.SUPERVISOR_ERROR, "Der Vorgesetzte ist kein potentieller Rolleninhaber dieses Prozesses!");
    }

    if (supervisorWorkspaces) {
      const matchingWorkspaceId = supervisorWorkspaces.find((w) => w.workspaceId === processWorkspace.workspaceId)?.workspaceId;
      if (!matchingWorkspaceId) {
        throw new BpmnError(ErrorCodes.SUPERVISOR_ERROR, "Der Vorgesetzte ist nicht Mitglied des aktuellen Bereichs!");
      }
    } else {
      throw new BpmnError(ErrorCodes.SUPERVISOR_ERROR, "Der Vorgesetzte ist keinen Bereichen zugeordnet!");
    }
  } else {
    throw new BpmnError(ErrorCodes.API_ERROR, "Der Vorgesetzte / der Prozessbereich konnte nicht gefunden werden!");
  }

  // Add supervisor and selected role to roleOwners
  const supervisorId = supervisorObject.value.toString();
  instance.extras.roleOwners[roleIdSupervisor] = [{ memberId: supervisorId }];

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
