# Next.js App Shell + Component Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js app itself — scaffold, design tokens, the
five shared lesson/nav components, and a running, themed, verified shell
— as the first of two plans implementing
[2026-08-26-nextjs-mdx-app-migration-design.md](../specs/2026-08-26-nextjs-mdx-app-migration-design.md).
The MDX content pipeline, dynamic lesson routes, search, and Ticketmaster's
first real `hld.mdx`/`lld.mdx` are a separate follow-up plan (Plan 2) —
not built here.

**Architecture:** A sequential foundation (scaffold → shadcn/ui → design
tokens/theming), then a parallel batch of five independent component
tasks (each creates only new files — no shared-file edits between them,
so they can run concurrently), then a sequential final task that wires
a home page + style-guide page together and verifies the whole shell
builds, tests pass, and both themes render correctly.

**Tech Stack:** Next.js 16.3.2 (App Router, TypeScript), React 19.2.8,
Tailwind CSS v4 (CSS-first `@theme` config, no `tailwind.config.js`),
shadcn/ui (Radix-based primitives), `next-themes` for theme switching,
`mermaid` for diagrams, Vitest + React Testing Library for component
tests, pnpm as the package manager. Versions and CLI flags below were
verified live in this environment before writing this plan — use them
exactly, don't re-derive from memory.

**Spec:** [docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../specs/2026-08-26-nextjs-mdx-app-migration-design.md)

## Global Constraints

- **Never touch** `content/`, `docs/`, `CLAUDE.md`, or `SYLLABUS.md` in
  any task in this plan — this plan only adds framework/app files at the
  repo root (`app/`, `components/`, `lib/` is not created yet — that's
  Plan 2 — `package.json`, config files, `public/`).
- Package manager is **pnpm** exclusively — never `npm install` or
  `yarn add` in any step.
- Design tokens (exact hex values) are copied verbatim from the spec's
  "Design system" section — do not invent or approximate colors:
  - `--color-ground`: `#F5F7FA` light / `#0B0D12` dark
  - `--color-surface`: `#FFFFFF` light / `#12151C` dark
  - `--color-ink`: `#14171F` light / `#E7E9F0` dark
  - `--color-ink-muted`: `#4B5262` light / `#9BA3B4` dark
  - `--color-brand` (the spec's "accent"): `#0E7C86` light / `#34C7B8` dark
  - `--color-line`: `#D8DEE6` light / `#262B36` dark
  - `--color-state-available`: `#2F9E44` light / `#4ADE80` dark
  - `--color-state-held`: `#C97A1A` light / `#F5A623` dark
  - `--color-state-booked`: `#B23A48` light / `#F87171` dark
  - Fonts: IBM Plex Mono (headings/labels/state names), Source Serif 4
    (body prose), both via `next/font/google`.
- The spec's brand accent is renamed `--color-brand` (not `--color-accent`)
  in every task below, specifically to avoid colliding with shadcn/ui's
  own `--accent`/`--accent-foreground` semantic tokens (used for
  hover/selected UI states, a different concept from the brand color).
  Keep this distinction in every file that touches color tokens.
- Every component in `components/lesson/` and `components/nav/` that
  holds interactive state or reads a hook must start with `"use client"`.
- No task installs a dependency it doesn't directly use.

---

### Task 1: Scaffold the Next.js project + testing infrastructure

**Files:**
- Create (via `create-next-app`, then moved to repo root): `app/layout.tsx`,
  `app/page.tsx`, `app/globals.css`, `app/favicon.ico`, `next.config.ts`,
  `next-env.d.ts`, `package.json`, `pnpm-workspace.yaml`,
  `postcss.config.mjs`, `tsconfig.json`, `eslint.config.mjs`, `public/`
- Create: `vitest.config.ts`, `vitest-setup.ts` (repo root)
- Modify: `.gitignore` (merge in Next.js's ignore rules, keep the
  existing `.vscode/` line)

**Interfaces:**
- Produces: a working `pnpm dev` / `pnpm build` / `pnpm test` at the
  repo root, with `@/*` resolving to the repo root (both in
  `tsconfig.json` and `vitest.config.ts`) — every later task's imports
  like `@/components/ui/button` depend on this alias existing.

- [ ] **Step 1: Scaffold into a temp directory**

Run (do not run this against the repo root directly — `create-next-app`
refuses non-empty directories):

```bash
rm -rf /tmp/nextjs-scaffold
pnpm dlx create-next-app@latest /tmp/nextjs-scaffold \
  --ts --tailwind --eslint --app \
  --import-alias "@/*" --use-pnpm --disable-git --yes
```

- [ ] **Step 2: Move the generated files into the repo root**

From the repo root:

```bash
mv /tmp/nextjs-scaffold/app .
mv /tmp/nextjs-scaffold/eslint.config.mjs .
mv /tmp/nextjs-scaffold/next.config.ts .
mv /tmp/nextjs-scaffold/next-env.d.ts .
mv /tmp/nextjs-scaffold/package.json .
mv /tmp/nextjs-scaffold/pnpm-workspace.yaml .
mv /tmp/nextjs-scaffold/postcss.config.mjs .
mv /tmp/nextjs-scaffold/public .
mv /tmp/nextjs-scaffold/tsconfig.json .
```

Do **not** move `/tmp/nextjs-scaffold/README.md` or
`/tmp/nextjs-scaffold/node_modules` — discard both (the README is
generic boilerplate we don't want overwriting anything at the repo
root, which currently has no root README.md at all; node_modules gets
regenerated by `pnpm install` at the destination).

- [ ] **Step 3: Merge `.gitignore`**

The repo's current `.gitignore` contains only `.vscode/`. Append the
generated project's ignore rules below it, without removing the
existing line:

```
.vscode/

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 4: Clean up the temp directory**

```bash
rm -rf /tmp/nextjs-scaffold
```

- [ ] **Step 5: Install dependencies and verify the stock scaffold builds**

```bash
pnpm install
pnpm build
```

Expected: build succeeds with the default Next.js starter page. If it
doesn't, stop and report — don't proceed to testing infra on top of a
broken scaffold.

- [ ] **Step 6: Add testing dependencies**

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 7: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest-setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 8: Create `vitest-setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 9: Add the `test` script to `package.json`**

In the `"scripts"` block, add (keep the existing `dev`/`build`/`start`/`lint` entries):

```json
"test": "vitest run"
```

- [ ] **Step 10: Write and run a trivial smoke test to verify the harness works**

Create `app/page.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Page from "./page";

describe("Home page (scaffold smoke test)", () => {
  it("renders without crashing", () => {
    render(<Page />);
    expect(document.body).toBeTruthy();
  });
});
```

Run: `pnpm test`
Expected: 1 test passes. Delete `app/page.test.tsx` after confirming
this — it's a harness check, not a real test (Task 9 replaces
`app/page.tsx` and writes real tests for it there).

- [ ] **Step 11: Commit**

```bash
git add app eslint.config.mjs next.config.ts next-env.d.ts package.json \
  pnpm-workspace.yaml postcss.config.mjs public tsconfig.json \
  vitest.config.ts vitest-setup.ts .gitignore pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Scaffold Next.js app + Vitest testing infrastructure

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: shadcn/ui init + base primitives

**Files:**
- Create (via shadcn CLI): `components.json`, `lib/utils.ts`,
  `components/ui/button.tsx`, `components/ui/checkbox.tsx`
- Modify: `app/globals.css` (shadcn's init appends CSS variables here —
  Task 3 fully rewrites this file afterward, so exactly what shadcn
  writes doesn't matter long-term, but init must run against a real
  `globals.css` to succeed)
- Modify: `package.json` (adds `class-variance-authority`, `clsx`,
  `tailwind-merge`, `lucide-react`, `@radix-ui/*` as dependencies)

**Interfaces:**
- Consumes: Task 1's scaffold (`app/globals.css`, `tsconfig.json` with
  the `@/*` alias) must exist first.
- Produces: `components/ui/button.tsx` exporting `Button`,
  `components/ui/checkbox.tsx` exporting `Checkbox`. Task 5 imports
  `Checkbox`; Tasks 4, 8, and 9 import `Button`.
- Only `button` and `checkbox` are added here because they're the only
  primitives this plan's components use (per the Global Constraint
  against installing unused dependencies) — `dialog` and `command` get
  added in Plan 2 when `SearchDialog` needs them
  (`pnpm dlx shadcn@latest add dialog command --yes --cwd .`), not here.

- [ ] **Step 1: Run shadcn init (non-interactive)**

```bash
pnpm dlx shadcn@latest init --yes --defaults --cwd .
```

- [ ] **Step 2: Verify `components.json` and `lib/utils.ts` were created**

```bash
test -f components.json && test -f lib/utils.ts && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Add the two base primitives this plan uses**

```bash
pnpm dlx shadcn@latest add button checkbox --yes --cwd .
```

- [ ] **Step 4: Verify the build still succeeds**

```bash
pnpm build
```

Expected: succeeds (shadcn's init may have altered `app/globals.css`,
but the stock page should still compile).

- [ ] **Step 5: Commit**

```bash
git add components.json lib components/ui package.json pnpm-lock.yaml app/globals.css
git commit -m "$(cat <<'EOF'
Add shadcn/ui with button, checkbox, dialog, command primitives

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Design tokens, fonts, theming, minimal root layout

**Files:**
- Modify: `app/globals.css` (full rewrite)
- Modify: `app/layout.tsx` (full rewrite — minimal: fonts + theme
  provider + children, no nav chrome yet — Task 8 adds that)
- Create: `components/nav/theme-provider.tsx`
- Modify: `package.json` (adds `next-themes`)

**Interfaces:**
- Consumes: Task 2's shadcn init must have run first (this task
  overwrites what it wrote to `globals.css`, but shadcn's `components.json`
  / `lib/utils.ts` / `components/ui/*` files it generated must already
  exist).
- Produces: CSS custom properties consumed by every later task's
  className strings (`bg-background`, `text-foreground`, `font-mono`,
  `font-serif`, `text-brand`, `border-line`, etc. — Tailwind v4 resolves
  these from the `@theme inline` block below). `components/nav/theme-provider.tsx`
  exports `ThemeProvider`, imported by `app/layout.tsx` here and nowhere
  else needs to re-create it.

- [ ] **Step 1: Add next-themes**

```bash
pnpm add next-themes
```

- [ ] **Step 2: Rewrite `app/globals.css`**

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap");

:root {
  --color-ground: #f5f7fa;
  --color-surface: #ffffff;
  --color-ink: #14171f;
  --color-ink-muted: #4b5262;
  --color-brand: #0e7c86;
  --color-line: #d8dee6;
  --color-state-available: #2f9e44;
  --color-state-held: #c97a1a;
  --color-state-booked: #b23a48;

  --background: var(--color-ground);
  --foreground: var(--color-ink);
  --card: var(--color-surface);
  --card-foreground: var(--color-ink);
  --popover: var(--color-surface);
  --popover-foreground: var(--color-ink);
  --primary: var(--color-brand);
  --primary-foreground: var(--color-ground);
  --secondary: var(--color-surface);
  --secondary-foreground: var(--color-ink);
  --muted: var(--color-surface);
  --muted-foreground: var(--color-ink-muted);
  --accent: var(--color-surface);
  --accent-foreground: var(--color-ink);
  --destructive: var(--color-state-booked);
  --destructive-foreground: var(--color-ground);
  --border: var(--color-line);
  --input: var(--color-line);
  --ring: var(--color-brand);
  --radius: 0.25rem;
}

:root:not([data-theme="light"]) {
  @media (prefers-color-scheme: dark) {
    --color-ground: #0b0d12;
    --color-surface: #12151c;
    --color-ink: #e7e9f0;
    --color-ink-muted: #9ba3b4;
    --color-brand: #34c7b8;
    --color-line: #262b36;
    --color-state-available: #4ade80;
    --color-state-held: #f5a623;
    --color-state-booked: #f87171;
  }
}

:root[data-theme="dark"] {
  --color-ground: #0b0d12;
  --color-surface: #12151c;
  --color-ink: #e7e9f0;
  --color-ink-muted: #9ba3b4;
  --color-brand: #34c7b8;
  --color-line: #262b36;
  --color-state-available: #4ade80;
  --color-state-held: #f5a623;
  --color-state-booked: #f87171;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-brand: var(--color-brand);
  --color-line: var(--color-line);
  --color-state-available: var(--color-state-available);
  --color-state-held: var(--color-state-held);
  --color-state-booked: var(--color-state-booked);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
}

h1,
h2,
h3,
h4,
h5,
h6,
.font-mono {
  font-family: var(--font-mono), ui-monospace, "SFMono-Regular", monospace;
  text-wrap: balance;
}
```

Note: `next-themes` uses the `class` strategy by default (adds/removes
a `dark` class on `<html>`), not `data-theme`. This CSS uses
`data-theme="dark"`/`data-theme="light"` attribute selectors per the
artifact-design convention documented in the migration spec — Step 3
below configures `ThemeProvider` with `attribute="data-theme"` so the
two stay consistent. Do not mix the `class` and `data-theme` strategies.

- [ ] **Step 3: Create `components/nav/theme-provider.tsx`**

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 4: Rewrite `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "@/components/nav/theme-provider";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "System Design Course",
  description:
    "A personal HLD + LLD system design course and interview-prep reference.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plexMono.variable} ${sourceSerif.variable}`}
    >
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Verify the build succeeds**

```bash
pnpm build
```

Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx components/nav/theme-provider.tsx package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add design tokens, fonts, and theme provider

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `QuizItem` component

**Files:**
- Create: `components/lesson/QuizItem.tsx`
- Test: `components/lesson/QuizItem.test.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button` (Task 2), design
  tokens from `app/globals.css` (Task 3, via className strings)
- Produces: `QuizItem` component with props `{ question: string; answer: string }`
  — used by future MDX content in Plan 2, not consumed by any task in
  this plan.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizItem } from "./QuizItem";

describe("QuizItem", () => {
  it("hides the answer until revealed, then shows it and can hide it again", () => {
    render(<QuizItem question="Why teal?" answer="Because signal." />);

    expect(screen.getByText("Why teal?")).toBeInTheDocument();
    expect(screen.queryByTestId("quiz-answer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByTestId("quiz-answer")).toHaveTextContent("Because signal.");

    fireEvent.click(screen.getByRole("button", { name: /hide answer/i }));
    expect(screen.queryByTestId("quiz-answer")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test QuizItem`
Expected: FAIL — `./QuizItem` module not found.

- [ ] **Step 3: Write the implementation**

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface QuizItemProps {
  question: string;
  answer: string;
}

export function QuizItem({ question, answer }: QuizItemProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className="rounded-md border border-line bg-card p-4"
      role="group"
      aria-label="Quiz question"
    >
      <p className="text-foreground">{question}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => setRevealed((r) => !r)}
        aria-expanded={revealed}
      >
        {revealed ? "Hide answer" : "Reveal answer"}
      </Button>
      {revealed && (
        <p
          className="mt-3 border-t border-line pt-3 text-muted-foreground"
          data-testid="quiz-answer"
        >
          {answer}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm test QuizItem`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/lesson/QuizItem.tsx components/lesson/QuizItem.test.tsx
git commit -m "$(cat <<'EOF'
Add QuizItem lesson component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `Rubric` + `SelfScoreBand` components

**Files:**
- Create: `components/lesson/SelfScoreBand.tsx`
- Create: `components/lesson/Rubric.tsx`
- Test: `components/lesson/SelfScoreBand.test.tsx`
- Test: `components/lesson/Rubric.test.tsx`

**Interfaces:**
- Consumes: `Checkbox` from `@/components/ui/checkbox` (Task 2)
- Produces: `SelfScoreBand` exporting `SelfScoreBand` component and a
  named `bandFor(scorePercent: number): { label: string; className: string }`
  helper (exported for direct unit testing). `Rubric` exporting `Rubric`
  with props `{ items: string[] }`, internally composing `SelfScoreBand`.
  Both used by future MDX content in Plan 2.

- [ ] **Step 1: Write the failing test for `SelfScoreBand`**

```tsx
import { describe, it, expect } from "vitest";
import { bandFor } from "./SelfScoreBand";

describe("bandFor", () => {
  it("returns Novice below 34%", () => {
    expect(bandFor(0).label).toBe("Novice");
    expect(bandFor(33).label).toBe("Novice");
  });

  it("returns Practicing from 34% up to but not including 100%", () => {
    expect(bandFor(34).label).toBe("Practicing");
    expect(bandFor(67).label).toBe("Practicing");
    expect(bandFor(99).label).toBe("Practicing");
  });

  it("returns Interview-ready only at 100%", () => {
    expect(bandFor(100).label).toBe("Interview-ready");
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test SelfScoreBand`
Expected: FAIL — `./SelfScoreBand` module not found.

- [ ] **Step 3: Write `components/lesson/SelfScoreBand.tsx`**

```tsx
interface SelfScoreBandProps {
  scorePercent: number;
}

export function bandFor(scorePercent: number): {
  label: string;
  className: string;
} {
  if (scorePercent >= 100) {
    return { label: "Interview-ready", className: "text-state-available" };
  }
  if (scorePercent >= 34) {
    return { label: "Practicing", className: "text-state-held" };
  }
  return { label: "Novice", className: "text-state-booked" };
}

export function SelfScoreBand({ scorePercent }: SelfScoreBandProps) {
  const { label, className } = bandFor(scorePercent);
  return (
    <p
      className={`mt-3 font-mono text-sm uppercase tracking-wide ${className}`}
      data-testid="self-score-band"
    >
      {label} — {scorePercent}% covered
    </p>
  );
}
```

- [ ] **Step 4: Run the `SelfScoreBand` test, confirm it passes**

Run: `pnpm test SelfScoreBand`
Expected: PASS.

- [ ] **Step 5: Write the failing test for `Rubric`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Rubric } from "./Rubric";

describe("Rubric", () => {
  it("starts at Novice and updates the self-score band as items are checked", async () => {
    const user = userEvent.setup();
    render(<Rubric items={["Covers A", "Covers B", "Covers C"]} />);

    expect(screen.getByTestId("self-score-band")).toHaveTextContent(
      "Novice — 0% covered",
    );

    await user.click(screen.getByLabelText("Covers A"));
    await user.click(screen.getByLabelText("Covers B"));
    expect(screen.getByTestId("self-score-band")).toHaveTextContent(
      "Practicing — 67% covered",
    );

    await user.click(screen.getByLabelText("Covers C"));
    expect(screen.getByTestId("self-score-band")).toHaveTextContent(
      "Interview-ready — 100% covered",
    );
  });
});
```

- [ ] **Step 6: Run the test, confirm it fails**

Run: `pnpm test Rubric`
Expected: FAIL — `./Rubric` module not found.

- [ ] **Step 7: Write `components/lesson/Rubric.tsx`**

```tsx
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
```

- [ ] **Step 8: Run the `Rubric` test, confirm it passes**

Run: `pnpm test Rubric`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add components/lesson/SelfScoreBand.tsx components/lesson/SelfScoreBand.test.tsx \
  components/lesson/Rubric.tsx components/lesson/Rubric.test.tsx
git commit -m "$(cat <<'EOF'
Add Rubric and SelfScoreBand lesson components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `DiagramPanel` component

**Files:**
- Create: `components/lesson/DiagramPanel.tsx`
- Test: `components/lesson/DiagramPanel.test.tsx`
- Modify: `package.json` (adds `mermaid`)

**Interfaces:**
- Consumes: design tokens from `app/globals.css` (Task 3)
- Produces: `DiagramPanel` with props
  `{ title: string; type: "architecture" | "class" | "state" | "sequence" | "er"; chart: string }`
  — `chart` is the raw Mermaid source as a plain string (a deliberate
  simplification from the spec's illustrative fenced-code-block example:
  extracting Mermaid source text from MDX-rendered `<pre><code>` children
  reliably needs a custom remark/rehype plugin, which is out of scope for
  this plan; MDX content in Plan 2 passes the chart as a JS template
  string prop instead — same visual result, much simpler and more
  reliable). Used by future MDX content in Plan 2.

- [ ] **Step 1: Add mermaid**

```bash
pnpm add mermaid
```

- [ ] **Step 2: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DiagramPanel } from "./DiagramPanel";

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi
      .fn()
      .mockResolvedValue({ svg: '<svg data-testid="mock-svg"></svg>' }),
  },
}));

describe("DiagramPanel", () => {
  it("renders the title, the type eyebrow label, and injects the rendered SVG", async () => {
    render(
      <DiagramPanel
        title="Request flow"
        type="architecture"
        chart={"graph LR\n  A-->B"}
      />,
    );

    expect(screen.getByText("Request flow")).toBeInTheDocument();
    expect(screen.getByText("architecture")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("img", { name: "Request flow" }).innerHTML,
      ).toContain("mock-svg");
    });
  });
});
```

- [ ] **Step 3: Run the test, confirm it fails**

Run: `pnpm test DiagramPanel`
Expected: FAIL — `./DiagramPanel` module not found.

- [ ] **Step 4: Write the implementation**

```tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

interface DiagramPanelProps {
  title: string;
  type: "architecture" | "class" | "state" | "sequence" | "er";
  chart: string;
}

let mermaidInitialized = false;

export function DiagramPanel({ title, type, chart }: DiagramPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramId = useId().replace(/:/g, "-");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({ startOnLoad: false, theme: "neutral" });
      mermaidInitialized = true;
    }

    let cancelled = false;
    mermaid
      .render(`diagram-${diagramId}`, chart)
      .then(({ svg }) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      })
      .catch((renderError: Error) => {
        if (!cancelled) setError(renderError.message);
      });

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId]);

  return (
    <figure
      className="rounded-md border border-line bg-card p-4"
      data-diagram-type={type}
    >
      <figcaption className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        {type}
      </figcaption>
      <h4 className="mt-1 font-mono text-sm font-semibold text-foreground">
        {title}
      </h4>
      <div
        className="mt-3 overflow-x-auto"
        ref={containerRef}
        role="img"
        aria-label={title}
      />
      {error && (
        <p className="mt-2 text-sm text-destructive">
          Diagram failed to render: {error}
        </p>
      )}
    </figure>
  );
}
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `pnpm test DiagramPanel`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/lesson/DiagramPanel.tsx components/lesson/DiagramPanel.test.tsx package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add DiagramPanel lesson component (Mermaid rendering)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `SectionTracker` component

**Files:**
- Create: `components/lesson/SectionTracker.tsx`
- Test: `components/lesson/SectionTracker.test.tsx`

**Interfaces:**
- Consumes: design tokens from `app/globals.css` (Task 3)
- Produces: `SectionTracker` with props
  `{ sections: string[]; active: string }`. Used by future MDX content
  in Plan 2.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionTracker } from "./SectionTracker";

describe("SectionTracker", () => {
  it("marks only the active section with aria-current", () => {
    render(
      <SectionTracker
        sections={["Problem", "Core", "Trade-offs"]}
        active="Core"
      />,
    );

    expect(screen.getByText("Core").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByText("Problem").closest("li")).not.toHaveAttribute(
      "aria-current",
    );
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test SectionTracker`
Expected: FAIL — `./SectionTracker` module not found.

- [ ] **Step 3: Write the implementation**

```tsx
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
```

- [ ] **Step 4: Run the test, confirm it passes**

Run: `pnpm test SectionTracker`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/lesson/SectionTracker.tsx components/lesson/SectionTracker.test.tsx
git commit -m "$(cat <<'EOF'
Add SectionTracker lesson component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: App shell — `ThemeToggle`, `TopBar`, `Sidebar`

**Files:**
- Create: `components/nav/ThemeToggle.tsx`
- Create: `components/nav/TopBar.tsx`
- Create: `components/nav/Sidebar.tsx`
- Test: `components/nav/ThemeToggle.test.tsx`
- Test: `components/nav/Sidebar.test.tsx`
- Modify: `app/layout.tsx` (wraps `{children}` with `TopBar` + `Sidebar`)

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button` (Task 2),
  `ThemeProvider`/`useTheme` from `next-themes` and
  `components/nav/theme-provider.tsx` (Task 3)
- Produces: `Sidebar`'s nav data is a hardcoded `STUB_NAV` array — this
  is intentionally temporary, replaced by a real tree built from
  `content/` in Plan 2's `lib/content.ts`. Do not treat `STUB_NAV` as
  permanent when Plan 2 starts.

- [ ] **Step 1: Write the failing test for `ThemeToggle`**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme }),
}));

describe("ThemeToggle", () => {
  it("switches to dark when the current resolved theme is light", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
```

- [ ] **Step 2: Run the test, confirm it fails**

Run: `pnpm test ThemeToggle`
Expected: FAIL — `./ThemeToggle` module not found.

- [ ] **Step 3: Write `components/nav/ThemeToggle.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" aria-label="Toggle theme" disabled>
        Theme
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? "Light" : "Dark"}
    </Button>
  );
}
```

- [ ] **Step 4: Run the `ThemeToggle` test, confirm it passes**

Run: `pnpm test ThemeToggle`
Expected: PASS.

- [ ] **Step 5: Write `components/nav/TopBar.tsx`** (no dedicated test —
  presentational composition of `ThemeToggle`, already covered)

```tsx
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
```

- [ ] **Step 6: Write the failing test for `Sidebar`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders each nav section title and its links", () => {
    render(<Sidebar />);

    expect(screen.getByText("High-Level Design")).toBeInTheDocument();
    const ticketmasterLink = screen.getByRole("link", { name: "Ticketmaster" });
    expect(ticketmasterLink).toHaveAttribute(
      "href",
      "/case-studies/ticketmaster/hld",
    );
  });
});
```

- [ ] **Step 7: Run the test, confirm it fails**

Run: `pnpm test Sidebar`
Expected: FAIL — `./Sidebar` module not found.

- [ ] **Step 8: Write `components/nav/Sidebar.tsx`**

```tsx
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
```

- [ ] **Step 9: Run the `Sidebar` test, confirm it passes**

Run: `pnpm test Sidebar`
Expected: PASS.

- [ ] **Step 10: Wire `TopBar` + `Sidebar` into `app/layout.tsx`**

Replace the `<body>` block (written in Task 3) with:

```tsx
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <div className="flex min-h-screen flex-col">
            <TopBar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 px-6 py-6">{children}</main>
            </div>
          </div>
        </ThemeProvider>
      </body>
```

Add the two new imports at the top of the file, alongside the existing
`ThemeProvider` import:

```tsx
import { TopBar } from "@/components/nav/TopBar";
import { Sidebar } from "@/components/nav/Sidebar";
```

- [ ] **Step 11: Run the full test suite and build**

```bash
pnpm test
pnpm build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 12: Commit**

```bash
git add components/nav app/layout.tsx
git commit -m "$(cat <<'EOF'
Add app shell: ThemeToggle, TopBar, Sidebar

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Home page, style guide, and final verification

**Files:**
- Modify: `app/page.tsx` (full rewrite)
- Modify: `app/page.test.tsx` (full rewrite — the Task 1 smoke test file
  was deleted; this recreates it as a real test)
- Create: `app/style-guide/page.tsx`

**Interfaces:**
- Consumes: `SectionTracker` (Task 7), `QuizItem` (Task 4), `Rubric`
  (Task 5), `DiagramPanel` (Task 6) — every component built in this
  plan's parallel batch.
- Produces: nothing consumed by a later task — this is the plan's final
  integration point.

- [ ] **Step 1: Write `app/page.tsx`**

```tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[68ch]">
      <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
        System design course
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">
        High-level and low-level design, built one lesson at a time
      </h1>
      <p className="mt-4 text-foreground">
        A personal interview-prep and reference course covering HLD and
        LLD concepts, applied through per-system case studies like
        Ticketmaster. Each lesson pairs an explanation with diagrams,
        inline self-checks, and a closing practice challenge.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        <li>
          <Link href="/hld" className="text-brand">
            High-Level Design concepts
          </Link>
        </li>
        <li>
          <Link href="/lld" className="text-brand">
            Low-Level Design concepts
          </Link>
        </li>
        <li>
          <Link
            href="/case-studies/ticketmaster/hld"
            className="text-brand"
          >
            Case studies
          </Link>
        </li>
        <li>
          <Link href="/interview-prep" className="text-brand">
            Interview prep
          </Link>
        </li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/page.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("links to each of the four course sections", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "High-Level Design concepts" }),
    ).toHaveAttribute("href", "/hld");
    expect(
      screen.getByRole("link", { name: "Low-Level Design concepts" }),
    ).toHaveAttribute("href", "/lld");
    expect(screen.getByRole("link", { name: "Case studies" })).toHaveAttribute(
      "href",
      "/case-studies/ticketmaster/hld",
    );
    expect(
      screen.getByRole("link", { name: "Interview prep" }),
    ).toHaveAttribute("href", "/interview-prep");
  });
});
```

- [ ] **Step 3: Write `app/style-guide/page.tsx`**

A living visual reference for the four lesson components — kept
long-term, not thrown away after this task (useful during Plan 2's
content authoring).

```tsx
import { SectionTracker } from "@/components/lesson/SectionTracker";
import { QuizItem } from "@/components/lesson/QuizItem";
import { Rubric } from "@/components/lesson/Rubric";
import { DiagramPanel } from "@/components/lesson/DiagramPanel";

export default function StyleGuidePage() {
  return (
    <div className="mx-auto flex max-w-[68ch] flex-col gap-8">
      <h1 className="text-2xl font-semibold text-foreground">Style guide</h1>

      <SectionTracker
        sections={["Problem framing", "Core content", "Trade-offs"]}
        active="Core content"
      />

      <DiagramPanel
        title="Sample request flow"
        type="architecture"
        chart={"graph LR\n  Client --> Gateway --> Service"}
      />

      <QuizItem
        question="Why does DiagramPanel take a chart string instead of MDX children?"
        answer="Extracting Mermaid source from MDX-rendered children reliably needs a custom remark/rehype plugin -- a plain string prop is simpler and just as capable."
      />

      <Rubric
        items={[
          "Covers the six-part lesson template",
          "Diagrams render in both themes",
          "Quiz and rubric interactions work with keyboard only",
        ]}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the full test suite**

```bash
pnpm test
```

Expected: every test across all 9 tasks passes.

- [ ] **Step 5: Run the production build**

```bash
pnpm build
```

Expected: succeeds with no type errors.

- [ ] **Step 6: Start the dev server and visually verify both themes**

```bash
pnpm dev &
```

Then, using a browser tool (Playwright), navigate to
`http://localhost:3000` and `http://localhost:3000/style-guide`, and for
each page:
- Check the page in light mode: confirm the cool-paper background, teal
  links/active states, IBM Plex Mono headings, Source Serif 4 body text
- Toggle to dark mode via the `ThemeToggle` button in the top bar:
  confirm the background/text/accent colors all switch together (no
  page rendering one theme's text on the other theme's background)
- On `/style-guide`: click a `QuizItem`'s reveal button (answer
  appears), check a `Rubric` checkbox (self-score band text updates),
  confirm the `DiagramPanel` shows a rendered SVG diagram, not raw
  Mermaid text

Stop the dev server afterward (`kill %1` or equivalent). If anything
looks wrong (unreadable contrast in either theme, a component not
switching themes, a broken layout), fix it before proceeding — this is
the plan's only visual gate.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/page.test.tsx app/style-guide
git commit -m "$(cat <<'EOF'
Add home page, style guide, and complete the app shell

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
