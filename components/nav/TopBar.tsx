import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-line px-6 py-3">
      <Link
        href="/"
        className="font-mono text-sm font-semibold uppercase tracking-wide text-foreground"
      >
        System Design Course
      </Link>
      <ThemeToggle />
    </header>
  );
}
