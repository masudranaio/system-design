import path from "node:path";
import Link from "next/link";
import { buildNavTree } from "@/lib/content";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { SearchDialog } from "@/components/search/SearchDialog";

function TransitGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 shrink-0 text-brand">
      {[2, 6, 10, 14].map((x, i) => (
        <rect key={x} x={x - 1} y={2 + i * 1.5} width="2" height={12 - i * 3} rx="1" fill="currentColor" />
      ))}
    </svg>
  );
}

export function TopBar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 shadow-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav sections={sections} />
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-md font-display text-base font-bold tracking-tight text-brand outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <TransitGlyph />
          <span className="truncate">System Design Course</span>
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SearchDialog />
        <ThemeToggle />
      </div>
    </header>
  );
}
