// D2 (@terrastruct/d2 v0.7.0) renders shape fills as a literal `fill="#RRGGBB"`
// attribute directly on the <rect>/<path> element (not a generated CSS
// class) — confirmed against a real render captured in
// lib/__fixtures__/d2-sample.svg. Label color and size are likewise
// attribute-based on the <text> element: `fill="#ffffff"` for color, and
// font size lives inline in the `style="...font-size:16px"` attribute
// rather than as a standalone `font-size="N"` attribute. This module's
// transform therefore rewrites `fill="..."` attributes directly and
// treats `font-size="N"` as the floor-enforcement target (matching the
// authored contract this module exposes to callers).

export type DiagramRole =
  | "client"
  | "network"
  | "service"
  | "cache"
  | "datastore"
  | "queue";

/** Display colors are theme-invariant by design — the diagram canvas is
 *  always paper in both themes (see the spec's "Canvas is always paper").
 *  This is the ONLY module allowed to hold diagram hexes. */
export const DIAGRAM_DISPLAY: Record<
  DiagramRole,
  { fill: string; stroke: string; label: string }
> = {
  client: { fill: "#62c8f2", stroke: "#1c6f96", label: "#0d1b24" },
  network: { fill: "#a99cf5", stroke: "#4f3fb0", label: "#0d1b24" },
  service: { fill: "#4fd1a5", stroke: "#0c7a5c", label: "#0d1b24" },
  cache: { fill: "#f9b64e", stroke: "#a76a10", label: "#0d1b24" },
  datastore: { fill: "#f78a95", stroke: "#a63241", label: "#0d1b24" },
  queue: { fill: "#b9c0cc", stroke: "#5a6472", label: "#0d1b24" },
};

export const DIAGRAM_EDGE = {
  stroke: "#5c6470",
  labelBg: "#ffffff",
  labelBorder: "#d6d9e0",
  labelText: "#3d4450",
};

/** The hexes already authored across 392 nodes in content/ are treated as
 *  semantic role keys, not as appearance. Nothing in content/ changes. */
export const AUTHORED_FILL_TO_ROLE: Record<string, DiagramRole> = {
  "#3b6fd6": "client",
  "#5b4fbf": "network",
  "#0e7c86": "service",
  "#b8722a": "cache",
  "#b23a48": "datastore",
  "#4b5262": "queue",
};

export const DIAGRAM_LABEL_MIN_PX = 15;

const ROLE_ORDER: DiagramRole[] = [
  "client",
  "network",
  "service",
  "cache",
  "datastore",
  "queue",
];

const AUTHORED_LABEL_WHITE = /#ffffff/gi;

export function retintD2Svg(svg: string): { svg: string; roles: DiagramRole[] } {
  const found = new Set<DiagramRole>();
  let out = svg;

  for (const [authored, role] of Object.entries(AUTHORED_FILL_TO_ROLE)) {
    const pattern = new RegExp(authored, "gi");
    if (pattern.test(out)) {
      found.add(role);
      out = out.replace(pattern, DIAGRAM_DISPLAY[role].fill);
    }
  }

  // Every role's label color is the same value, so white label text can be
  // rewritten in one pass without tracking which shape it belongs to.
  if (found.size > 0) {
    out = out.replace(AUTHORED_LABEL_WHITE, DIAGRAM_DISPLAY.client.label);
  }

  out = out.replace(
    /font-size="(\d+(?:\.\d+)?)"/g,
    (whole, size: string) =>
      Number(size) < DIAGRAM_LABEL_MIN_PX
        ? `font-size="${DIAGRAM_LABEL_MIN_PX}"`
        : whole,
  );

  return { svg: out, roles: ROLE_ORDER.filter((role) => found.has(role)) };
}
