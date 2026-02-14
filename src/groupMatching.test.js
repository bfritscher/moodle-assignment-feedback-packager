import { describe, expect, it } from "vitest";
import { doesFileMatchGroup, resolveKnownGroupName } from "./groupMatching";

describe("group matching", () => {
  const groups = ["2-EEA-A", "2-EEA-B", "2-EEA-C", "2-EEA-D", "2-EEA-E"];

  it("matches stripped short file names to the right groups", () => {
    expect(doesFileMatchGroup("A.pdf", "2-EEA-A", groups)).toBe(true);
    expect(doesFileMatchGroup("A.pdf", "2-EEA-C", groups)).toBe(false);
    expect(doesFileMatchGroup("B.pdf", "2-EEA-B", groups)).toBe(true);
    expect(doesFileMatchGroup("B.pdf", "2-EEA-D", groups)).toBe(false);
  });

  it("matches full Moodle-like file names directly", () => {
    expect(doesFileMatchGroup("2-EEA-C.pdf", "2-EEA-C", groups)).toBe(true);
    expect(doesFileMatchGroup("2-EEA-D.pdf", "2-EEA-D", groups)).toBe(true);
    expect(doesFileMatchGroup("2-EEA-C.pdf", "2-EEA-A", groups)).toBe(false);
  });

  it("resolves partial imported group names via stripped prefix", () => {
    expect(resolveKnownGroupName("A", groups)).toBe("2-EEA-A");
    expect(resolveKnownGroupName("B", groups)).toBe("2-EEA-B");
    expect(resolveKnownGroupName("2-EEA-C", groups)).toBe("2-EEA-C");
  });
});
