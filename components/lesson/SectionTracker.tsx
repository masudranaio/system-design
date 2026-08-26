interface SectionTrackerProps {
  sections: string[];
  active: string;
}

export function SectionTracker({ sections, active }: SectionTrackerProps) {
  return (
    <nav className="border-b border-line" aria-label="Lesson sections">
      <ol className="flex flex-wrap gap-4 py-2 font-mono text-xs uppercase tracking-wide">
        {sections.map((section) => {
          const isActive = section === active;
          return (
            <li
              key={section}
              aria-current={isActive ? "step" : undefined}
              className={
                isActive
                  ? "text-brand"
                  : "text-muted-foreground"
              }
            >
              {section}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
