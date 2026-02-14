import { describe, expect, it } from "vitest";
import {
  parseGroupGradeImportRow,
  parseGroupIdImportRow,
  parseHeaderBasedImportRow,
} from "./groupImport";

describe("group import parser", () => {
  it("parses group and group id for group-id mode", () => {
    expect(parseGroupIdImportRow(["2-EEA-A", "157134"])).toEqual({
      group: "2-EEA-A",
      groupId: "157134",
    });
  });

  it("keeps empty group id when second column is blank", () => {
    expect(parseGroupIdImportRow(["2-EEA-B", ""])).toEqual({
      group: "2-EEA-B",
      groupId: "",
    });
  });

  it("parses group and grade without comment for grade mode", () => {
    expect(parseGroupGradeImportRow(["2-EEA-H", "3"])).toEqual({
      group: "2-EEA-H",
      grade: "3",
      feedback: null,
    });
  });

  it("parses optional comment for grade mode", () => {
    expect(parseGroupGradeImportRow(["2-EEA-A", "6", "bravo"])).toEqual({
      group: "2-EEA-A",
      grade: "6",
      feedback: "bravo",
    });
  });

  it("returns null when group is missing", () => {
    expect(parseGroupIdImportRow(["", "157134"])).toBeNull();
    expect(parseGroupGradeImportRow(["", "6", "ok"])).toBeNull();
  });

  it("supports tab-separated group-id rows from spreadsheet paste", () => {
    expect(parseGroupIdImportRow(["2-EEA-A", "157134", ""])).toEqual({
      group: "2-EEA-A",
      groupId: "157134",
    });
  });

  it("parses header-based import with groupe/id/note and extra columns as HTML", () => {
    expect(
      parseHeaderBasedImportRow({
        groupe: "2-EEA-A",
        id: "157134",
        note: "6",
        bonus: "Excellent structure",
        attention: "Improve intro",
      }),
    ).toEqual({
      group: "2-EEA-A",
      groupId: "157134",
      grade: "6",
      feedback:
        "<p><strong>bonus:</strong> Excellent structure</p><p><strong>attention:</strong> Improve intro</p><p><strong>Note:</strong> 6</p>",
    });
  });

  it("supports accented header names and escapes html content", () => {
    expect(
      parseHeaderBasedImportRow({
        Groupe: "2-EEA-B",
        ID: "216453",
        Note: "4",
        Remarque: "<b>ok</b>",
      }),
    ).toEqual({
      group: "2-EEA-B",
      groupId: "216453",
      grade: "4",
      feedback:
        "<p><strong>Remarque:</strong> &lt;b&gt;ok&lt;/b&gt;</p><p><strong>Note:</strong> 4</p>",
    });
  });

  it("returns null for header-based row when group is missing", () => {
    expect(parseHeaderBasedImportRow({ id: "157134", note: "6" })).toBeNull();
  });
});
