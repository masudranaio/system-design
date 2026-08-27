interface SelfScoreBandProps {
  scorePercent: number;
}

export function bandFor(scorePercent: number): {
  label: string;
  className: string;
} {
  if (scorePercent >= 100) {
    return { label: "Interview-ready", className: "text-state-ok" };
  }
  if (scorePercent >= 34) {
    return { label: "Practicing", className: "text-state-warn" };
  }
  return { label: "Novice", className: "text-state-bad" };
}

export function SelfScoreBand({ scorePercent }: SelfScoreBandProps) {
  const { label, className } = bandFor(scorePercent);
  return (
    <p
      className={`mt-3 font-mono text-sm uppercase tracking-wide ${className}`}
      data-testid="self-score-band"
    >
      {label} — {scorePercent}% covered
    </p>
  );
}
