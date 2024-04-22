import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { readFile, utils, set_fs } from "xlsx";
import fs from "fs";
import { isPotentialRoleOwner } from "processhub-sdk/lib/process/processrights.js";
import { UserExtras } from "processhub-sdk/lib/user/userinterfaces.js";
import { ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import { WorkspaceExtras } from "processhub-sdk/lib/workspace/workspaceinterfaces.js";

export async function serviceLogic({ bpmnTaskId, bpmnXml, instanceDetails, users, workspaces, processes }: IServiceTaskEnvironment): Promise<void> {
  const roleOwners = throwErrorIfNotSet(instanceDetails.extras.roleOwners, "Role owners are undefined, cannot proceed with service!");
  const fieldContents = throwErrorIfNotSet(instanceDetails.extras.fieldContents, "Field contents are undefined, cannot proceed with service!");

  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const serviceTaskConfigObject = throwErrorIfNotSet(extensionValues.serviceTaskConfigObject, "Config is undefined, cannot proceed with service!");

  const lane = throwErrorIfNotSet(processObject.getLaneOfFlowNode(bpmnTaskId), "Lane is undefined, cannot proceed with service!");

  const { fields } = serviceTaskConfigObject;
  const filePath = throwErrorIfNotSet(fields.find(({ key }) => key === "filePath")?.value, "File path is undefined, cannot proceed with service!");

  const areaFieldName = throwErrorIfNotSet(fields.find(({ key }) => key === "areaField")?.value, "Area field name is undefined, cannot proceed with service!");
  const areaFieldValue = throwErrorIfNotSet(fieldContents[areaFieldName]?.value, "Area field value is undefined, cannot proceed with service!");

  const wb = readFile(filePath);

  const sheetJSON: { Bereich: string; "E-Mailadresse": string }[] = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

  let set = false;
  for (const { Bereich: area, "E-Mailadresse": email } of sheetJSON) {
    if (area !== areaFieldValue) continue;

    const userId = throwErrorIfNotSet(await users.getUserIdByMail(email), `There is no user with the mail address "${email}"!`);

    const user = throwErrorIfNotSet(await users.getUserDetails(userId, UserExtras.None), `There is no user with the id "${userId}"!`);

    const workspace = throwErrorIfNotSet(
      await workspaces.getWorkspaceDetails(instanceDetails.workspaceId, WorkspaceExtras.ExtrasGroups),
      `Workspace with id "${instanceDetails.workspaceId}" not found!`,
    );
    const process = await processes.getProcessDetails(instanceDetails.processId, ProcessExtras.ExtrasProcessRolesWithMemberNames);

    if (!isPotentialRoleOwner(user.userId, lane.id, workspace, process)) {
      throw new Error(`The user "${user.displayName}" with id "${userId}" cannot be set in this role. Check process settings!`);
    }

    roleOwners[lane.id] = [{ memberId: userId }];
    set = true;
    break;
  }
  if (!set) throw new Error(`Area "${String(areaFieldValue)}" not found in file!`);
}

function throwErrorIfNotSet<T>(obj: T | undefined | null, errorMessage: string): T {
  if (obj == null) throw new Error(errorMessage);
  return obj;
}

export async function setRoleViaCSV(environment: IServiceTaskEnvironment): Promise<boolean> {
  set_fs(fs);
  try {
    await serviceLogic(environment);
  } finally {
    await environment.instances.updateInstance(environment.instanceDetails);
  }
  return true;
}
