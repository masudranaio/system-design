import path from "node:path";
import { buildNavTree } from "@/lib/content";
import { SidebarNav } from "./SidebarNav";

export function Sidebar() {
  const contentRoot = path.join(process.cwd(), "content");
  const sections = buildNavTree(contentRoot);

  return (
    <div className="hidden shrink-0 md:sticky md:top-16 md:block md:max-h-[calc(100vh-4rem)] md:w-56 md:overflow-y-auto">
      <SidebarNav sections={sections} />
    </div>
  );
}
