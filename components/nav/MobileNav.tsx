"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NavSection } from "@/lib/content";
import { SidebarNav } from "./SidebarNav";

export function MobileNav({ sections }: { sections: NavSection[] }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu className="size-5" aria-hidden="true" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/30 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-line bg-sidebar-surface py-6 shadow-lg outline-none data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left">
          <div className="flex items-center justify-between px-4">
            <DialogPrimitive.Title className="font-mono text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Navigation
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Close navigation" />
              }
            >
              <XIcon className="size-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-4 px-4">
            <SidebarNav sections={sections} />
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
