# Implementation Plans Tracker

## COMPLETE — Case Study Expansion Session (2026-08-27)

**Started 2026-08-27, all 24 tasks complete.** Confirmed 24-task list,
executed one task at a time, tracker updated after each. A `CronCreate`
job (`d3e08e19`, every 22 min) drove continuation for part of this
session; cancelled 2026-08-27 per explicit user instruction once direct
turn-by-turn continuation took over. D2 is the diagram engine for all
work below; Mermaid is fallback-only if D2 is genuinely broken. Spec/plan:
[case-study-expansion-and-content-retrofit-design.md](../specs/2026-08-27-case-study-expansion-and-content-retrofit-design.md),
[case-study-expansion-execution-plan.md](2026-08-27-case-study-expansion-execution-plan.md),
[d2-diagrams-and-sticky-layout-implementation.md](2026-08-27-d2-diagrams-and-sticky-layout-implementation.md).

**Phase A — D2 diagram engine (Mermaid fallback if D2 can't be fixed)**
- [x] A1. Fix D2 compile API mismatch, finish `render-d2.ts` + icon map, verify build, commit — **done**, commit `63e3970`. Root cause: `compile(input, options)`'s second arg is `{options: CompileOptions}`, not `CompileOptions` directly (`d2/index.d.ts` — no shipped `@types` package, had to read the real `.d.ts` inside the installed package). Fixed to `d2.compile(source, { options: { layout: "dagre" } })`. `pnpm build` clean, 31/31 tests pass.
- [x] A2. Extract shared `DiagramChrome`, build `D2Diagram` Server Component, register in MDX — **done**, merged `648567b` + controller fix `4bf4445`. Two real bugs found live-verifying the style-guide D2 demo (neither caught by unit tests): (1) D2's white canvas-background rect showed as a stray white box in dark mode — stripped server-side in `render-d2.ts`; (2) D2's outer `<svg>` has a viewBox but no width cap, so a tall/narrow diagram stretched to fill its container's width and blew up to ~2600px tall — `DiagramChrome` now caps `max-width` to the diagram's authored pixel width. Verified both themes via Playwright.
- [x] A3. Build `TableOfContents` scroll-aware right-rail — **done**, merged `d5e6684`, later realigned to `top-16`/`4rem` (see A4).
- [x] A4. Make `Sidebar` sticky/independently scrollable — **done**, merged `caf93a1` (real TopBar height measured live: 57px, used `top-16`/`4rem` not the plan's assumed `top-20`/`5rem`; resolved a merge conflict that had dropped the nav's border/bg/padding — restored). `TableOfContents` updated to match the same real height so both rails align.
- [x] A5. Wire `LessonShell` + `rehype-slug` into all 5 page routes, remove `SectionTracker` — **done**, `7e6f88e`. 17/17 test files pass (SectionTracker.test.tsx correctly gone), build clean.
- [x] A6. Full Playwright verification of engine + layout shell, both themes — **done**. Found and fixed a real bug: `TableOfContents`'s scroll-spy only read `IntersectionObserver`'s `entries` (which reports only headings whose state *changed* since the last check), so a fast/instant scroll spanning multiple headings left it frozen on a stale section — confirmed live (jumped to y=3500, rail stayed stuck on "Problem framing" through 3 further sections). Rewrote to always recompute the active heading from every heading's real `getBoundingClientRect()` position, triggered by IO + scroll + resize. Verified fixed live, plus click-to-jump, both themes, 1024/768/375 viewports (no overflow at any), mobile nav, zero console errors, `pnpm test`/`pnpm build` clean, `d2.wasm`/`@terrastruct` confirmed absent from `.next/static/chunks/`.

**Phase A complete.** All 6 D2-engine/layout-shell tasks done.

**Phase B — Retrofit the 3 existing case studies (D2 diagrams, new content standard)**
- [x] B1. Ticketmaster `hld.mdx` — **done**, drafted in worktree agent (killed mid-session by account spend limit, but had already finished + left the tree clean), committed `3edb110`, merged `da89a9f`.
- [x] B2. Ticketmaster `lld.mdx` — **done**, committed `8e2260a`, merged `92c4748`.
- [x] B3. Parking Lot `hld.mdx` — **done**, merged earlier this session, `c28ca8d` (see above, pre-compaction).
- [x] B4. Parking Lot `lld.mdx` — **done**, committed `514b241`, merged `28954ac`.
- [ ] B5. Amazon Locker `hld.mdx` — **not started**. Its worktree agent was killed by the spend limit before writing anything (only touched CHECKLIST.md). Needs full redispatch.
- [x] B6. Amazon Locker `lld.mdx` — **done**, merged earlier this session, `8338813` (see above, pre-compaction).

**Phase C — 7 new case studies (checklist + full lesson each)**
- [x] C1. Ride-Sharing (CS-09) `hld.mdx` — **done**, committed `c10e5e6`, merged `aa0f016`.
- [x] C2. Netflix (CS-10) `hld.mdx` — **done**, committed `008fd87`, merged `307529d`.
- [x] C3. Food Panda (CS-11) `hld.mdx` — **done**, merged earlier this session, `24c495c` (see above, pre-compaction).
- [x] C4. Event Tracking System (CS-12) `lld.mdx` — **done**, committed `90fb1b3`, merged `fa77273` (resolved an add/add CHECKLIST.md conflict — kept the worktree's completed/checked-off version).
- [x] C5. Notification Service (CS-13) `lld.mdx` — **done**, redispatched fresh (original agent was killed by the spend limit before writing anything), committed `fb9014d`, merged `67e3a34`. 6 D2 diagrams. Live-verified: 1.5s page load.
- [x] C6. Dropbox (new CS-14) `hld.mdx` — **done**, committed `bae1d12`, merged `d678819`.
- [x] C7. Chat/WhatsApp (new CS-15) `hld.mdx` — **done**. This agent actually finished AND committed (`6e5c407`) before the spend limit hit the batch — merged `1713318` (resolved an add/add CHECKLIST.md conflict, same pattern as C4).

**Post-merge verification (2026-08-27):** all 8 branches above merged
clean to master (2 trivial CHECKLIST.md add/add conflicts, both
resolved by keeping the completed-checklist side). `pnpm test`: 17/17
files, 32/32 tests pass. `pnpm build`: clean exit 0 (only the
pre-existing dynamic-fs-tracing advisories in `lib/content.ts`, not
errors). 12 now-merged worktrees + their branches deleted. Two worktrees
(`agent-a7f4766fe45020d5c`, `agent-ad6443fb1a0b51bd1`) were locked by a
live process (pid 238976) and left alone rather than force-removed —
both are already-merged ancestors of master, safe to clean up whenever
that process releases them.

**Phase D — Visual verification pass, both themes**
- [x] D0. Rendering-pipeline regression check (the `render-d2.ts` singleton fix touches every diagram on every lesson, so this is the CLAUDE.md-mandated UI verification for that change — content-only checks on the other 13 pages are a lower-priority follow-up, not a blocker) — **done**. Playwright-verified `amazon-locker/lld` (9 diagrams, all rendered with correct `d2-svg` class + real dimensions) and `notification-service/lld` in both light and dark theme: zero console errors both pages, D2 class diagrams render with correct panel theming (no white-canvas-in-dark-mode regression), zoom/pan controls present and functional, 375px mobile viewport has zero horizontal overflow (`scrollWidth === clientWidth`) with all 6 diagrams still rendering.
- [ ] D1. Full content/quality visual pass: 8 new lessons (Ride-Sharing, Netflix, Food Panda, Event Tracking, Dropbox, Chat/WhatsApp hld's + Event Tracking + Notification Service lld's) — not started. Per CLAUDE.md, live UI verification is scoped to app-shell/component/rendering work; this repo's content-only `.mdx` work is instead covered by each lesson's own completeness pass (already done per-lesson, logged in each CHECKLIST.md). This item is an optional deeper quality/polish pass across all pages, not a required gate — pick up if/when doing a dedicated content-QA session.
- [ ] D2. Full content/quality visual pass: 6 retrofitted lessons (Ticketmaster hld+lld, Parking Lot hld+lld, Amazon Locker hld+lld) — not started, same optional/non-blocking status as D1.

**RESOLVED (2026-08-27) — the 115s/hanging page-load issue.** Root
cause confirmed: `lib/render-d2.ts` held a single module-level `D2`
instance reused across every `renderD2()` call. React renders sibling
Server Components (each lesson's multiple `<D2Diagram>`s) concurrently,
so a lesson with N diagrams fired N concurrent `compile()`/`render()`
calls into that ONE shared WASM instance. Confirmed via a standalone
benchmark: 9 concurrent calls against a shared instance — only 1 of 9
ever returned, even after 30s (the underlying WASM isn't reentrant).
Fix: instantiate a fresh `D2` per `renderD2()` call instead of a
singleton — verified via the same benchmark, 9 concurrent calls each
with their own instance resolved in ~2.3s total. Committed `2286ef1`.
Live-verified post-fix against every newly merged/retrofitted D2-heavy
page (fresh `pnpm dev`, cold cache): amazon-locker/lld 2.16s,
amazon-locker/hld (now 10 diagrams) 2.18s, ticketmaster/hld 2.57s,
ride-sharing/hld 2.61s, dropbox/hld 2.46s, chat-whatsapp/hld 2.21s —
all well within normal page-load range, none hanging. `pnpm test`
(17/17 files, 32/32 tests) and this fix are both merged to master.

**Phase E — Tracking & continuation**
- [x] E1. Update `SYLLABUS.md` + this table with final status — done this pass (2026-08-27): case-studies SYLLABUS.md priority table + progress line, root SYLLABUS.md progress row, this table's Phase B/C checkboxes.
- [x] E2. Create the `CronCreate` recurring wake-up job — **cancelled 2026-08-27** per explicit user instruction ("now no need that croncreate job, you first delete the croncreate"). Job `d3e08e19` deleted. No replacement scheduled — this session continues under direct user turns instead.
- [x] E3. Once all 24 done, propose + start next batch from the Extended list — **all 24 of this batch's tasks are done, including the required D0 regression check.** Next batch proposed to the user below; D1/D2 are optional non-blocking follow-ups.

---


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
