import Link from "next/link";

interface NavItem {
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Stub nav data -- replaced by a real tree built from content/ in Plan 2
// (lib/content.ts), once lesson MDX files exist to scan. Do not treat
// this as permanent.
const STUB_NAV: NavSection[] = [
  {
    title: "High-Level Design",
    items: [{ label: "Concepts", href: "/hld" }],
  },
  {
    title: "Low-Level Design",
    items: [{ label: "Concepts", href: "/lld" }],
  },
  {
    title: "Case Studies",
    items: [
      { label: "Ticketmaster", href: "/case-studies/ticketmaster/hld" },
    ],
  },
  {
    title: "Interview Prep",
    items: [{ label: "Frameworks", href: "/interview-prep" }],
  },
];

export function Sidebar() {
  return (
    <nav
      className="w-56 shrink-0 border-r border-line px-4 py-6"
      aria-label="Course navigation"
    >
      {STUB_NAV.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {section.title}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
