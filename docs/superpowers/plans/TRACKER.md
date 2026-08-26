# Implementation Plans Tracker

Index of every implementation plan in this directory, with status. This
file is the answer to "what's been executed vs. just planned" — update
it whenever a plan starts, finishes, or a new one is written. Status
values: `Not started`, `In progress`, `Completed`.

## SDD plans (subagent-driven-development / executing-plans)

| Plan | File | Status | Depends on | Notes |
|---|---|---|---|---|
| Case Study Checklist Workflow | [2026-08-26-case-study-lesson-format-and-ticketmaster-checklist.md](2026-08-26-case-study-lesson-format-and-ticketmaster-checklist.md) | **Completed** | — | Landed the checklist-first rule in `CLAUDE.md` and produced Ticketmaster's `CHECKLIST.md`. Commits `c2abfdf`, `1b8a755`. |
| Next.js App Shell + Component Library | [2026-08-26-nextjs-app-shell-implementation.md](2026-08-26-nextjs-app-shell-implementation.md) | **In progress** | — | 9 tasks: scaffold, shadcn/ui, design tokens, `DiagramPanel`/`QuizItem`/`Rubric`/`SectionTracker`, app shell, home + style guide. Dispatched for full execution 2026-08-26. |
| Content Pipeline, MDX Rendering, and Search | [2026-08-26-nextjs-content-pipeline-implementation.md](2026-08-26-nextjs-content-pipeline-implementation.md) | **Not started** | App Shell plan (above) must complete first — imports its components and design tokens | 7 tasks: `lib/content.ts`, MDX element mapping, the 5 dynamic lesson routes, real `Sidebar` data, static search index, `SearchDialog`, end-to-end verification. Queued to start once App Shell is Completed and Playwright-verified. |
| Parking Lot + Amazon Locker Checklists | [2026-08-26-parking-lot-amazon-locker-checklists.md](2026-08-26-parking-lot-amazon-locker-checklists.md) | **Completed** | — | Produced `content/04-case-studies/parking-lot/CHECKLIST.md` (CS-03, commit `0ddfbcd`) and `content/04-case-studies/amazon-locker/CHECKLIST.md` (CS-06, commit `1c726da`), both matching Ticketmaster's structure; all relative links verified. |

## Content-authoring tasks (not SDD plans)

These aren't engineering plans with tasks/tests — they're
research-and-write work following CLAUDE.md's checklist-first,
research-before-drafting workflow, same shape as the `CHECKLIST.md` work
above. Tracked here so they don't fall through the cracks, not as
numbered plan tasks.

| Task | Status | Depends on | Notes |
|---|---|---|---|
| Ticketmaster `hld.mdx` | Not started | Content Pipeline plan (above) — needs a working MDX pipeline to author against | Content plan already exists: [content/04-case-studies/ticketmaster/CHECKLIST.md](../../content/04-case-studies/ticketmaster/CHECKLIST.md) |
| Ticketmaster `lld.mdx` | Not started | Content Pipeline plan (above) | Same checklist as above |
| Parking Lot `lld.mdx` (primary) | Not started | Content Pipeline plan (above) | Checklist ready: [content/04-case-studies/parking-lot/CHECKLIST.md](../../content/04-case-studies/parking-lot/CHECKLIST.md) |
| Parking Lot `hld.mdx` (secondary) | Not started | Same as above | — |
| Amazon Locker `lld.mdx` (primary) | Not started | Content Pipeline plan (above) | Checklist ready: [content/04-case-studies/amazon-locker/CHECKLIST.md](../../content/04-case-studies/amazon-locker/CHECKLIST.md) |
| Amazon Locker `hld.mdx` (secondary) | Not started | Same as above | — |

All content-authoring tasks also follow
[CONTENT-GUIDE.md](../../CONTENT-GUIDE.md)'s quality rules for prose,
diagrams, quizzes, and self-check answers — not just the checklist's
scope.

## How to resume

1. Check this table for the next `Not started` SDD plan whose
   dependencies are `Completed`.
2. Open that plan file, confirm the ledger/commit history matches what
   this table says (git log is the source of truth if they ever
   disagree).
3. Execute via subagent-driven-development or executing-plans, task by
   task.
4. Update this table's Status column (and add commit hashes to Notes)
   as each plan completes.
