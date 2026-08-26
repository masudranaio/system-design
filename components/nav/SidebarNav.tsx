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
    <>
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.title] ?? Layers;
        return (
          <div
            key={section.title}
            className="mb-6 border-b border-line pb-6 last:border-b-0 last:pb-0"
          >
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
                          "block rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          active
                            ? "bg-brand/15 font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
    </>
  );
}
