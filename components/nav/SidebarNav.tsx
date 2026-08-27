"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTION_ICONS } from "@/lib/nav-icons";
import type { NavLink as NavLinkItem, NavSection } from "@/lib/content";

function NavLinkItemView({ item, active }: { item: NavLinkItem; active: boolean }) {
  return (
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
  );
}

export function SidebarNav({ sections }: { sections: NavSection[] }) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.title] ?? Layers;
        const isEmpty = section.groups
          ? section.groups.length === 0
          : section.items.length === 0;
        return (
          <div
            key={section.title}
            className="mb-6 border-b border-line pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <p>{section.title}</p>
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
                    <ul className="mt-1 flex flex-col gap-0.5 border-l border-line pl-2">
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
