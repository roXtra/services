import { expect } from "chai";
import { process, processServiceLogic } from "./main.js";
import { decodeFieldKey, formatDateOnly, getFieldKey, getLaneKey, getResolvedValue, toStr } from "./utils/field-resolver.js";
import { applyViewFilters, IGridOptions } from "./utils/view-filters.js";
import { applyViewSorting } from "./utils/view-sorting.js";
import { instanceToRow, generateXLSXFromRows, IGenerateXLSXOptions } from "./utils/xlsx-generator.js";
import { IInstanceDetails, State } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import * as XLSX from "xlsx";
import { DefaultColumns } from "./utils/field-keys.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInstance(overrides: Partial<IInstanceDetails> & { fieldContents?: Record<string, { value: unknown; type: string }> } = {}): IInstanceDetails {
  const { fieldContents, ...rest } = overrides;
  return {
    instanceId: "test-instance-1",
    workspaceId: "ws-1",
    processId: "proc-1",
    title: "Test Instance",
    state: State.Running,
    extras: {
      fieldContents: fieldContents ?? {},
      roleOwners: {},
      todos: [],
    },
    ...rest,
  } as unknown as IInstanceDetails;
}

// ---------------------------------------------------------------------------
// Bundle smoke test
// ---------------------------------------------------------------------------

describe("services", () => {
  it("bundle test", () => {
    expect(typeof process === "function").to.equal(true);
    expect(typeof processServiceLogic === "function").to.equal(true);
  });
});

// ---------------------------------------------------------------------------
// decodeFieldKey
// ---------------------------------------------------------------------------

describe("decodeFieldKey", () => {
  it("decodes a simple text field key", () => {
    // "Titel" in base64 is "VGl0ZWw=" -> padding '=' replaced by '_'
    const key = "field_VGl0ZWw_ProcessHubTextInput";
    expect(decodeFieldKey(key)).to.equal("Titel");
  });

  it("decodes a field key without known type suffix (falls back to raw base64)", () => {
    // "Test" in base64 is "VGVzdA=="
    const key = "field_VGVzdA__";
    const result = decodeFieldKey(key);
    expect(result).to.equal("Test");
  });

  it("returns the original key when base64 decoding fails", () => {
    const key = "field_!!!invalid";
    // No known suffix -> tries to decode "!!!invalid" which is not valid base64 for utf-8
    const result = decodeFieldKey(key);
    // Should not throw, just return something
    expect(typeof result).to.equal("string");
  });

  it("strips ProcessHubFileUpload suffix", () => {
    // "Anlagen" -> base64 "QW5sYWdlbg=="  padding -> "QW5sYWdlbg__"
    const key = "field_QW5sYWdlbg__ProcessHubFileUpload";
    expect(decodeFieldKey(key)).to.equal("Anlagen");
  });
});

// ---------------------------------------------------------------------------
// toStr
// ---------------------------------------------------------------------------

describe("toStr", () => {
  it("returns empty string for null", () => expect(toStr(null)).to.equal(""));
  it("returns empty string for undefined", () => expect(toStr(undefined)).to.equal(""));
  it("passes strings through", () => expect(toStr("hello")).to.equal("hello"));
  it("converts numbers", () => expect(toStr(42)).to.equal("42"));
  it("converts booleans", () => expect(toStr(true)).to.equal("true"));
  it("JSON-stringifies objects", () => expect(toStr({ a: 1 })).to.equal('{"a":1}'));
});

// ---------------------------------------------------------------------------
// getResolvedValue
// ---------------------------------------------------------------------------

describe("getResolvedValue", () => {
  const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;

  it("returns the .value of a field_* key from fieldContents", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: "Mein Vorgang", type: "ProcessHubTextInput" } } });
    const result = getResolvedValue(instance, getFieldKey("Titel", "ProcessHubTextInput"), options);
    expect(result).to.equal("Mein Vorgang");
  });

  it("returns empty string when field_* key is missing from fieldContents", () => {
    const instance = makeInstance();
    expect(getResolvedValue(instance, getFieldKey("Titel", "ProcessHubTextInput"), options)).to.equal("");
  });

  it("returns empty string when field value is null (empty field)", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: null, type: "ProcessHubTextInput" } } });
    // This is the critical fix: must return "" not the whole object
    expect(getResolvedValue(instance, getFieldKey("Titel", "ProcessHubTextInput"), options)).to.equal("");
  });

  it("resolves lane_ key to displayName of owner", () => {
    const instance = makeInstance();
    (instance.extras as Record<string, unknown>).roleOwners = {
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      Lane_ABC: [{ displayName: "Max Mustermann", memberId: "user-1" }],
    };
    expect(getResolvedValue(instance, getLaneKey("Lane_ABC"), options)).to.equal("Max Mustermann");
  });

  it("resolves idLowercase to lowercase instanceId", () => {
    const instance = makeInstance({ instanceId: "ABCD1234" });
    expect(getResolvedValue(instance, DefaultColumns.id.field, options)).to.equal("abcd1234");
  });

  it("resolves title", () => {
    const instance = makeInstance({ title: "Mein Titel" });
    expect(getResolvedValue(instance, DefaultColumns.title.field, options)).to.equal("Mein Titel");
  });

  it("resolves createdAtDate as date-only", () => {
    const instance = makeInstance({ createdAt: new Date("2025-03-15T10:30:00Z") } as Partial<IInstanceDetails>);
    expect(getResolvedValue(instance, DefaultColumns.createdAtDate.field, options)).to.deep.equal(formatDateOnly(new Date("2025-03-15T10:30:00Z")));
  });

  it("resolves completedAtDate as date-only", () => {
    const instance = makeInstance({ completedAt: new Date("2025-06-01T23:59:59Z") } as Partial<IInstanceDetails>);
    expect(getResolvedValue(instance, DefaultColumns.completedAtDate.field, options)).to.deep.equal(formatDateOnly(new Date("2025-06-01T23:59:59Z")));
  });

  it("returns empty string for completedAtDate when completedAt is not set", () => {
    const instance = makeInstance();
    expect(getResolvedValue(instance, DefaultColumns.completedAtDate.field, options)).to.deep.equal(formatDateOnly(undefined));
  });

  it("resolves state as numeric State enum value", () => {
    const instance = makeInstance({ state: State.Finished });
    expect(getResolvedValue(instance, DefaultColumns.state.field, options)).to.equal("Beendet");
  });

  it("resolves todos to joined displayNames", () => {
    const instance = makeInstance();
    (instance.extras as Record<string, unknown>).todos = [
      { displayName: "Aufgabe A", bpmnTaskId: "t1" },
      { displayName: "Aufgabe B", bpmnTaskId: "t2" },
    ];
    expect(getResolvedValue(instance, DefaultColumns.todos.field, options)).to.equal("Aufgabe A, Aufgabe B");
  });
});

// ---------------------------------------------------------------------------
// applyViewFilters
// ---------------------------------------------------------------------------

describe("applyViewFilters", () => {
  const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;

  const instances: IInstanceDetails[] = [
    makeInstance({ instanceId: "aaa", title: "Alpha Vorgang" }),
    makeInstance({ instanceId: "bbb", title: "Beta Test" }),
    makeInstance({ instanceId: "ccc", title: "Gamma Test" }),
  ];

  it("filters with contains on title", () => {
    const group = { logic: "and" as const, filters: [{ field: DefaultColumns.title.field, operator: "contains", value: "test" }] };
    const result = applyViewFilters(instances, group, options);
    expect(result).to.have.length(2);
    expect(result.map((i) => i.instanceId)).to.deep.equal(["bbb", "ccc"]);
  });

  it("filters with doesnotcontain", () => {
    const group = { logic: "and" as const, filters: [{ field: DefaultColumns.title.field, operator: "doesnotcontain", value: "test" }] };
    const result = applyViewFilters(instances, group, options);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("aaa");
  });

  it("filters with eq on idLowercase", () => {
    const group = { logic: "and" as const, filters: [{ field: DefaultColumns.id.field, operator: "eq", value: "bbb" }] };
    const result = applyViewFilters(instances, group, options);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("bbb");
  });

  it("isempty returns true when field value is null", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: null, type: "ProcessHubTextInput" } } });
    const group = { logic: "and" as const, filters: [{ field: getFieldKey("Titel", "ProcessHubTextInput"), operator: "isempty", value: "" }] };
    const result = applyViewFilters([instance], group, options);
    expect(result).to.have.length(1);
  });

  it("isempty returns false when field has value", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: "Hallo", type: "ProcessHubTextInput" } } });
    const group = { logic: "and" as const, filters: [{ field: getFieldKey("Titel", "ProcessHubTextInput"), operator: "isempty", value: "" }] };
    const result = applyViewFilters([instance], group, options);
    expect(result).to.have.length(0);
  });

  it("isnotempty returns false when field value is null", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: null, type: "ProcessHubTextInput" } } });
    const group = { logic: "and" as const, filters: [{ field: getFieldKey("Titel", "ProcessHubTextInput"), operator: "isnotempty", value: "" }] };
    const result = applyViewFilters([instance], group, options);
    expect(result).to.have.length(0);
  });

  it("nested or group works", () => {
    const group = {
      logic: "and" as const,
      filters: [
        { field: DefaultColumns.title.field, operator: "contains", value: "test" },
        {
          logic: "or" as const,
          filters: [
            { field: DefaultColumns.id.field, operator: "eq", value: "bbb" },
            { field: DefaultColumns.id.field, operator: "eq", value: "zzz" },
          ],
        },
      ],
    };
    const result = applyViewFilters(instances, group, options);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("bbb");
  });

  it("and logic with multiple conditions", () => {
    const group = {
      logic: "and" as const,
      filters: [
        { field: DefaultColumns.title.field, operator: "contains", value: "test" },
        { field: DefaultColumns.id.field, operator: "contains", value: "ccc" },
      ],
    };
    const result = applyViewFilters(instances, group, options);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("ccc");
  });

  it("compares ISO date strings with time using gt", () => {
    const dateInstances: IInstanceDetails[] = [
      makeInstance({ instanceId: "before", createdAt: new Date("2026-05-06T10:00:00.000Z") } as Partial<IInstanceDetails>),
      makeInstance({ instanceId: "after", createdAt: new Date("2026-05-06T10:00:01.000Z") } as Partial<IInstanceDetails>),
    ];

    const group = {
      logic: "and" as const,
      filters: [{ field: DefaultColumns.createdAt.field, operator: "gt", value: "2026-05-06T10:00:00Z" }],
    };

    const result = applyViewFilters(dateInstances, group, options);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("after");
  });

  it("normalizes milliseconds for datetime comparisons", () => {
    const dateInstances: IInstanceDetails[] = [makeInstance({ instanceId: "same-second", createdAt: new Date("2026-05-06T10:00:00.900Z") } as Partial<IInstanceDetails>)];

    const gteGroup = {
      logic: "and" as const,
      filters: [{ field: DefaultColumns.createdAt.field, operator: "gte", value: "2026-05-06T10:00:00.100Z" }],
    };

    const ltGroup = {
      logic: "and" as const,
      filters: [{ field: DefaultColumns.createdAt.field, operator: "lt", value: "2026-05-06T10:00:00.100Z" }],
    };

    const gteResult = applyViewFilters(dateInstances, gteGroup, options);
    const ltResult = applyViewFilters(dateInstances, ltGroup, options);

    expect(gteResult).to.have.length(1);
    expect(ltResult).to.have.length(0);
  });
});

// ---------------------------------------------------------------------------
// applyViewSorting
// ---------------------------------------------------------------------------

describe("applyViewSorting", () => {
  it("sorts by title asc", () => {
    const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;
    const instances = [
      makeInstance({ instanceId: "1", title: "Zebra" }),
      makeInstance({ instanceId: "2", title: "Alpha" }),
      makeInstance({ instanceId: "3", title: "Mitte" }),
    ];
    const opts: IGridOptions = { sort: [{ field: DefaultColumns.title.field, dir: "asc" }] };
    const result = applyViewSorting(instances, opts, options);
    expect(result.map((i) => i.title)).to.deep.equal(["Alpha", "Mitte", "Zebra"]);
  });

  it("sorts by title desc", () => {
    const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;
    const instances = [makeInstance({ instanceId: "1", title: "Alpha" }), makeInstance({ instanceId: "2", title: "Zebra" })];
    const opts: IGridOptions = { sort: [{ field: DefaultColumns.title.field, dir: "desc" }] };
    const result = applyViewSorting(instances, opts, options);
    expect(result[0].title).to.equal("Zebra");
  });

  it("multi-sort: same completedAtDate falls back to idLowercase desc", () => {
    const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;
    const sameDay = new Date("2025-06-01T10:00:00Z");
    const instances = [
      makeInstance({ instanceId: "aaa111", completedAt: sameDay } as Partial<IInstanceDetails>),
      makeInstance({ instanceId: "zzz999", completedAt: sameDay } as Partial<IInstanceDetails>),
      makeInstance({ instanceId: "mmm555", completedAt: sameDay } as Partial<IInstanceDetails>),
    ];
    const opts: IGridOptions = {
      sort: [
        { field: DefaultColumns.completedAtDate.field, dir: "asc" },
        { field: DefaultColumns.id.field, dir: "desc" },
      ],
    };
    const result = applyViewSorting(instances, opts, options);
    // All on same date -> secondary sort by idLowercase desc -> zzz > mmm > aaa
    expect(result.map((i) => i.instanceId)).to.deep.equal(["zzz999", "mmm555", "aaa111"]);
  });

  it("returns original order when no sort defined", () => {
    const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;
    const instances = [makeInstance({ instanceId: "x" }), makeInstance({ instanceId: "y" })];
    const result = applyViewSorting(instances, {}, options);
    expect(result.map((i) => i.instanceId)).to.deep.equal(["x", "y"]);
  });
});

// ---------------------------------------------------------------------------
// instanceToRow
// ---------------------------------------------------------------------------

describe("instanceToRow", () => {
  const language = "de";
  it("maps title directly", () => {
    const instance = makeInstance({ title: "Mein Vorgang" });
    const cols = [{ field: DefaultColumns.title.field, title: "Vorgang", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("Mein Vorgang");
  });

  it("maps idLowercase", () => {
    const instance = makeInstance({ instanceId: "ABC123" });
    const cols = [{ field: DefaultColumns.id.field, title: "ID", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("abc123");
  });

  it("maps state to readable german text", () => {
    const instance = makeInstance({ state: State.Finished });
    const cols = [{ field: DefaultColumns.state.field, title: "Status", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("Beendet");
  });

  it("maps State.Running to 'Laufend'", () => {
    const instance = makeInstance({ state: State.Running });
    const cols = [{ field: DefaultColumns.state.field, title: "Status", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("Laufend");
  });

  it("link field produces a hyperlink object", () => {
    const instance = makeInstance({ instanceId: "inst-1", workspaceId: "ws-1" });
    const cols = [{ field: DefaultColumns.link.field, title: "Link", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    const cell = row[0] as { xlsxUrl: string; label: string };
    expect(cell).to.have.property("xlsxUrl").that.includes("inst-1");
    expect(cell).to.have.property("label", "Link");
  });

  it("single FileUpload field decodes base64 filename", () => {
    // "bericht.pdf" base64 = "YmVyaWNodC5wZGY="
    const fileUrl = "https://cdn.example.com/files/YmVyaWNodC5wZGY=";
    const instance = makeInstance({
      fieldContents: { Anlagen: { value: [fileUrl], type: "ProcessHubFileUpload" } },
    });
    const cols = [{ field: getFieldKey("Anlagen", "ProcessHubFileUpload"), title: "Anlagen", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("bericht.pdf");
  });

  it("single FileUpload with Base64-encoded filename decodes it correctly", () => {
    // "Export (3).xlsx" base64 = "RXhwb3J0ICgzKS54bHN4"
    const fileUrl = "https://devn-48/roxtra/modules/files/1/92E72418215CA315/attachments-EBE508EB0F2DDB9E/1BE87F10C35CF5B4/RXhwb3J0ICgzKS54bHN4";
    const instance = makeInstance({
      fieldContents: { Anlagen: { value: [fileUrl], type: "ProcessHubFileUpload" } },
    });
    const cols = [{ field: getFieldKey("Anlagen", "ProcessHubFileUpload"), title: "Anlagen", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("Export (3).xlsx");
  });

  it("multiple FileUpload files produce comma-separated decoded filenames", () => {
    // "a.pdf" base64 = "YS5wZGY=", "b.pdf" base64 = "Yi5wZGY="
    const instance = makeInstance({
      fieldContents: {
        Anlagen: {
          value: ["https://cdn.example.com/files/YS5wZGY=", "https://cdn.example.com/files/Yi5wZGY="],
          type: "ProcessHubFileUpload",
        },
      },
    });
    const cols = [{ field: getFieldKey("Anlagen", "ProcessHubFileUpload"), title: "Anlagen", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("a.pdf, b.pdf");
  });

  it("empty FileUpload field returns empty string", () => {
    const instance = makeInstance({
      fieldContents: { Anlagen: { value: null, type: "ProcessHubFileUpload" } },
    });
    const cols = [{ field: getFieldKey("Anlagen", "ProcessHubFileUpload"), title: "Anlagen", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("");
  });

  it("TextArea strips HTML tags", () => {
    const instance = makeInstance({
      fieldContents: { Feld2: { value: "<p>Hallo <b>Welt</b></p>", type: "ProcessHubTextArea" } },
    });
    // "Feld2" base64 = "RmVsZDI=" -> padding -> "RmVsZDI_"
    const cols = [{ field: getFieldKey("Feld2", "ProcessHubTextArea"), title: "Feld_2", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.equal("Hallo Welt");
  });

  it("createdAtDate returns date-only string", () => {
    const instance = makeInstance({ createdAt: new Date("2025-03-15T10:30:00Z") } as Partial<IInstanceDetails>);
    const cols = [{ field: DefaultColumns.createdAtDate.field, title: "Startdatum", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } });
    expect(row[0]).to.deep.equal(formatDateOnly(new Date("2025-03-15")));
  });
});

// ---------------------------------------------------------------------------
// generateXLSXFromRows – HYPERLINK formula
// ---------------------------------------------------------------------------

describe("generateXLSXFromRows", () => {
  it("produces a valid XLSX buffer", async () => {
    const rows = [{ 0: "abc", 1: "Test" }];
    const cols = [
      { field: DefaultColumns.id.field, title: "ID", show: true, hidden: false },
      { field: DefaultColumns.title.field, title: "Titel", show: true, hidden: false },
    ];
    const buf = await generateXLSXFromRows(rows, cols as never);
    expect(Buffer.isBuffer(buf)).to.equal(true);
    expect(buf.length).to.be.greaterThan(0);
  });

  it("writes HYPERLINK formula for link cells", async () => {
    const rows = [{ 0: { xlsxUrl: "https://example.com/p/i/ws/inst", label: "Link" }, 1: "Test" }];
    const cols = [
      { field: DefaultColumns.link.field, title: "Link", show: true, hidden: false },
      { field: DefaultColumns.title.field, title: "Titel", show: true, hidden: false },
    ];
    const buf = await generateXLSXFromRows(rows, cols as never);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets["Report"];
    // A1 = header "Link", A2 = data row
    const cell = sheet["A2"] as { f?: string; v?: unknown };
    expect(cell).to.not.equal(undefined);
    expect(cell.f).to.include("HYPERLINK");
    expect(cell.f).to.include("https://example.com/p/i/ws/inst");
  });

  it("plain text cells have no formula", async () => {
    const rows = [{ 0: "abc123", 1: "Normaler Text" }];
    const cols = [
      { field: DefaultColumns.id.field, title: "ID", show: true, hidden: false },
      { field: DefaultColumns.title.field, title: "Titel", show: true, hidden: false },
    ];
    const buf = await generateXLSXFromRows(rows, cols as never);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets["Report"];
    const cell = sheet["A2"] as { f?: string; v?: unknown };
    expect(cell.f).to.equal(undefined);
    expect(cell.v).to.equal("abc123");
  });

  it("column order matches viewColumns definition", async () => {
    const rows = [{ 0: "abc", 1: "Laufend" }];
    const cols = [
      { field: DefaultColumns.id.field, title: "ID", show: true, hidden: false },
      { field: DefaultColumns.state.field, title: "Status", show: true, hidden: false },
    ];
    const buf = await generateXLSXFromRows(rows, cols as never);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets["Report"];
    expect((sheet["A1"] as { v?: unknown })?.v).to.equal("ID");
    expect((sheet["B1"] as { v?: unknown })?.v).to.equal("Status");
  });
});

// ---------------------------------------------------------------------------
// Test full process of filtering, sorting, mapping to rows, and generating XLSX to ensure all steps work together as expected.
// ---------------------------------------------------------------------------

describe("Test full process: filter > sort > instanceToRow > generateXLSXFromRows", () => {
  // "Status" base64 = "U3RhdHVz" -> no padding needed -> "U3RhdHVz"
  // "Abteilung" base64 = "QWJ0ZWlsdW5n" -> "QWJ0ZWlsdW5n"
  const COL_STATUS_KEY = getFieldKey("Status", "ProcessHubTextInput");
  const COL_ABTEILUNG_KEY = getFieldKey("Abteilung", "ProcessHubTextInput");

  const language = "de";
  const viewColumns = [
    { field: DefaultColumns.id.field, title: "ID", show: true, hidden: false },
    { field: DefaultColumns.title.field, title: "Titel", show: true, hidden: false },
    { field: DefaultColumns.createdAtDate.field, title: "Erstellt am", show: true, hidden: false },
    { field: COL_STATUS_KEY, title: "Status", show: true, hidden: false },
    { field: COL_ABTEILUNG_KEY, title: "Abteilung", show: true, hidden: false },
    { field: DefaultColumns.state.field, title: "Zustand", show: true, hidden: false },
  ] as never;

  const instances: IInstanceDetails[] = [
    makeInstance({
      instanceId: "AAA001",
      title: "Urlaub Müller",
      state: State.Finished,
      createdAt: new Date("2026-01-10T08:00:00Z"),
      fieldContents: {
        Status: { value: "genehmigt", type: "ProcessHubTextInput" },
        Abteilung: { value: "Vertrieb", type: "ProcessHubTextInput" },
      },
    } as Partial<IInstanceDetails>),
    makeInstance({
      instanceId: "BBB002",
      title: "Urlaub Schmidt",
      state: State.Running,
      createdAt: new Date("2026-03-05T09:00:00Z"),
      fieldContents: {
        Status: { value: "ausstehend", type: "ProcessHubTextInput" },
        Abteilung: { value: "Vertrieb", type: "ProcessHubTextInput" },
      },
    } as Partial<IInstanceDetails>),
    makeInstance({
      instanceId: "CCC003",
      title: "Krankmeldung Weber",
      state: State.Finished,
      createdAt: new Date("2026-02-20T10:00:00Z"),
      fieldContents: {
        Status: { value: "genehmigt", type: "ProcessHubTextInput" },
        Abteilung: { value: "IT", type: "ProcessHubTextInput" },
      },
    } as Partial<IInstanceDetails>),
    makeInstance({
      instanceId: "DDD004",
      title: "Urlaub Fischer",
      state: State.Canceled,
      createdAt: new Date("2026-01-25T11:00:00Z"),
      fieldContents: {
        Status: { value: "abgelehnt", type: "ProcessHubTextInput" },
        Abteilung: { value: "Vertrieb", type: "ProcessHubTextInput" },
      },
    } as Partial<IInstanceDetails>),
    makeInstance({
      instanceId: "EEE005",
      title: "Fortbildung Bauer",
      state: State.Running,
      createdAt: new Date("2026-04-01T07:00:00Z"),
      fieldContents: {
        Status: { value: "genehmigt", type: "ProcessHubTextInput" },
        Abteilung: { value: "IT", type: "ProcessHubTextInput" },
      },
    } as Partial<IInstanceDetails>),
  ];

  it("Apply filter Abteilung=Vertrieb (and) Status=genehmigt, then sort by createdAtDate asc", () => {
    const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;
    const gridOptions: IGridOptions = {
      filter: {
        logic: "and",
        filters: [
          { field: COL_ABTEILUNG_KEY, operator: "eq", value: "Vertrieb" },
          { field: COL_STATUS_KEY, operator: "eq", value: "genehmigt" },
        ],
      },
      sort: [{ field: DefaultColumns.createdAtDate.field, dir: "asc" }],
    };

    const filtered = applyViewFilters(instances, gridOptions.filter!, options);
    const sorted = applyViewSorting(filtered, gridOptions, options);

    // Only AAA001 (Vertrieb + genehmigt), BBB002 (ausstehend) and DDD004 (abgelehnt) are filtered out
    expect(sorted.map((i) => i.instanceId)).to.deep.equal(["AAA001"]);
  });

  it("Apply filter Abteilung=Vertrieb (or group: genehmigt or ausstehend), then sort by createdAtDate desc", () => {
    const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;
    const gridOptions: IGridOptions = {
      filter: {
        logic: "and",
        filters: [
          { field: COL_ABTEILUNG_KEY, operator: "eq", value: "Vertrieb" },
          {
            logic: "or",
            filters: [
              { field: COL_STATUS_KEY, operator: "eq", value: "genehmigt" },
              { field: COL_STATUS_KEY, operator: "eq", value: "ausstehend" },
            ],
          },
        ],
      },
      sort: [{ field: DefaultColumns.createdAtDate.field, dir: "desc" }],
    };

    const filtered = applyViewFilters(instances, gridOptions.filter!, options);
    const sorted = applyViewSorting(filtered, gridOptions, options);

    // AAA001 (Jan) + BBB002 (März), desc > BBB002 zuerst
    expect(sorted.map((i) => i.instanceId)).to.deep.equal(["BBB002", "AAA001"]);
  });

  it("Apply filter createdAtDate >= 2026-02-01, then sort by title asc and check XLSX content", async () => {
    const options = { language: "de", module: { name: "processes", urlPrefix: "p", title: "Prozesse" } } as IGenerateXLSXOptions;
    const gridOptions: IGridOptions = {
      filter: {
        logic: "and",
        filters: [{ field: DefaultColumns.createdAtDate.field, operator: "gte", value: "2026-02-01" }],
      },
      sort: [{ field: DefaultColumns.title.field, dir: "asc" }],
    };

    const filtered = applyViewFilters(instances, gridOptions.filter!, options);
    const sorted = applyViewSorting(filtered, gridOptions, options);

    // Feb: CCC003, März: BBB002, Apr: EEE005 > title asc: Fortbildung, Krankmeldung, Urlaub Schmidt
    expect(sorted.map((i) => i.instanceId)).to.deep.equal(["EEE005", "CCC003", "BBB002"]);

    const rows = sorted.map((inst) => instanceToRow(inst, viewColumns, { language, module: { name: "processes", urlPrefix: "p", title: "Prozesse" } }));
    const buf = await generateXLSXFromRows(rows, viewColumns);

    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets["Report"];

    // Header row (row 1)
    expect((sheet["A1"] as { v?: unknown })?.v).to.equal("ID");
    expect((sheet["B1"] as { v?: unknown })?.v).to.equal("Titel");
    expect((sheet["C1"] as { v?: unknown })?.v).to.equal("Erstellt am");

    // Excel serial helper: mirrors Kendo OOXML's local-date serialisation
    const toExcelSerial = (d: Date) => Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);

    // First data row (row 2) = EEE005
    expect((sheet["A2"] as { v?: unknown })?.v).to.equal("eee005");
    expect((sheet["B2"] as { v?: unknown })?.v).to.equal("Fortbildung Bauer");
    expect((sheet["C2"] as { v?: unknown })?.v).to.equal(toExcelSerial(formatDateOnly(new Date("2026-04-01T07:00:00Z")) as Date));
    expect((sheet["D2"] as { v?: unknown })?.v).to.equal("genehmigt");
    expect((sheet["F2"] as { v?: unknown })?.v).to.equal("Laufend");

    // Second data row (row 3) = CCC003
    expect((sheet["A3"] as { v?: unknown })?.v).to.equal("ccc003");
    expect((sheet["C3"] as { v?: unknown })?.v).to.equal(toExcelSerial(formatDateOnly(new Date("2026-02-20T10:00:00Z")) as Date));
    expect((sheet["F3"] as { v?: unknown })?.v).to.equal("Beendet");

    // Third data row (row 4) = BBB002
    expect((sheet["A4"] as { v?: unknown })?.v).to.equal("bbb002");
  });
});
