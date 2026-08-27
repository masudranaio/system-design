import { DIAGRAM_DISPLAY, type DiagramRole } from "@/lib/diagram-palette";

const ROLE_LABEL: Record<DiagramRole, string> = {
  client: "Client",
  network: "Network",
  service: "Service",
  cache: "Cache",
  datastore: "Datastore",
  queue: "Queue",
};

export function DiagramLegend({ roles }: { roles?: DiagramRole[] }) {
  if (!roles || roles.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {roles.map((role) => (
        <li key={role} className="flex items-center gap-1.5 font-mono text-[0.6875rem] font-semibold tracking-wide text-ink-muted uppercase">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{
              backgroundColor: DIAGRAM_DISPLAY[role].fill,
              boxShadow: `inset 0 0 0 1.5px ${DIAGRAM_DISPLAY[role].stroke}`,
            }}
          />
          {ROLE_LABEL[role]}
        </li>
      ))}
    </ul>
  );
}
