interface KeyStatProps {
  value: string;
  label: string;
  detail?: string;
}

export function KeyStat({ value, label, detail }: KeyStatProps) {
  return (
    <div className="mt-6 flex flex-col gap-1 rounded-lg border border-line bg-card p-4 shadow-sm sm:flex-row sm:items-baseline sm:gap-4">
      <p className="font-mono text-2xl font-semibold text-brand">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {detail && (
        <details className="mt-2 w-full text-sm text-muted-foreground sm:mt-0 sm:ml-auto sm:w-auto">
          <summary className="cursor-pointer font-mono text-xs font-semibold tracking-wide text-brand uppercase">
            Show the math
          </summary>
          <p className="mt-2 max-w-prose">{detail}</p>
        </details>
      )}
    </div>
  );
}
