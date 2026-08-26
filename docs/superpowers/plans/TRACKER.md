# Implementation Plans Tracker

Index of every implementation plan in this directory, with status. This
file is the answer to "what's been executed vs. just planned" — update
it whenever a plan starts, finishes, or a new one is written. Status
values: `Not started`, `In progress`, `Completed`.

## SDD plans (subagent-driven-development / executing-plans)

| Plan | File | Status | Depends on | Notes |
|---|---|---|---|---|
| Case Study Checklist Workflow | [2026-08-26-case-study-lesson-format-and-ticketmaster-checklist.md](2026-08-26-case-study-lesson-format-and-ticketmaster-checklist.md) | **Completed** | — | Landed the checklist-first rule in `CLAUDE.md` and produced Ticketmaster's `CHECKLIST.md`. Commits `c2abfdf`, `1b8a755`. |
| Next.js App Shell + Component Library | [2026-08-26-nextjs-app-shell-implementation.md](2026-08-26-nextjs-app-shell-implementation.md) | **Completed** | — | 9 tasks, one commit each: `4163129` scaffold, `5af4ca3` shadcn/ui (button+checkbox), `ff214d5` tokens/fonts/theme, `56984df` QuizItem, `0dcf4a8` Rubric+SelfScoreBand, `ad409ea` DiagramPanel, `0c435e0` SectionTracker, `9cef3f5` app shell, `fcbf8c5` home+style-guide. 10/10 tests pass, `pnpm build` clean. Playwright-verified in both light and dark theme on `/` and `/style-guide` (home page, theme toggle, quiz reveal, rubric→self-score-band, mermaid render) — once by the implementer, once independently by the controller. shadcn/ui now scaffolds Base UI (not Radix) primitives; APIs stayed compatible. |
| Content Pipeline, MDX Rendering, and Search | [2026-08-26-nextjs-content-pipeline-implementation.md](2026-08-26-nextjs-content-pipeline-implementation.md) | **Completed** | App Shell plan (above) — Completed | 6 commits: `e52187c` lib/content.ts, `65366a8` mdx-components, `6474418` 5 dynamic routes, `0c7999c` Sidebar on real nav tree, `2ac328e` search index script, `0a74695` SearchDialog+TopBar (fixed a real shadcn `CommandDialog` bug: it wasn't wrapping children in `<Command>`, breaking cmdk's context). Task 7 (fixture-based e2e check) left no diff to commit — fixture created, verified, deleted, `content/` untouched. 17/17 tests pass, `pnpm build` clean (one pre-existing Next.js advisory warning about dynamic fs tracing in `lib/content.ts`, not an error — worth a follow-up `turbopackIgnore` scoping pass later, not blocking). Playwright-verified in both themes by the implementer and independently by the controller: sidebar nav tree, dynamic route rendering (diagram/quiz/rubric), and the new SearchDialog (Search button + Ctrl+K, live filtering, correct empty state) all confirmed in light and dark. Minor cosmetic nit noted, not fixed: the search dialog's empty state renders a stray empty "Lessons" group heading under "No lessons found." — harmless once real content exists, low priority. |
| Parking Lot + Amazon Locker Checklists | [2026-08-26-parking-lot-amazon-locker-checklists.md](2026-08-26-parking-lot-amazon-locker-checklists.md) | **Completed** | — | Produced `content/04-case-studies/parking-lot/CHECKLIST.md` (CS-03, commit `0ddfbcd`) and `content/04-case-studies/amazon-locker/CHECKLIST.md` (CS-06, commit `1c726da`), both matching Ticketmaster's structure; all relative links verified. |
| UI/UX Modernization Pass | — (no written plan doc; dispatched directly per user request) | **In progress** | App Shell + Content Pipeline plans — Completed | User flagged the shipped shell as visually bare ("1900s website"). Design tokens (teal-on-cool-paper, IBM Plex Mono + Source Serif 4) are kept as-is — the gap is execution polish, not palette. Scope: TopBar (sticky/blur, logo mark, styled search trigger, icon theme toggle), Sidebar (icons, active-route state, hover), Homepage (hero + module card grid replacing bullet list), on-brand 404, spacing/elevation/focus-state pass. `lucide-react` already a dependency. Dispatched as one agent touching only shared shell files (`app/`, `components/nav/*`, `components/search/*`, `app/page.tsx`, `app/not-found.tsx`) — no overlap with Track B content files. |

## Content-authoring tasks (not SDD plans)

These aren't engineering plans with tasks/tests — they're
research-and-write work following CLAUDE.md's checklist-first,
research-before-drafting workflow, same shape as the `CHECKLIST.md` work
above. Tracked here so they don't fall through the cracks, not as
numbered plan tasks.

| Task | Status | Depends on | Notes |
|---|---|---|---|
| Ticketmaster `hld.mdx` | In progress | Content Pipeline plan (above) — needs a working MDX pipeline to author against | Content plan already exists: [content/04-case-studies/ticketmaster/CHECKLIST.md](../../content/04-case-studies/ticketmaster/CHECKLIST.md) |
| Ticketmaster `lld.mdx` | In progress | Content Pipeline plan (above) | Same checklist as above |
| Parking Lot `lld.mdx` (primary) | In progress | Content Pipeline plan (above) | Checklist ready: [content/04-case-studies/parking-lot/CHECKLIST.md](../../content/04-case-studies/parking-lot/CHECKLIST.md) |
| Parking Lot `hld.mdx` (secondary) | In progress | Same as above | — |
| Amazon Locker `lld.mdx` (primary) | In progress | Content Pipeline plan (above) | Checklist ready: [content/04-case-studies/amazon-locker/CHECKLIST.md](../../content/04-case-studies/amazon-locker/CHECKLIST.md) |
| Amazon Locker `hld.mdx` (secondary) | In progress | Same as above | — |

**Ruling (2026-08-26):** all 6 rows above depend per `content/04-case-studies/SYLLABUS.md`
on HLD/LLD concept lessons (HLD-01/03/06/07/10, LLD-01–06) that don't exist yet
(0/12 built each). User explicitly requested all 3 case studies fully completed now
and authorized bulk/parallel generation, overriding CLAUDE.md's default "one lesson
at a time" / "flag missing dependencies" rule for this pass. Decision: case study
lessons are written self-contained, briefly explaining each needed concept inline
where a concept-lesson link would normally go, each flagged with an HTML comment
`<!-- concept-dependency: HLD-06 not yet built, explained inline -->` so a future
pass can replace the inline explanation with a real link once that concept lesson
exists. Building the concept modules themselves remains out of scope for this pass.

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
