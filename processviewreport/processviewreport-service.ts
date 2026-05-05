import { getBackendUrl } from "processhub-sdk/lib/config.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { ProcessExtras } from "processhub-sdk/lib/process/processinterfaces.js";
import * as XLSX from "xlsx";
import { IInstanceDetails, InstanceExtras, State } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import { WorkspaceExtras } from "processhub-sdk/lib/workspace/workspaceinterfaces.js";
import { isPotentialRoleOwner } from "processhub-sdk/lib/process/processrights.js";
import { UserExtras } from "processhub-sdk/lib/user/userinterfaces.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { getJson } from "processhub-sdk/lib/legacyapi/apirequests.js";
import { ProcessRequestRoutes, IGetArchiveViewsRequest, IGetArchiveViewsReply, IBaseStateColumn } from "processhub-sdk/lib/process/legacyapi.js";
import { applyViewFilters, IGridOptions } from "./grid-options/filter.js";
import { applyViewSorting } from "./grid-options/sortinstances.js";
import { decodeFieldKey, toStr } from "./grid-options/utilize.js";

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
  environment.logger.debug(`Fetched archive views reply: ${JSON.stringify(archiveViewsReply)}`);

  const views = archiveViewsReply.views || {};
  environment.logger.debug(`Fetched archive views: ${JSON.stringify(Object.keys(views))}`);

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

  environment.logger.debug(`Loaded ${instances.length} instances`);

  if (instances.length > 0) {
    const sampleFc = instances[0].extras?.fieldContents || {};
    environment.logger.debug(`Sample instance fieldContents keys: ${JSON.stringify(Object.keys(sampleFc))}`);
    environment.logger.debug(`View column fields: ${JSON.stringify(viewColumns.map((c) => c.field))}`);
  }

  // Apply filters from gridOptions if available
  let filteredInstances = instances;
  if (gridOptions?.filter) {
    environment.logger.debug(`Applying gridOptions filter: ${JSON.stringify(gridOptions.filter)}`);
    filteredInstances = applyViewFilters(instances, gridOptions.filter, environment);
    environment.logger.debug(`Instances after filtering: ${filteredInstances.length}`);
  } else {
    environment.logger.debug("No gridOptions filter to apply: " + JSON.stringify(gridOptions));
  }

  // Apply sorting from gridOptions if available
  if (gridOptions?.sort && gridOptions.sort.length > 0) {
    environment.logger.debug(`Applying gridOptions sorting: ${JSON.stringify(gridOptions.sort)}`);
    filteredInstances = applyViewSorting(filteredInstances, gridOptions);
  }

  // Generate XLSX using only the columns defined in the view
  const xlsxBuffer = generateXLSX(filteredInstances, viewColumns, environment);

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

  const uploadUrl = await environment.instances.uploadAttachment(instance.instanceId, fileName, xlsxBuffer);
  if (!uploadUrl) {
    throw new BpmnError(ErrorCodes.ATTACHMENT_ERROR, tl("Der Bericht konnte nicht als Datei angehängt werden.", language));
  }

  // Store in configured report field or default
  const targetField = reportField || "autoGeneratedReport";
  if (instance.extras.fieldContents === undefined) instance.extras.fieldContents = {};
  instance.extras.fieldContents[targetField] = { type: "ProcessHubFileUpload", value: [uploadUrl] };
}

/**
 * Generate XLSX buffer from instances using the columns defined in the view.
 */
export function generateXLSX(instances: IInstanceDetails[], viewColumns: IBaseStateColumn[], environment: IServiceTaskEnvironment): Buffer {
  const rows: Record<string, unknown>[] = [];
  for (const instance of instances) {
    rows.push(instanceToRow(instance, viewColumns, environment));
  }
  return generateXLSXFromRows(rows, viewColumns);
}

/**
 * Convert a single instance to a flat row object, filtered by view columns.
 * Checks extras.fieldContents, extras.roleOwners (lane_*), direct instance properties,
 * and computed fields (link, idLowercase, state).
 */
export function instanceToRow(instance: IInstanceDetails, viewColumns: IBaseStateColumn[], environment: IServiceTaskEnvironment): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const fc = instance.extras?.fieldContents || {};
  const roleOwners = instance.extras?.roleOwners || {};
  const todos = instance.extras?.todos || [];

  const instanceId = instance.instanceId;
  const workspaceId = instance.workspaceId;

  environment.logger.debug(`Processing instance ${instanceId} with workspace ${workspaceId}`);

  for (const col of viewColumns) {
    const fieldKey = col.field;

    // 1. Check fieldContents for field_* columns (base64-encoded field name)
    if (fieldKey.startsWith("field_")) {
      const fieldName = decodeFieldKey(fieldKey);
      const fcVal = fc[fieldName];
      if (fcVal !== undefined) {
        row[col.title || fieldKey] = formatFieldValue(fcVal.value, fcVal.type);
      } else {
        row[col.title || fieldKey] = "";
      }
      continue;
    }

    // 3. Lane/role owner fields (e.g. lane_Lane_7A0DD19E05A33282)
    if (fieldKey.startsWith("lane_")) {
      const laneId = fieldKey.replace("lane_", "");
      const owners = roleOwners[laneId];
      if (owners && owners.length > 0) {
        row[col.title || fieldKey] = owners.map((o) => o.displayName || o.memberId).join(", ");
      } else {
        row[col.title || fieldKey] = "";
      }
      continue;
    }

    // 4. Computed/virtual fields
    if (fieldKey === "link") {
      row[col.title || fieldKey] = `${getBackendUrl()}/p/i/${workspaceId}/${instanceId}`;
      continue;
    }
    if (fieldKey === "idLowercase") {
      row[col.title || fieldKey] = instanceId?.toLowerCase() ?? "";
      continue;
    }

    // 5. State as readable text
    if (fieldKey === "state") {
      row[col.title || fieldKey] = stateToString(instance.state);
      continue;
    }

    // 6. Date-only variants
    if (fieldKey === "createdAtDate") {
      row[col.title || fieldKey] = formatDateOnly(instance.createdAt);
      continue;
    }
    if (fieldKey === "completedAtDate") {
      row[col.title || fieldKey] = formatDateOnly(instance.completedAt);
      continue;
    }

    // 7. Todos (pending tasks)
    if (fieldKey === "todos") {
      if (todos.length > 0) {
        row[col.title || fieldKey] = todos.map((t) => t.displayName || t.bpmnTaskId).join(", ");
      } else {
        row[col.title || fieldKey] = "";
      }
      continue;
    }

    // 8. Start event / end events
    if (fieldKey.startsWith("startevent_")) {
      if (col.title?.toLowerCase().includes("end")) {
        row[col.title || fieldKey] = (instance.reachedEndEvents || []).join(", ");
      } else {
        row[col.title || fieldKey] = instance.takenStartEvent || "";
      }
      continue;
    }

    // 9. Direct instance properties (title, createdAt, completedAt, cancellationReason, etc.)
    if (instance[fieldKey as keyof IInstanceDetails] !== undefined) {
      row[col.title || fieldKey] = instance[fieldKey as keyof IInstanceDetails];
      continue;
    }

    row[col.title || fieldKey] = "";
  }
  return row;
}

/**
 * Format a field value for display in XLSX.
 * Handles arrays (FileUpload), HTML (TextArea), etc.
 */
function formatFieldValue(value: unknown, type?: string): unknown {
  if (value == null) return "";
  if (Array.isArray(value)) {
    if (value.length === 0) return "";
    // FileUpload: array of URLs or file objects
    return value
      .map((v) => {
        if (typeof v === "string") {
          // Extract filename from URL if possible
          const parts = v.split("/");
          return parts[parts.length - 1] || v;
        }
        return toStr(v);
      })
      .join(", ");
  }
  if (typeof value === "string" && type === "ProcessHubTextArea") {
    // Strip HTML tags
    return value.replace(/<[^>]*>/g, "").trim();
  }
  return value;
}

function formatDateOnly(date: Date | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date.toISOString() : String(date);
  return d.slice(0, 10);
}

function stateToString(state: State | undefined): string {
  switch (state) {
    case State.Running:
      return "Laufend";
    case State.Finished:
      return "Beendet";
    case State.Canceled:
      return "Abgebrochen";
    case State.Error:
      return "Fehler";
    default:
      return "";
  }
}

/**
 * Generate XLSX buffer from already prepared rows, preserving column order from view.
 */
export function generateXLSXFromRows(rows: Record<string, unknown>[], viewColumns: IBaseStateColumn[]): Buffer {
  const headers = viewColumns.map((col) => col.title || col.field);
  const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = { Sheets: { Report: sheet }, SheetNames: ["Report"] };
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export async function processviewreport(environment: IServiceTaskEnvironment): Promise<boolean> {
  await serviceLogic(environment);
  await environment.instances.updateInstance(environment.instanceDetails);
  return true;
}
