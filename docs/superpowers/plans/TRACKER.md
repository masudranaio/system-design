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
| UI/UX Modernization Pass | — (no written plan doc; dispatched directly per user request) | **Completed** | App Shell + Content Pipeline plans — Completed | User flagged the shipped shell as visually bare ("1900s website"). Design tokens (teal-on-cool-paper, IBM Plex Mono + Source Serif 4) kept as-is — the gap was execution polish, not palette. Delivered: sticky/blur TopBar with logomark + styled search trigger (icon + kbd hint), icon-based theme toggle, Sidebar section icons + active-route highlighting (new `components/nav/SidebarNav.tsx` client component + `lib/nav-icons.tsx`), hero + module-card-grid homepage (new `components/ui/card.tsx`), on-brand `app/not-found.tsx`. Commit `80ffe04`, merged via `ecc5dde`. `pnpm build` clean (2 pre-existing non-blocking dynamic-fs-tracing warnings only), 17/17 tests pass. Independently Playwright-verified by the controller in both light and dark theme on `/` (hero, module cards, sidebar with real nav items and icons), `/case-studies/*` lesson pages, and `/this-route-does-not-exist` (404 page) — plus a 375px-viewport check on both `/` and the 404 page confirming no horizontal overflow (sidebar collapses at narrow width with no mobile nav trigger, a known minor gap not requested this pass). |
| Visual & Readability Redesign | [2026-08-27-visual-and-readability-redesign-implementation.md](2026-08-27-visual-and-readability-redesign-implementation.md) | **Completed** | UI/UX Modernization Pass — Completed | User feedback round 2: flat/generic color, cramped type, "empty space" that wasn't helping readability, and diagrams described as "bull sheet" — wanted color, motion, and zoom (ByteByteGo-referenced), plus more scannable/bulleted content over dense prose. Spec: [2026-08-27-visual-and-readability-redesign-design.md](../specs/2026-08-27-visual-and-readability-redesign-design.md). Six tasks, three waves — Task 1 (tokens/type scale, `ff1f276`) solo; Tasks 2-4 dispatched in parallel via isolated worktrees (`CompareTable`/`KeyStat`/`Point` components `ae87719`→merged `6cd6cea`; diagram role classifier + pan-zoom hook `da81ca3`→merged `b5779ef`; sidebar/mobile-nav refresh `147006a`→merged `147006a` direct); Task 5 (`f80f862`) solo, DiagramPanel color/motion/zoom/fullscreen integration — surfaced and fixed 5 real bugs live-verification-only unit tests couldn't catch (mermaid's khroma color engine can't parse CSS custom properties/`color-mix()`, wrong assumed SVG shape selectors, mermaid's own ID-scoped embedded `<style>` out-specifying every class override, a Base UI Dialog mount-timing race losing the fullscreen ref, and a dark-mode label-legibility regression) — see `app/globals.css`'s inline comments for the full diagnosis of each. Task 6: controller-driven Playwright verification, both themes — confirmed role-colored diagrams, ambient connector animation (and its correct suppression under `prefers-reduced-motion: reduce`, checked via `page.emulateMedia`), inline + fullscreen zoom/pan, and the new mobile-nav slide-over at 375px with no horizontal overflow — all passed clean on the first pass, no fixes needed. `pnpm test`: 17/17 files, 31/31 tests. `pnpm build`: clean (same 2 pre-existing advisories). **Content retrofit (the 6 existing lessons' scannable-format rewrite) is explicitly NOT part of this plan** — tracked as a new, not-yet-started row below once picked up. |

## Content-authoring tasks (not SDD plans)

These aren't engineering plans with tasks/tests — they're
research-and-write work following CLAUDE.md's checklist-first,
research-before-drafting workflow, same shape as the `CHECKLIST.md` work
above. Tracked here so they don't fall through the cracks, not as
numbered plan tasks.

| Task | Status | Depends on | Notes |
|---|---|---|---|
| Ticketmaster `hld.mdx` | **Built and verified** (579 lines) | Content Pipeline plan (above) — needs a working MDX pipeline to author against | Commit `d4ad156`, merged via `11b19e4`. Checklist complete: [content/04-case-studies/ticketmaster/CHECKLIST.md](../../content/04-case-studies/ticketmaster/CHECKLIST.md) |
| Ticketmaster `lld.mdx` | **Built and verified** (625 lines) | Content Pipeline plan (above) | Commit `a16cee0`, merged via `340eba5`. Completeness pass finished by the controller (was interrupted mid-pass) — same checklist as above |
| Parking Lot `lld.mdx` (primary) | **Built and verified** (700 lines) | Content Pipeline plan (above) | Commit `2faad7a`, merged via `2e64018`. Checklist complete: [content/04-case-studies/parking-lot/CHECKLIST.md](../../content/04-case-studies/parking-lot/CHECKLIST.md) |
| Parking Lot `hld.mdx` (secondary) | **Built and verified** (546 lines) | Same as above | Commit `b8f510b`, merged via `ac4a8c7` (conflicted with the LLD agent's edit to the shared `CHECKLIST.md` status line — resolved by the controller to state both sides built). |
| Amazon Locker `lld.mdx` (primary) | **Built and verified** (675 lines) | Content Pipeline plan (above) | Commit `f70b096`, merged via `893f6db`. Checklist complete: [content/04-case-studies/amazon-locker/CHECKLIST.md](../../content/04-case-studies/amazon-locker/CHECKLIST.md) |
| Amazon Locker `hld.mdx` (secondary) | **Built and verified** (602 lines) | Same as above | Commit `4f4ac30`, merged via `7bdf39f`. Completeness pass finished by the controller (was interrupted before it started — checklist had zero ticks). |

**Spend-limit interruption (2026-08-26, ~10pm Asia/Dhaka) — now resolved.**
All 7 agents dispatched for this pass (6 content + 1 UI) were killed
mid-task by the account's API spend limit before any of them could commit
their own work or finish self-verification — each had already fully
drafted its file(s) in an isolated git worktree, so nothing was lost. The
controller committed each worktree's uncommitted changes directly, merged
all 7 branches into master (one real conflict: both Parking Lot agents
edited the same `CHECKLIST.md` status line, resolved manually).

Once the user confirmed budget was available, the controller finished the
verification pass: started the dev server and drove it with Playwright
across all 6 lesson routes plus the homepage and 404 page, in both
light and dark theme. This caught **two real bugs** the killed agents
never got to surface:

1. **MDX doesn't parse raw HTML comments.** All content agents were told
   to mark concept-lesson gaps with `<!-- concept-dependency: ... -->`,
   which produced a hard 500 on every case-study route (`Unexpected
   character '!' ... to create a comment in MDX, use {/* text */}`).
   Fixed by converting all 31 occurrences across 5 files to JSX comment
   syntax (`{/* ... */}`).
2. **Duplicated "(LLD)" in Ticketmaster's sidebar label** — its `lld.mdx`
   frontmatter title already ended in "(LLD)", and `lib/content.ts`
   appends the same suffix automatically, rendering "(LLD) (LLD)" in the
   nav. Fixed by removing the manual suffix from the frontmatter.

The controller then finished the completeness-pass work three of the six
agents didn't reach before being killed (Ticketmaster's `lld.mdx` had
zero checklist items ticked and no log entry; Parking Lot's `lld.mdx` had
its checkboxes ticked but no log entry; Amazon Locker's `hld.mdx` had
neither) — each verified against the actual finished lesson content, not
assumed from the agent's prior claim. All 6 `CHECKLIST.md` files are now
fully ticked with a completeness-pass log entry per side. `pnpm build`
and the full test suite (17/17) stayed clean throughout, and the search
index was regenerated to include all 6 lessons.

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
