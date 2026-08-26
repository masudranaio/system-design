"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
}

export function TableOfContents({ containerId }: { containerId: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const nodes = Array.from(container.querySelectorAll<HTMLHeadingElement>("h2[id]"));
    setHeadings(nodes.map((node) => ({ id: node.id, text: node.textContent ?? "" })));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [containerId]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-16 hidden max-h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto xl:block"
    >
      <p className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        On this page
      </p>
      <ul className="mt-3 flex flex-col gap-1 border-l border-line">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "-ml-px block border-l-2 py-1 pl-3 text-sm transition-colors",
                  active
                    ? "border-brand font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:border-line hover:text-foreground",
                )}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
