import { encodeKey } from "./field-resolver.js";

// Because they are used in stored grid views, field values may not be changed!
export const DefaultColumns = {
  // General grid columns
  instanceId: { type: "string", field: "instanceId" },
  link: { type: "string", field: "link" },
  id: { type: "string", field: "idLowercase" },
  title: { type: "string", field: "title" },
  createdAt: { type: "date", field: "createdAt" },
  completedAt: { type: "date", field: "completedAt" },
  createdAtDate: { type: "date", field: "createdAtDate" },
  completedAtDate: { type: "date", field: "completedAtDate" },
  cancellationReason: { type: "string", field: "cancellationReason" },
  todos: { type: "string", field: "todos" },
  state: { type: "string", field: "state" },
  startEvent: { type: "string", field: "startevent_0F90CCE759C7CB52" },
  endEvent: { type: "string", field: "startevent_107B9ECF79C6BC1A" },
  // Risk grid columns
  riskTitle: { type: "string", field: "risktitle" },
  riskMetricText: { type: "string", field: encodeKey("ca8760df-4ebc-402e-92aa-451a349333d6") },
  riskMetric: { type: "number", field: encodeKey("586b8929-ff50-42a7-ada2-09aec5cf8f7c") },
  riskTrend: { type: "string", field: "trend" },
  openAssessments: { type: "string", field: "assessments" },
  // Audit columns
  auditMetricText: { type: "string", field: encodeKey("256e3740-db1c-42e6-b6dd-8dfea91ba9cf") },
  auditMetric: { type: "number", field: encodeKey("4a8b959f-6297-4cd1-a0f6-0507d858ea37") },
};

export const DIMENSIONTEXT_KEY_PREFIX: string = "dimensiontext_";
export const DIMENSIONVALUE_KEY_PREFIX: string = "dimensionvalue_";
export const FIELD_KEY_PREFIX: string = "field_";
export const LANE_KEY_PREFIX: string = "lane_";
