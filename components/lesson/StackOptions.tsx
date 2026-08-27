interface StackOptionRow {
  component: string;
  oss: string;
  aws: string;
  gcp: string;
  when: string;
}

interface StackOptionsProps {
  title: string;
  rows: StackOptionRow[];
}

const COLUMNS = [
  "Component",
  "Open source",
  "AWS",
  "GCP",
  "When managed is worth it",
] as const;

export function StackOptions({ title, rows }: StackOptionsProps) {
  const captionId = `stack-options-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;

  return (
    <div className="panel-breakout mt-6 overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
      {/* track-case-studies rather than CompareTable's state-warn: a
          lesson often carries both tables, and two identically-titled
          panels read as one repeated component. */}
      <p
        id={captionId}
        className="border-b border-line px-4 py-2 font-mono text-xs font-semibold tracking-wide text-track-case-studies uppercase"
      >
        Build vs buy — {title}
      </p>
      <table
        aria-labelledby={captionId}
        className="w-full min-w-[48rem] border-collapse text-left text-sm"
      >
        <thead>
          <tr className="border-b border-line text-xs font-semibold text-muted-foreground uppercase">
            {COLUMNS.map((column) => (
              <th key={column} scope="col" className="px-4 py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.component}
              className="border-b border-line align-top last:border-b-0"
            >
              <th
                scope="row"
                className="px-4 py-3 text-left font-semibold text-foreground"
              >
                {row.component}
              </th>
              <td className="px-4 py-3 text-foreground">{row.oss}</td>
              <td className="px-4 py-3 text-foreground">{row.aws}</td>
              <td className="px-4 py-3 text-foreground">{row.gcp}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
