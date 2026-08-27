import { cn } from "@/lib/utils";

interface StageProps {
  n: number;
  title: string;
  verdict: string;
  final?: boolean;
}

export function stageSlug(n: number, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `v${n}-${slug}`;
}

export function Stage({ n, title, verdict, final = false }: StageProps) {
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2">
        {/* The numbered chip uses the brand color rather than a track
            color: the same component marks versions in both HLD and LLD
            lessons, and a track-tinted chip would imply the wrong track
            on half of them. */}
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold tracking-wide uppercase",
            final ? "bg-state-ok text-ground" : "bg-brand/15 text-brand",
          )}
        >
          v{n}
        </span>
        {final && (
          <span className="font-mono text-xs font-semibold tracking-wide text-state-ok uppercase">
            final design
          </span>
        )}
      </div>
      {/* Renders a real h2 with an id so TableOfContents (which queries
          h2[id]) lists every version as a jumpable section. The classes
          are copied from lib/mdx-components.tsx's h2 override, which
          only applies to markdown headings and so can't be reused
          here — mt-2 rather than mt-10 because the wrapper above
          already carries the section's top spacing. */}
      <h2
        id={stageSlug(n, title)}
        className="mt-2 max-w-[90ch] scroll-mt-24 text-[1.625rem] leading-[1.25] font-semibold text-foreground"
      >
        {title}
      </h2>
      <p className="mt-1.5 max-w-[90ch] text-[0.9375rem] leading-[1.6] text-muted-foreground">
        {verdict}
      </p>
    </div>
  );
}
