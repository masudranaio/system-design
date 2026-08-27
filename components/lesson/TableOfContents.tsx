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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const nodes = Array.from(container.querySelectorAll<HTMLHeadingElement>("h2[id]"));
    function syncHeadings() {
      setHeadings(nodes.map((node) => ({ id: node.id, text: node.textContent ?? "" })));
    }
    syncHeadings();
    if (nodes.length === 0) return;

    // A heading is "active" once it's scrolled up to this line from the
    // top of the viewport (matches the sticky rail's top-16/4rem offset
    // plus a small buffer).
    const ACTIVE_LINE_PX = 112;

    // IntersectionObserver's callback only reports the headings whose
    // intersecting state *changed* since the last check, not the full
    // current state of every observed heading — so picking activeId from
    // `entries` alone breaks on a fast or instant scroll (e.g. a TOC
    // click, or window.scrollTo) that jumps past several headings in one
    // frame: the skipped headings never appear in any entries list, and
    // activeId freezes on a stale heading. Confirmed live: scrolling deep
    // into a lesson left the rail stuck highlighting the first section.
    // Fixing this by always recomputing from every heading's real
    // position (getBoundingClientRect) rather than trusting which
    // headings happened to be reported as changed.
    let ticking = false;
    function updateActive() {
      ticking = false;
      let current = nodes[0]?.id ?? null;
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= ACTIVE_LINE_PX) {
          current = node.id;
        } else {
          break;
        }
      }
      setActiveId(current);

      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.round((doc.scrollTop / scrollable) * 100)) : 0);
    }
    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    }

    updateActive();
    const observer = new IntersectionObserver(scheduleUpdate, {
      rootMargin: "-96px 0px -70% 0px",
    });
    nodes.forEach((node) => observer.observe(node));
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
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
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="presentation">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ul className="mt-3 flex flex-col gap-1 border-l border-line">
        {headings.map((heading) => {
          const active = heading.id === activeId;
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "-ml-px block border-l-2 py-1 pl-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "border-brand font-semibold text-brand"
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
