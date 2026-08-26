import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[68ch] flex-col items-start gap-4 py-16">
      <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        404 / Not found
      </p>
      <h1 className="text-3xl font-semibold text-foreground">
        This page hasn&rsquo;t been drafted yet
      </h1>
      <p className="text-muted-foreground">
        The lesson or route you&rsquo;re looking for doesn&rsquo;t exist
        &mdash; it may have moved, or it just hasn&rsquo;t been built yet.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-sm font-mono text-sm text-brand outline-none underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Compass className="size-4" aria-hidden="true" />
        Back to the course home
      </Link>
    </div>
  );
}
