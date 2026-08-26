import Link from "next/link";
import { ArrowRight, Network, Box, Building2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MODULES = [
  {
    title: "High-Level Design concepts",
    description:
      "Scalability, availability, and the core building blocks behind distributed systems.",
    href: "/hld",
    icon: Network,
  },
  {
    title: "Low-Level Design concepts",
    description:
      "Object-oriented design, patterns, and database schema decisions at the class level.",
    href: "/lld",
    icon: Box,
  },
  {
    title: "Case studies",
    description:
      "Full HLD + LLD walkthroughs of real systems, like Ticketmaster, applying the concepts end to end.",
    href: "/case-studies/ticketmaster/hld",
    icon: Building2,
  },
  {
    title: "Interview prep",
    description:
      "Framing, trade-off talk tracks, and open-ended practice challenges for the live interview.",
    href: "/interview-prep",
    icon: MessageSquare,
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16">
      <section className="max-w-[68ch]">
        <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          System design course
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
          High-level and low-level design, built one lesson at a time
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          A personal interview-prep and reference course covering HLD and
          LLD concepts, applied through per-system case studies like
          Ticketmaster. Each lesson pairs an explanation with diagrams,
          inline self-checks, and a closing practice challenge.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/hld" />}>
            Start with HLD
            <ArrowRight className="size-4" data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            nativeButton={false}
            render={<Link href="/case-studies/ticketmaster/hld" />}
          >
            Browse case studies
          </Button>
        </div>
      </section>

      <section
        aria-label="Course sections"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {MODULES.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            aria-label={module.title}
            className="group rounded-lg outline-none"
          >
            <Card
              className={cn(
                "h-full border-line group-hover:-translate-y-0.5 group-hover:border-brand/50 group-hover:shadow-lg",
                "group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background",
              )}
            >
              <CardHeader>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-brand/10 text-brand">
                  <module.icon className="size-4" aria-hidden="true" />
                </span>
                <CardTitle>{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{module.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
