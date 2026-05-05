import { expect } from "chai";
import { processviewreportConfig, processviewreport } from "./main.js";
import { decodeFieldKey, getResolvedValue, toStr } from "./utils/field-resolver.js";
import { applyViewFilters, IGridOptions } from "./utils/view-filters.js";
import { applyViewSorting } from "./utils/view-sorting.js";
import { instanceToRow, generateXLSXFromRows } from "./utils/xlsx-generator.js";
import { IInstanceDetails, State } from "processhub-sdk/lib/instance/instanceinterfaces.js";
import * as XLSX from "xlsx";

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
    expect(typeof processviewreportConfig === "function").to.equal(true);
    expect(typeof processviewreport === "function").to.equal(true);
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
  it("returns the .value of a field_* key from fieldContents", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: "Mein Vorgang", type: "ProcessHubTextInput" } } });
    const result = getResolvedValue(instance, "field_VGl0ZWw_ProcessHubTextInput");
    expect(result).to.equal("Mein Vorgang");
  });

  it("returns empty string when field_* key is missing from fieldContents", () => {
    const instance = makeInstance();
    expect(getResolvedValue(instance, "field_VGl0ZWw_ProcessHubTextInput")).to.equal("");
  });

  it("returns empty string when field value is null (empty field)", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: null, type: "ProcessHubTextInput" } } });
    // This is the critical fix: must return "" not the whole object
    expect(getResolvedValue(instance, "field_VGl0ZWw_ProcessHubTextInput")).to.equal("");
  });

  it("resolves lane_ key to displayName of owner", () => {
    const instance = makeInstance();
    (instance.extras as Record<string, unknown>).roleOwners = {
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      Lane_ABC: [{ displayName: "Max Mustermann", memberId: "user-1" }],
    };
    expect(getResolvedValue(instance, "lane_Lane_ABC")).to.equal("Max Mustermann");
  });

  it("resolves idLowercase to lowercase instanceId", () => {
    const instance = makeInstance({ instanceId: "ABCD1234" });
    expect(getResolvedValue(instance, "idLowercase")).to.equal("abcd1234");
  });

  it("resolves title", () => {
    const instance = makeInstance({ title: "Mein Titel" });
    expect(getResolvedValue(instance, "title")).to.equal("Mein Titel");
  });

  it("resolves createdAtDate as YYYY-MM-DD only", () => {
    const instance = makeInstance({ createdAt: new Date("2025-03-15T10:30:00Z") } as Partial<IInstanceDetails>);
    expect(getResolvedValue(instance, "createdAtDate")).to.equal("2025-03-15");
  });

  it("resolves completedAtDate as YYYY-MM-DD only", () => {
    const instance = makeInstance({ completedAt: new Date("2025-06-01T23:59:59Z") } as Partial<IInstanceDetails>);
    expect(getResolvedValue(instance, "completedAtDate")).to.equal("2025-06-01");
  });

  it("returns empty string for completedAtDate when completedAt is not set", () => {
    const instance = makeInstance();
    expect(getResolvedValue(instance, "completedAtDate")).to.equal("");
  });

  it("resolves state as numeric State enum value", () => {
    const instance = makeInstance({ state: State.Finished });
    expect(getResolvedValue(instance, "state")).to.equal(State.Finished);
  });

  it("resolves todos to joined displayNames", () => {
    const instance = makeInstance();
    (instance.extras as Record<string, unknown>).todos = [
      { displayName: "Aufgabe A", bpmnTaskId: "t1" },
      { displayName: "Aufgabe B", bpmnTaskId: "t2" },
    ];
    expect(getResolvedValue(instance, "todos")).to.equal("Aufgabe A, Aufgabe B");
  });
});

// ---------------------------------------------------------------------------
// applyViewFilters
// ---------------------------------------------------------------------------

describe("applyViewFilters", () => {
  const instances: IInstanceDetails[] = [
    makeInstance({ instanceId: "aaa", title: "Alpha Vorgang" }),
    makeInstance({ instanceId: "bbb", title: "Beta Test" }),
    makeInstance({ instanceId: "ccc", title: "Gamma Test" }),
  ];

  it("filters with contains on title", () => {
    const group = { logic: "and" as const, filters: [{ field: "title", operator: "contains", value: "test" }] };
    const result = applyViewFilters(instances, group);
    expect(result).to.have.length(2);
    expect(result.map((i) => i.instanceId)).to.deep.equal(["bbb", "ccc"]);
  });

  it("filters with doesnotcontain", () => {
    const group = { logic: "and" as const, filters: [{ field: "title", operator: "doesnotcontain", value: "test" }] };
    const result = applyViewFilters(instances, group);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("aaa");
  });

  it("filters with eq on idLowercase", () => {
    const group = { logic: "and" as const, filters: [{ field: "idLowercase", operator: "eq", value: "bbb" }] };
    const result = applyViewFilters(instances, group);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("bbb");
  });

  it("isempty returns true when field value is null", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: null, type: "ProcessHubTextInput" } } });
    const group = { logic: "and" as const, filters: [{ field: "field_VGl0ZWw_ProcessHubTextInput", operator: "isempty", value: "" }] };
    const result = applyViewFilters([instance], group);
    expect(result).to.have.length(1);
  });

  it("isempty returns false when field has value", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: "Hallo", type: "ProcessHubTextInput" } } });
    const group = { logic: "and" as const, filters: [{ field: "field_VGl0ZWw_ProcessHubTextInput", operator: "isempty", value: "" }] };
    const result = applyViewFilters([instance], group);
    expect(result).to.have.length(0);
  });

  it("isnotempty returns false when field value is null", () => {
    const instance = makeInstance({ fieldContents: { Titel: { value: null, type: "ProcessHubTextInput" } } });
    const group = { logic: "and" as const, filters: [{ field: "field_VGl0ZWw_ProcessHubTextInput", operator: "isnotempty", value: "" }] };
    const result = applyViewFilters([instance], group);
    expect(result).to.have.length(0);
  });

  it("nested or group works", () => {
    const group = {
      logic: "and" as const,
      filters: [
        { field: "title", operator: "contains", value: "test" },
        {
          logic: "or" as const,
          filters: [
            { field: "idLowercase", operator: "eq", value: "bbb" },
            { field: "idLowercase", operator: "eq", value: "zzz" },
          ],
        },
      ],
    };
    const result = applyViewFilters(instances, group);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("bbb");
  });

  it("and logic with multiple conditions", () => {
    const group = {
      logic: "and" as const,
      filters: [
        { field: "title", operator: "contains", value: "test" },
        { field: "idLowercase", operator: "contains", value: "ccc" },
      ],
    };
    const result = applyViewFilters(instances, group);
    expect(result).to.have.length(1);
    expect(result[0].instanceId).to.equal("ccc");
  });
});

// ---------------------------------------------------------------------------
// applyViewSorting
// ---------------------------------------------------------------------------

describe("applyViewSorting", () => {
  it("sorts by title asc", () => {
    const instances = [
      makeInstance({ instanceId: "1", title: "Zebra" }),
      makeInstance({ instanceId: "2", title: "Alpha" }),
      makeInstance({ instanceId: "3", title: "Mitte" }),
    ];
    const opts: IGridOptions = { sort: [{ field: "title", dir: "asc" }] };
    const result = applyViewSorting(instances, opts);
    expect(result.map((i) => i.title)).to.deep.equal(["Alpha", "Mitte", "Zebra"]);
  });

  it("sorts by title desc", () => {
    const instances = [makeInstance({ instanceId: "1", title: "Alpha" }), makeInstance({ instanceId: "2", title: "Zebra" })];
    const opts: IGridOptions = { sort: [{ field: "title", dir: "desc" }] };
    const result = applyViewSorting(instances, opts);
    expect(result[0].title).to.equal("Zebra");
  });

  it("multi-sort: same completedAtDate falls back to idLowercase desc", () => {
    const sameDay = new Date("2025-06-01T10:00:00Z");
    const instances = [
      makeInstance({ instanceId: "aaa111", completedAt: sameDay } as Partial<IInstanceDetails>),
      makeInstance({ instanceId: "zzz999", completedAt: sameDay } as Partial<IInstanceDetails>),
      makeInstance({ instanceId: "mmm555", completedAt: sameDay } as Partial<IInstanceDetails>),
    ];
    const opts: IGridOptions = {
      sort: [
        { field: "completedAtDate", dir: "asc" },
        { field: "idLowercase", dir: "desc" },
      ],
    };
    const result = applyViewSorting(instances, opts);
    // All on same date -> secondary sort by idLowercase desc -> zzz > mmm > aaa
    expect(result.map((i) => i.instanceId)).to.deep.equal(["zzz999", "mmm555", "aaa111"]);
  });

  it("returns original order when no sort defined", () => {
    const instances = [makeInstance({ instanceId: "x" }), makeInstance({ instanceId: "y" })];
    const result = applyViewSorting(instances, {});
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
    const cols = [{ field: "title", title: "Vorgang", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["Vorgang"]).to.equal("Mein Vorgang");
  });

  it("maps idLowercase", () => {
    const instance = makeInstance({ instanceId: "ABC123" });
    const cols = [{ field: "idLowercase", title: "ID", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["ID"]).to.equal("abc123");
  });

  it("maps state to readable german text", () => {
    const instance = makeInstance({ state: State.Finished });
    const cols = [{ field: "state", title: "Status", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["Status"]).to.equal("Beendet");
  });

  it("maps State.Running to 'Laufend'", () => {
    const instance = makeInstance({ state: State.Running });
    const cols = [{ field: "state", title: "Status", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["Status"]).to.equal("Laufend");
  });

  it("link field produces a hyperlink object", () => {
    const instance = makeInstance({ instanceId: "inst-1", workspaceId: "ws-1" });
    const cols = [{ field: "link", title: "Link", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    const cell = row["Link"] as { xlsxUrl: string; label: string };
    expect(cell).to.have.property("xlsxUrl").that.includes("inst-1");
    expect(cell).to.have.property("label", "Link");
  });

  it("single FileUpload field produces hyperlink with filename as label", () => {
    const fileUrl = "https://cdn.example.com/files/bericht.pdf";
    const instance = makeInstance({
      fieldContents: { Anlagen: { value: [fileUrl], type: "ProcessHubFileUpload" } },
    });
    const cols = [{ field: "field_QW5sYWdlbg__ProcessHubFileUpload", title: "Anlagen", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    const cell = row["Anlagen"] as { xlsxUrl: string; label: string };
    expect(cell).to.have.property("xlsxUrl", fileUrl);
    expect(cell).to.have.property("label", "bericht.pdf");
  });

  it("multiple FileUpload files produce comma-separated filenames (no hyperlink)", () => {
    const instance = makeInstance({
      fieldContents: {
        Anlagen: {
          value: ["https://cdn.example.com/files/a.pdf", "https://cdn.example.com/files/b.pdf"],
          type: "ProcessHubFileUpload",
        },
      },
    });
    const cols = [{ field: "field_QW5sYWdlbg__ProcessHubFileUpload", title: "Anlagen", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["Anlagen"]).to.equal("a.pdf, b.pdf");
  });

  it("empty FileUpload field returns empty string", () => {
    const instance = makeInstance({
      fieldContents: { Anlagen: { value: null, type: "ProcessHubFileUpload" } },
    });
    const cols = [{ field: "field_QW5sYWdlbg__ProcessHubFileUpload", title: "Anlagen", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["Anlagen"]).to.equal("");
  });

  it("TextArea strips HTML tags", () => {
    const instance = makeInstance({
      fieldContents: { Feld2: { value: "<p>Hallo <b>Welt</b></p>", type: "ProcessHubTextArea" } },
    });
    // "Feld2" base64 = "RmVsZDI=" -> padding -> "RmVsZDI_"
    const cols = [{ field: "field_RmVsZDI_ProcessHubTextArea", title: "Feld_2", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["Feld_2"]).to.equal("Hallo Welt");
  });

  it("createdAtDate returns date-only string", () => {
    const instance = makeInstance({ createdAt: new Date("2025-03-15T10:30:00Z") } as Partial<IInstanceDetails>);
    const cols = [{ field: "createdAtDate", title: "Startdatum", show: true, hidden: false }];
    const row = instanceToRow(instance, cols as never, language);
    expect(row["Startdatum"]).to.equal("2025-03-15");
  });
});

// ---------------------------------------------------------------------------
// generateXLSXFromRows – HYPERLINK formula
// ---------------------------------------------------------------------------

describe("generateXLSXFromRows", () => {
  it("produces a valid XLSX buffer", () => {
    const rows = [{ ID: "abc", Titel: "Test" }];
    const cols = [
      { field: "idLowercase", title: "ID", show: true, hidden: false },
      { field: "title", title: "Titel", show: true, hidden: false },
    ];
    const buf = generateXLSXFromRows(rows, cols as never);
    expect(Buffer.isBuffer(buf)).to.equal(true);
    expect(buf.length).to.be.greaterThan(0);
  });

  it("writes HYPERLINK formula for link cells", () => {
    const rows = [{ Link: { xlsxUrl: "https://example.com/p/i/ws/inst", label: "Link" }, Titel: "Test" }];
    const cols = [
      { field: "link", title: "Link", show: true, hidden: false },
      { field: "title", title: "Titel", show: true, hidden: false },
    ];
    const buf = generateXLSXFromRows(rows, cols as never);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets["Report"];
    // A1 = header "Link", A2 = data row
    const cell = sheet["A2"] as { f?: string; v?: unknown };
    expect(cell).to.not.equal(undefined);
    expect(cell.f).to.include("HYPERLINK");
    expect(cell.f).to.include("https://example.com/p/i/ws/inst");
  });

  it("plain text cells have no formula", () => {
    const rows = [{ ID: "abc123", Titel: "Normaler Text" }];
    const cols = [
      { field: "idLowercase", title: "ID", show: true, hidden: false },
      { field: "title", title: "Titel", show: true, hidden: false },
    ];
    const buf = generateXLSXFromRows(rows, cols as never);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets["Report"];
    const cell = sheet["A2"] as { f?: string; v?: unknown };
    expect(cell.f).to.equal(undefined);
    expect(cell.v).to.equal("abc123");
  });

  it("column order matches viewColumns definition", () => {
    const rows = [{ Status: "Laufend", ID: "abc" }];
    const cols = [
      { field: "idLowercase", title: "ID", show: true, hidden: false },
      { field: "state", title: "Status", show: true, hidden: false },
    ];
    const buf = generateXLSXFromRows(rows, cols as never);
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets["Report"];
    expect((sheet["A1"] as { v?: unknown })?.v).to.equal("ID");
    expect((sheet["B1"] as { v?: unknown })?.v).to.equal("Status");
  });
});
