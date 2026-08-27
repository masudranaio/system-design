import type { DiagramRole } from "./diagram-palette";

export type { DiagramRole } from "./diagram-palette";

const ROLE_KEYWORDS: Record<DiagramRole, RegExp> = {
  cache: /\b(cache|redis)\b/i,
  datastore: /\b(db|database|sql|dynamo|store)\b/i,
  queue: /\b(queue|kafka|sqs|mq|topic)\b/i,
  network: /\b(cdn|gateway|load balancer|lb|waiting room)\b/i,
  client: /\b(client|browser|mobile|app|user)\b/i,
  service: /\b(service|worker|handler)\b/i,
};

// Order matters: more specific roles are checked before the generic
// "service" catch-all, so e.g. "Cache service" reads as cache, not service.
const ROLE_PRIORITY: DiagramRole[] = [
  "cache",
  "datastore",
  "queue",
  "network",
  "client",
  "service",
];

export function classifyNodeRole(label: string): DiagramRole | null {
  for (const role of ROLE_PRIORITY) {
    if (ROLE_KEYWORDS[role].test(label)) return role;
  }
  return null;
}

/**
 * Adds a `diagram-role-<role>` class to every rendered Mermaid node
 * whose text label matches a known role keyword. Additive only — a
 * node matching nothing keeps the theme's default color, so this
 * degrades gracefully on any diagram without requiring per-lesson
 * authoring.
 */
export function applyDiagramRoleClasses(svg: SVGSVGElement): void {
  const nodes = svg.querySelectorAll<SVGGElement>("g.node");
  nodes.forEach((node) => {
    const label = node.textContent?.trim() ?? "";
    if (!label) return;
    const role = classifyNodeRole(label);
    if (role) node.classList.add(`diagram-role-${role}`);
  });
}
