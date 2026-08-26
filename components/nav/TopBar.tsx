import path from "node:path";
import Link from "next/link";
import { Network } from "lucide-react";
import { buildNavTree } from "@/lib/content";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";
import { SearchDialog } from "@/components/search/SearchDialog";

export function TopBar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-background/85 px-4 py-3 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-background/70 sm:px-6">
      <div className="flex min-w-0 items-center gap-1">
        <MobileNav sections={sections} />
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-md font-mono text-sm font-semibold tracking-wide text-foreground uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Network className="size-4 shrink-0 text-brand" aria-hidden="true" />
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
