"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchEntry {
  title: string;
  href: string;
  excerpt: string;
}

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/search-index.json")
      .then((res) => res.json())
      .then((data: SearchEntry[]) => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fuse = new Fuse(entries, { keys: ["title", "excerpt"], threshold: 0.35 });
  const results = query.trim() === "" ? entries : fuse.search(query).map((r) => r.item);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Search lessons"
        className="h-8 justify-between gap-2 px-2.5 font-normal text-muted-foreground sm:w-56 md:w-64"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <SearchIcon className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden truncate text-xs sm:inline">Search lessons...</span>
        </span>
        <kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-line bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
          <span aria-hidden="true">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search lessons..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No lessons found.</CommandEmpty>
          <CommandGroup heading="Lessons">
            {results.map((entry) => (
              <CommandItem
                key={entry.href}
                value={entry.title}
                onSelect={() => {
                  setOpen(false);
                  router.push(entry.href);
                }}
              >
                {entry.title}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
