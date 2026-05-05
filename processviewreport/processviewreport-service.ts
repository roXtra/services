import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import { InstanceExtras } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { WorkspaceExtras } from "processhub-sdk/lib/workspace/workspaceinterfaces.js";
import { isPotentialRoleOwner } from "processhub-sdk/lib/process/processrights.js";
import { UserExtras } from "processhub-sdk/lib/user/userinterfaces.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { getJson } from "processhub-sdk/lib/legacyapi/apirequests.js";
import { ProcessRequestRoutes, IGetArchiveViewsRequest, IGetArchiveViewsReply } from "processhub-sdk/lib/process/legacyapi.js";
import { applyViewFilters, IGridOptions } from "./utils/view-filters.js";
import { applyViewSorting } from "./utils/view-sorting.js";
import { generateXLSX } from "./utils/xlsx-generator.js";

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
    throw new BpmnError(ErrorCodes.CONFIG_INVALID, tl("Fehlende oder fehlerhafte Konfiguration.", language));
  }

  const fields = config.fields;
  const processId = fields.find((f) => f.key === "processId")?.value.split("/")[1];
  const publicViewId = fields.find((f) => f.key === "publicViewId")?.value;
  const reportField = fields.find((f) => f.key === "reportField")?.value;
  const fileNameField = fields.find((f) => f.key === "fileNameField")?.value;

  if (!processId || !publicViewId) {
    throw new BpmnError(ErrorCodes.CONFIG_INVALID, tl("Prozess-ID und öffentliche Ansichts-ID müssen konfiguriert sein.", language));
  }

  const userId = environment.sender.userId;

  // TimerStartEvent check: if the takenStartEvent references a start event with a timer definition, abort
  const takenStartEvent = environment.instanceDetails.takenStartEvent;
  if (takenStartEvent) {
    const regex = new RegExp(`<bpmn:startEvent[^>]*id="${takenStartEvent}"[^>]*>([\\s\\S]*?)</bpmn:startEvent>`);
    const match = environment.bpmnXml.match(regex);
    if (match && /timerEventDefinition/.test(match[1])) {
      throw new BpmnError(ErrorCodes.TIMER_START, tl("Der Service darf nicht im Systemkontext (TimerStartEvent) ausgeführt werden.", language));
    }
  }

  const processDetails = await environment.processes.getProcessDetails(processId, ProcessExtras.ExtrasProcessRolesWithMemberNames);

  // Permission check
  const workspace = await environment.workspaces.getWorkspaceDetails(processDetails.workspaceId, WorkspaceExtras.ExtrasMembers);
  const user = await environment.users.getUserDetails(userId, UserExtras.ExtrasWorkspaces);

  const isMember = Array.isArray(user?.extras?.workspaces) && user.extras.workspaces.some((w) => w.workspaceId === workspace?.workspaceId);
  let allowed = false;
  if (isMember) allowed = true;
  else if (workspace && processDetails) {
    const lanes = processObject.getLanes(false) || [];
    for (const lane of lanes) {
      try {
        if (isPotentialRoleOwner(userId, lane.id, workspace, processDetails)) {
          allowed = true;
          break;
        }
      } catch {
        // Ignore and continue
      }
    }
  }

  if (!allowed) {
    throw new BpmnError(ErrorCodes.PERMISSION_ERROR, tl("Der Benutzer hat keine Berechtigung für den angegebenen Prozess.", language));
  }

  // Fetch archive views and find the configured public view
  const accessToken = await environment.roxApi.getAccessTokenFromAuth(userId);
  const archiveViewsReply = (await getJson<IGetArchiveViewsRequest>(ProcessRequestRoutes.GetArchiveViews, { processId }, { accessToken })) as unknown as IGetArchiveViewsReply;

  const views = archiveViewsReply.views || {};

  // Find the view by name (not by ID)
  const viewEntry = Object.entries(views).find(([, v]) => v.viewName === publicViewId);
  if (!viewEntry) {
    throw new BpmnError(ErrorCodes.VIEW_NOT_FOUND, tl("Die angegebene öffentliche Ansicht konnte nicht gefunden werden.", language));
  }
  const viewDetails = viewEntry[1];
  if (!viewDetails.publicView) {
    throw new BpmnError(ErrorCodes.VIEW_NOT_FOUND, tl("Die angegebene Ansicht ist nicht öffentlich.", language));
  }

  // Get visible columns from the view (only columns that are shown and not hidden)
  const viewColumns = viewDetails.columns.filter((col) => col.show && !col.hidden);
  const gridOptions = JSON.parse(viewDetails.gridOptions) as IGridOptions;

  // Load all instances with field contents, role owners, and todos
  const instances = await environment.instances.getAllInstancesForProcess(
    processId,
    InstanceExtras.ExtrasFieldContents | InstanceExtras.ExtrasRoleOwners | InstanceExtras.ExtrasTodos,
  );

  environment.logger.debug(`Found ${instances.length} instances`);

  // Apply filters from gridOptions if available
  let filteredInstances = instances;
  if (gridOptions?.filter) {
    environment.logger.debug(`Applying gridOptions filter in Service Task ${environment.bpmnTaskId}`);
    filteredInstances = applyViewFilters(instances, gridOptions.filter);
    environment.logger.debug(`Instances after filtering: ${filteredInstances.length}`);
  }

  // Apply sorting from gridOptions if available
  if (gridOptions?.sort && gridOptions.sort.length > 0) {
    environment.logger.debug(`Applying gridOptions sorting in Service Task ${environment.bpmnTaskId}: ${JSON.stringify(gridOptions.sort)}`);
    filteredInstances = applyViewSorting(filteredInstances, gridOptions);
  }

  // Generate XLSX using only the columns defined in the view
  const xlsxBuffer: Buffer = generateXLSX(filteredInstances, viewColumns, language);

  // Determine file name
  const instance = environment.instanceDetails;
  let fileName: string;
  if (fileNameField && instance.extras.fieldContents?.[fileNameField]) {
    const val = instance.extras.fieldContents[fileNameField]?.value;
    fileName = typeof val === "string" && val.trim() ? val.trim() : `${processId}_report_${Date.now()}.xlsx`;
    if (!fileName.endsWith(".xlsx")) fileName += ".xlsx";
  } else {
    fileName = `${processId}_report_${Date.now()}.xlsx`;
  }
  environment.logger.debug(`Determined file name for report: ${fileName}`);

  // Upload the file and get the URL
  const uploadUrl = await environment.instances.uploadAttachment(instance.instanceId, fileName, xlsxBuffer);
  if (!uploadUrl) {
    throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, tl("Der Bericht konnte nicht als Datei angehängt werden.", language));
  }

  // Store in configured report field or default
  const targetField = reportField || "autoGeneratedReport";
  if (instance.extras.fieldContents === undefined) instance.extras.fieldContents = {};
  instance.extras.fieldContents[targetField] = { type: "ProcessHubFileUpload", value: [uploadUrl] };
}

export async function processviewreport(environment: IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
