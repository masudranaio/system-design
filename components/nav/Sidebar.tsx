import Link from "next/link";
import path from "node:path";
import { buildNavTree } from "@/lib/content";

export function Sidebar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <nav
      className="w-56 shrink-0 border-r border-line px-4 py-6"
      aria-label="Course navigation"
    >
      {sections.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {section.title}
          </p>
          {section.items.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No lessons yet</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}
