"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "@/lib/nav-icons";
import type { NavSection } from "@/lib/content";

export function SidebarNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="hidden w-56 shrink-0 border-r border-line px-4 py-6 md:block"
      aria-label="Course navigation"
    >
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.title] ?? Layers;
        return (
          <div key={section.title} className="mb-6">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <p>{section.title}</p>
            </div>
            {section.items.length === 0 ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground italic">
                <FileQuestion className="size-3.5 shrink-0" aria-hidden="true" />
                No lessons yet
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-r-md border-l-2 px-2 py-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active
                            ? "border-brand bg-brand/10 font-semibold text-foreground"
                            : "border-transparent text-muted-foreground hover:border-line hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}
