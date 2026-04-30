import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import * as XLSX from "xlsx";
import { IInstanceDetails, InstanceExtras } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { WorkspaceExtras } from "processhub-sdk/lib/workspace/workspaceinterfaces.js";
import { isPotentialRoleOwner } from "processhub-sdk/lib/process/processrights.js";
import { UserExtras } from "processhub-sdk/lib/user/userinterfaces.js";
import { IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { tl } from "processhub-sdk/lib/tl.js";

enum ErrorCodes {
  PERMISSION_ERROR = "PERMISSION_ERROR",
  VIEW_NOT_FOUND = "VIEW_NOT_FOUND",
  TIMER_START = "TIMER_START",
  ATTACHMENT_ERROR = "ATTACHMENT_ERROR",
  CONFIG_INVALID = "CONFIG_INVALID",
}

export async function serviceLogic(environment: IServiceTaskEnvironment): Promise<void> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  const language = environment.sender.language || "de-DE";

  if (config === undefined) {
    throw new Error("config is undefined, cannot proceed!");
  }

  const fields = config.fields;
  environment.logger.debug(`Loaded config fields: ${JSON.stringify(fields)}`);
  const processId = fields.find((f) => f.key === "processId")?.value.split("/")[1];
  environment.logger.debug(`Extracted processId: ${processId}`);
  const archiveView = fields.find((f) => f.key === "archiveView")?.value === "true";
  environment.logger.debug(`Archive view flag: ${archiveView}`);

  const userId = environment.sender.userId;
  environment.logger.debug(`Sender userId: ${userId}`);

  const processDetails = await environment.processes.getProcessDetails(processId as string, ProcessExtras.ExtrasProcessRolesWithMemberNames);
  environment.logger.debug(`Fetched process details for process ${processId}: ${JSON.stringify(processDetails)}`);

  // TimerStartEvent check: if the takenStartEvent references a start event with a timer definition, abort
  const takenStartEvent = environment.instanceDetails.takenStartEvent;
  if (takenStartEvent) {
    const regex = new RegExp(`<bpmn:startEvent[^>]*id="${takenStartEvent}"[^>]*>([\\s\\S]*?)</bpmn:startEvent>`);
    const match = environment.bpmnXml.match(regex);
    if (match && /timerEventDefinition/.test(match[1])) {
      throw new BpmnError(ErrorCodes.TIMER_START, tl("Der Service darf nicht im Systemkontext (TimerStartEvent) ausgeführt werden.", language));
    }
  }

  // Type RoleMember = { userId?: string; id?: string; memberId?: string; name?: string };
  // type RoleLike = { name?: string; members?: RoleMember[] };

  // const rolesProp = processDetails.extras.processRoles as RoleLike[] | undefined;
  // if (Array.isArray(rolesProp)) {
  //   rolesProp.forEach((role: RoleLike) => {
  //     environment.logger.debug(`Process role: ${role.name}, members: ${(role.members ?? []).map((m: RoleMember) => m.name).join(", ")}`);
  //   });

  //   let userAuthorized = false;
  //   for (const role of rolesProp) {
  //     if (!role || !Array.isArray(role.members)) continue;
  //     for (const m of role.members) {
  //       const candidateIds = [m.userId, m.id, m.memberId].filter(Boolean).map(String);
  //       if (candidateIds.includes(String(userId))) {
  //         userAuthorized = true;
  //         break;
  //       }
  //     }
  //     if (userAuthorized) break;
  //   }
  //   environment.logger.debug(`User ${userId} authorized for process ${processId}: ${userAuthorized}`);
  // } else {
  //   environment.logger.debug("processRoles not available or not an array, cannot determine membership");
  // }

  const workspace = await environment.workspaces.getWorkspaceDetails(processDetails.workspaceId, WorkspaceExtras.ExtrasMembers);
  const user = await environment.users.getUserDetails(environment.sender.userId, UserExtras.ExtrasWorkspaces);

  const isMember = Array.isArray(user?.extras?.workspaces) && user.extras.workspaces.some((w) => w.workspaceId === workspace?.workspaceId);
  let allowed = false;
  if (isMember) allowed = true;
  else if (workspace && processDetails) {
    const lanes = processObject.getLanes(false) || [];
    for (const lane of lanes) {
      try {
        if (isPotentialRoleOwner(environment.sender.userId, lane.id, workspace, processDetails)) {
          allowed = true;
          break;
        }
      } catch {
        // Ignore and continue
      }
    }
  }

  if (allowed) {
    environment.logger.debug(`User ${userId} is allowed to view process ${processId}`);
  } else {
    environment.logger.debug(`User ${userId} is NOT allowed to view process ${processId}`);
    throw new BpmnError(ErrorCodes.PERMISSION_ERROR, `User ${userId} does not have permission to view process ${processId}`);
  }

  const instances = await environment.instances.getAllInstancesForProcess(processId as string, InstanceExtras.ExtrasRoleOwners);
  environment.logger.debug(`Fetched instances (${instances.length}): ${JSON.stringify(instances)}`);

  const xlsxBuffer = generateXLSX(instances);

  // Instance of current service task, where the report will be attached as an auto-generated file
  const instance = environment.instanceDetails;
  const fieldName = `${processId}_report_${Date.now()}.xlsx`;

  const uploadUrl = await environment.instances.uploadAttachment(instance.instanceId, fieldName, xlsxBuffer);
  if (!uploadUrl) {
    throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, tl("Der Bericht konnte nicht als Datei angehängt werden.", language));
  }

  if (instance.extras.fieldContents === undefined) instance.extras.fieldContents = {};
  instance.extras.fieldContents["autoGeneratedReport"] = { type: "ProcessHubFileUpload", value: [uploadUrl] };
}

/**
 * Generate XLSX buffer from instances by first converting them to rows and then to a sheet.
 */
export function generateXLSX(instances: IInstanceDetails[]): Buffer {
  const rows: Record<string, unknown>[] = [];
  for (const instance of instances) {
    rows.push(instanceToRow(instance));
  }
  return generateXLSXFromRows(rows);
}

/**
 * Convert a single instance to a flat row object (used by tests).
 */
export function instanceToRow(instance: IInstanceDetails): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const fc = instance.extras?.fieldContents || {};
  for (const [key, val] of Object.entries(fc)) {
    const fieldVal = (val as unknown as IFieldValue).value;
    row[key] = fieldVal ?? val;
  }
  row["_instanceId"] = instance.instanceId;
  return row;
}

/**
 * Generate XLSX buffer from already prepared rows.
 */
export function generateXLSXFromRows(rows: Record<string, unknown>[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = { Sheets: { Report: sheet }, SheetNames: ["Report"] };
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export async function processviewreport(environment: IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
