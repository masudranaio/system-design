import { describe, it, expect } from "vitest";
import { bandFor } from "./SelfScoreBand";

describe("bandFor", () => {
  it("returns Novice below 34%", () => {
    expect(bandFor(0).label).toBe("Novice");
    expect(bandFor(33).label).toBe("Novice");
  });

  it("returns Practicing from 34% up to but not including 100%", () => {
    expect(bandFor(34).label).toBe("Practicing");
    expect(bandFor(67).label).toBe("Practicing");
    expect(bandFor(99).label).toBe("Practicing");
  });

  it("returns Interview-ready only at 100%", () => {
    expect(bandFor(100).label).toBe("Interview-ready");
  });
});
