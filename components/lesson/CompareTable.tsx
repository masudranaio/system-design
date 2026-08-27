import { cn } from "@/lib/utils";

interface CompareRow {
  approach: string;
  pros: string[];
  cons: string[];
  chosenBecause?: string;
}

interface CompareTableProps {
  title: string;
  rows: CompareRow[];
}

export function CompareTable({ title, rows }: CompareTableProps) {
  return (
    <div className="panel-breakout mt-6 overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
      <p className="border-b border-line px-4 py-2 font-mono text-xs font-semibold tracking-wide text-state-warn uppercase">
        {title}
      </p>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs font-semibold text-muted-foreground uppercase">
            <th scope="col" className="px-4 py-2">
              Approach
            </th>
            <th scope="col" className="px-4 py-2">
              Pros
            </th>
            <th scope="col" className="px-4 py-2">
              Cons
            </th>
            <th scope="col" className="px-4 py-2">
              Chosen because
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.approach}
              className={cn(
                "border-b border-line align-top last:border-b-0",
                row.chosenBecause && "border-l-2 border-l-brand bg-brand/5",
              )}
            >
              <th
                scope="row"
                className="px-4 py-3 font-mono text-sm font-semibold text-foreground"
              >
                {row.approach}
              </th>
              <td className="px-4 py-3 text-foreground">
                <ul className="list-disc pl-4">
                  {row.pros.map((pro) => (
                    <li key={pro}>{pro}</li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3 text-foreground">
                <ul className="list-disc pl-4">
                  {row.cons.map((con) => (
                    <li key={con}>{con}</li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.chosenBecause ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
