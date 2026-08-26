import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[68ch]">
      <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        System design course
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">
        High-level and low-level design, built one lesson at a time
      </h1>
      <p className="mt-4 text-foreground">
        A personal interview-prep and reference course covering HLD and
        LLD concepts, applied through per-system case studies like
        Ticketmaster. Each lesson pairs an explanation with diagrams,
        inline self-checks, and a closing practice challenge.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        <li>
          <Link href="/hld" className="text-brand">
            High-Level Design concepts
          </Link>
        </li>
        <li>
          <Link href="/lld" className="text-brand">
            Low-Level Design concepts
          </Link>
        </li>
        <li>
          <Link
            href="/case-studies/ticketmaster/hld"
            className="text-brand"
          >
            Case studies
          </Link>
        </li>
        <li>
          <Link href="/interview-prep" className="text-brand">
            Interview prep
          </Link>
        </li>
      </ul>
    </div>
  );
}
