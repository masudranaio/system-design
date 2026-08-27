// @vitest-environment node
//
// D2's WASM instance hangs under vitest's default jsdom environment
// (confirmed live: a plain compile()+render() that resolves in ~1s under
// plain node timed out at 30s here). Node environment matches how
// renderD2 actually runs (a Next.js Server Component, not the browser).
import { describe, expect, it } from "vitest";
import { renderD2 } from "./render-d2";
import { DIAGRAM_DISPLAY } from "./diagram-palette";

const SRC = `A: Locker Service { style.fill: "#0e7c86"; style.font-color: "#ffffff" }
B: Redis Cache { style.fill: "#b8722a"; style.font-color: "#ffffff" }
A -> B: hold (TTL)
`;

describe("renderD2", () => {
  it("returns SVG retinted to the display palette with the roles it found", async () => {
    const result = await renderD2(SRC);
    if ("error" in result) throw new Error(result.error);
    expect(result.svg).toContain(DIAGRAM_DISPLAY.service.fill);
    expect(result.svg).not.toContain("#0e7c86");
    expect(result.roles).toEqual(["service", "cache"]);
  }, 30_000);

  it("reports a compile error instead of throwing", async () => {
    const result = await renderD2("A -> ->");
    expect("error" in result).toBe(true);
  }, 30_000);
});
