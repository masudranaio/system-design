// @vitest-environment node
//
// This suite is pure string transforms with no DOM dependency. The
// default jsdom environment (see vitest.config.ts) rewrites
// `import.meta.url` to the jsdom document location, which breaks the
// `readFileSync(new URL(...))` fixture read below (it resolves to an
// http: URL instead of file:). Node environment keeps `import.meta.url`
// as the real module file: URL.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AUTHORED_FILL_TO_ROLE, DIAGRAM_DISPLAY, retintD2Svg } from "./diagram-palette";

const FIXTURE = readFileSync(new URL("./__fixtures__/d2-sample.svg", import.meta.url), "utf8");

describe("retintD2Svg", () => {
  it("replaces every authored role fill with its display fill", () => {
    const { svg } = retintD2Svg(FIXTURE);
    for (const authored of Object.keys(AUTHORED_FILL_TO_ROLE)) {
      expect(svg).not.toContain(authored);
    }
    expect(svg).toContain(DIAGRAM_DISPLAY.service.fill);
    expect(svg).toContain(DIAGRAM_DISPLAY.client.fill);
  });

  it("reports the roles it found, deduped and in palette order", () => {
    const { roles } = retintD2Svg(FIXTURE);
    expect(roles).toEqual(["client", "network", "service", "cache"]);
  });

  it("rewrites white node labels to the dark label color", () => {
    const { svg } = retintD2Svg(FIXTURE);
    expect(svg).toContain(DIAGRAM_DISPLAY.service.label);
  });

  it("raises any label font-size below the floor to 15px", () => {
    const { svg } = retintD2Svg('<text font-size="12" fill="#ffffff">x</text>');
    expect(svg).toContain('font-size="15"');
  });

  it("leaves an unrecognized fill untouched", () => {
    const input = '<rect fill="#123456"/>';
    expect(retintD2Svg(input).svg).toBe(input);
  });

  it("is idempotent", () => {
    const once = retintD2Svg(FIXTURE).svg;
    expect(retintD2Svg(once).svg).toBe(once);
  });

  it("leaves the canvas background and shared theme CSS untouched", () => {
    // Regression: a document-wide #ffffff replace also caught D2's
    // canvas-background rect (fill="#FFFFFF" class=" fill-N7") and the
    // shared .fill-N7/.stroke-N7/.background-color-N7/.color-N7 CSS
    // rules, recoloring the "always paper" diagram background to
    // near-black. Only <text> label fills should change.
    const { svg } = retintD2Svg(FIXTURE);
    expect(svg).toContain('fill="#FFFFFF" class=" fill-N7"');
    expect(svg).toContain(".fill-N7{fill:#FFFFFF;}");
    expect(svg).toContain(".stroke-N7{stroke:#FFFFFF;}");
    expect(svg).toContain(".background-color-N7{background-color:#FFFFFF;}");
    expect(svg).toContain(".color-N7{color:#FFFFFF;}");
  });
});
