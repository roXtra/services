import { DefaultColumns } from "./field-keys.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { IArchiveViewDetails } from "processhub-sdk/lib/process/legacyapi.js";
import { encodeKey, getFieldKey, getLaneKey } from "./field-resolver.js";
import { IntegratedModuleName } from "processhub-sdk/lib/modules/imodule.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";

export async function getDefaultView(module: IntegratedModuleName, language: string, bpmnXml?: string): Promise<IArchiveViewDetails> {
  let viewDetails: IArchiveViewDetails;
  // Default view: If publicViewId is "default"
  if (module === "processes") {
    viewDetails = {
      gridOptions: JSON.stringify({
        skip: 0,
        take: 100,
        sort: [],
        filter: {
          logic: "and",
          filters: [
            {
              field: DefaultColumns.state.field,
              operator: "eq",
              value: tl("Laufend", language),
            },
          ],
        },
      }),
      publicView: true,
      viewName: tl("Standard", language),
      columns: [
        {
          field: DefaultColumns.link.field,
          filterable: false,
          show: true,
          sortable: false,
          title: tl("Link", language),
          width: "75px",
          hidden: false,
          filter: undefined,
        },
        {
          field: DefaultColumns.id.field,
          filterable: true,
          filter: "text",
          show: true,
          title: tl("ID", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.title.field,
          filterable: true,
          filter: "text",
          show: true,
          title: tl("Vorgang", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.createdAt.field,
          filterable: true,
          filter: "date",
          format: "{0:dd.MM.yyyy HH:mm}",
          show: true,
          title: tl("Gestartet", language),
          width: "146px",
          hidden: false,
        },
        {
          field: DefaultColumns.completedAt.field,
          filterable: true,
          filter: "date",
          format: "{0:dd.MM.yyyy HH:mm}",
          show: true,
          title: tl("Abgeschlossen", language),
          width: "146px",
          hidden: false,
        },
        {
          field: DefaultColumns.state.field,
          filterable: true,
          filter: "text",
          show: true,
          title: tl("Status", language),
          width: "110px",
          hidden: false,
        },
      ],
    };

    // Check for lane_ fields and add them to viewColumns (only for default view)
    if (bpmnXml) {
      const selectedProcessBpmn: BpmnProcess = new BpmnProcess();
      await selectedProcessBpmn.loadXml(bpmnXml);
      for (const lane of selectedProcessBpmn.getLanes(false)) {
        const fieldKey = getLaneKey(lane.id);
        if (!viewDetails.columns.some((col) => col.field === fieldKey)) {
          viewDetails.columns.push({
            field: fieldKey,
            title: lane.name || lane.id,
            filterable: true,
            filter: "text",
            show: true,
            hidden: false,
          });
        }
      }
    }
  } else if (module === "risks") {
    viewDetails = {
      gridOptions: JSON.stringify({
        skip: 0,
        take: 100,
        sort: [],
        filter: {
          logic: "and",
          filters: [],
        },
      }),
      publicView: true,
      viewName: tl("Standard", language),
      columns: [
        {
          field: DefaultColumns.id.field,
          filterable: false,
          filter: undefined,
          show: true,
          title: tl("ID", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.riskTitle.field,
          filterable: true,
          filter: "text",
          show: true,
          title: tl("Risiko", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.createdAt.field,
          filterable: true,
          filter: "date",
          format: "{0:dd.MM.yyyy HH:mm}",
          show: true,
          title: tl("Erstellt", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.createdAtDate.field,
          filterable: true,
          filter: "date",
          format: "{0:dd.MM.yyyy}",
          show: true,
          title: tl("Startdatum", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.openAssessments.field,
          filter: "text",
          filterable: true,
          show: true,
          title: tl("Offene Bewertungen", language),
          width: "150px",
          hidden: false,
        },
        {
          filterable: true,
          filter: "text",
          field: encodeKey(DefaultColumns.riskMetric.field),
          show: true,
          title: tl("RPZ", language),
          width: "150px",
          hidden: false,
        },
        {
          filterable: true,
          filter: "text",
          field: DefaultColumns.riskTrend.field,
          show: true,
          title: tl("Trend", language),
          width: "150px",
          hidden: false,
        },
      ],
    };
  } else if (module === "action" || module === "action_basic") {
    viewDetails = {
      gridOptions: JSON.stringify({
        skip: 0,
        take: 100,
        sort: [],
        filter: {
          logic: "and",
          filters: [],
        },
      }),
      publicView: true,
      viewName: tl("Standard", language),
      columns: [
        {
          field: DefaultColumns.link.field,
          filterable: false,
          show: true,
          sortable: false,
          title: tl("Link", language),
          width: "75px",
          hidden: false,
          filter: undefined,
        },
        {
          filterable: true,
          filter: "text",
          field: getFieldKey("Maßnahmennummer", "ProcessHubInstanceNumber"),
          show: true,
          title: tl("Maßnahmennummer", language),
          width: "150px",
          hidden: false,
        },
        {
          filterable: true,
          filter: "text",
          field: DefaultColumns.title.field,
          show: true,
          title: tl("Maßnahme", language),
          width: "150px",
          hidden: false,
        },
        {
          filterable: true,
          filter: "text",
          field: getLaneKey("Lane_14CED23DE434397F"),
          show: true,
          title: tl("Umsetzungsverantwortlich", language),
          width: "150px",
          hidden: false,
        },
        {
          filterable: true,
          filter: "text",
          field: getFieldKey("Status", "ProcessHubSVGDropdown"),
          show: true,
          title: tl("Status", language),
          width: "150px",
          hidden: false,
        },
        {
          filterable: true,
          filter: "date",
          field: getFieldKey("Zieltermin", "ProcessHubDate"),
          show: true,
          title: tl("Zieltermin", language),
          width: "150px",
          hidden: false,
        },
      ],
    };
  } else {
    // Module === "audits"
    viewDetails = {
      gridOptions: JSON.stringify({
        skip: 0,
        take: 100,
        sort: [],
        filter: {
          logic: "and",
          filters: [],
        },
      }),
      publicView: true,
      viewName: tl("Standard", language),
      columns: [
        {
          field: getFieldKey("Stand", "ProcessHubSVGDropdown"),
          filterable: false,
          filter: "text",
          show: true,
          title: tl("Stand", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.title.field,
          filterable: true,
          filter: "text",
          format: "{0:dd.MM.yyyy HH:mm}",
          show: true,
          title: tl("Title", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.createdAtDate.field,
          filterable: true,
          filter: "date",
          format: "{0:dd.MM.yyyy HH:mm}",
          show: true,
          title: tl("StartDatum", language),
          width: "150px",
          hidden: false,
        },
        {
          field: DefaultColumns.completedAtDate.field,
          filterable: false,
          filter: "date",
          show: true,
          title: tl("EndDatum", language),
          width: "150px",
          hidden: false,
        },
        {
          field: getLaneKey("Lane_6904A537DC989036"),
          filterable: false,
          filter: "text",
          show: true,
          title: tl("Auditor", language),
          width: "150px",
          hidden: false,
        },
        {
          field: getFieldKey("Auditart", "ProcessHubDropdown"),
          filterable: true,
          filter: "text",
          show: true,
          title: tl("Auditart", language),
          width: "150px",
          hidden: false,
        },
        {
          field: getFieldKey("Auditierter Bereich", "ProcessHubChecklist"),
          filterable: true,
          filter: "text",
          show: true,
          title: tl("Auditierter Bereich", language),
          width: "150px",
          hidden: false,
        },
        {
          field: encodeKey(DefaultColumns.auditMetric.field),
          filterable: true,
          filter: "text",
          show: true,
          title: tl("Erstellt", language),
          width: "150px",
          hidden: false,
        },
      ],
    };
  }
  return viewDetails;
}
