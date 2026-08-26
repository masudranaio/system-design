"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { SelfScoreBand } from "./SelfScoreBand";

interface RubricProps {
  items: string[];
}

export function Rubric({ items }: RubricProps) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    items.map(() => false),
  );
  const checkedCount = checked.filter(Boolean).length;
  const percent =
    items.length === 0 ? 0 : Math.round((checkedCount / items.length) * 100);

  return (
    <div
      className="rounded-md border border-line bg-card p-4"
      role="group"
      aria-label="Self-check rubric"
    >
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={item} className="flex items-center gap-2">
            <Checkbox
              id={`rubric-item-${index}`}
              checked={checked[index]}
              onCheckedChange={(value) =>
                setChecked((prev) => {
                  const next = [...prev];
                  next[index] = value === true;
                  return next;
                })
              }
            />
            <label htmlFor={`rubric-item-${index}`} className="text-foreground">
              {item}
            </label>
          </li>
        ))}
      </ul>
      <SelfScoreBand scorePercent={percent} />
    </div>
  );
}
