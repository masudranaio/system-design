import path from "node:path";
import { buildNavTree } from "@/lib/content";
import { SidebarNav } from "./SidebarNav";

export function Sidebar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <nav
      className="hidden w-56 shrink-0 border-r border-line bg-sidebar-surface px-4 py-6 md:block"
      aria-label="Course navigation"
    >
      <SidebarNav sections={sections} />
    </nav>
  );
}
