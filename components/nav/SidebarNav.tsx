"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_ICONS, SECTION_TRACK, FALLBACK_TRACK } from "@/lib/nav-icons";
import type { NavLink as NavLinkItem, NavSection } from "@/lib/content";

function NavLinkItemView({ item, active }: { item: NavLinkItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-brand-soft font-semibold text-brand"
          : "text-ink-muted hover:bg-sidebar-surface hover:text-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

function sectionCount(section: NavSection): number {
  return section.groups
    ? section.groups.reduce((sum, group) => sum + group.items.length, 0)
    : section.items.length;
}

export function SidebarNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.title] ?? Layers;
        const track = SECTION_TRACK[section.title] ?? FALLBACK_TRACK;
        const isEmpty = section.groups
          ? section.groups.length === 0
          : section.items.length === 0;
        return (
          <div
            key={section.title}
            className="mb-6 border-b border-line pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-2">
              <span
                data-testid={`section-chip-${section.title}`}
                className={cn("flex size-6 items-center justify-center rounded-md", track.bg)}
              >
                <Icon className={cn("size-3.5 shrink-0", track.text)} aria-hidden="true" />
              </span>
              <p className="font-mono text-xs font-semibold uppercase tracking-wide text-foreground">
                {section.title}
              </p>
              {!isEmpty && (
                <span className="ml-auto font-mono text-[11px] text-ink-muted">
                  {sectionCount(section)}
                </span>
              )}
            </div>
            {isEmpty ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground italic">
                <FileQuestion className="size-3.5 shrink-0" aria-hidden="true" />
                No lessons yet
              </p>
            ) : section.groups ? (
              <div className="mt-3 flex flex-col gap-3">
                {section.groups.map((group) => (
                  <div key={group.title}>
                    <p className="px-2 text-sm font-semibold text-foreground">
                      {group.title}
                    </p>
                    <ul className={cn("mt-1 flex flex-col gap-0.5 border-l-2 pl-2", track.border)}>
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <NavLinkItemView item={item} active={pathname === item.href} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="mt-2 flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLinkItemView item={item} active={pathname === item.href} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}
