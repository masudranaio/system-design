# Case Study Expansion and Content Retrofit — Execution Plan

**Spec:** [docs/superpowers/specs/2026-08-27-case-study-expansion-and-content-retrofit-design.md](../specs/2026-08-27-case-study-expansion-and-content-retrofit-design.md)

**This is a content-authoring execution plan, not an SDD code plan.**
The work here is research and prose against `CHECKLIST.md`s, following
CLAUDE.md's existing checklist-first process — not code with tests, so
it doesn't use `superpowers:subagent-driven-development`'s TDD task
format. It's tracked the same way the original 3 case studies were
(`TRACKER.md`'s "Content-authoring tasks" table), and dispatched via
`superpowers:dispatching-parallel-agents` where lessons are independent
of each other, same pattern as before.

**Status: written, not started.** Per explicit instruction, no
implementation begins until told to proceed — this document exists so
the execution order is decided and visible before any content or code
work resumes, for both this batch and the D2 engineering plan it's
paused alongside.

**Current paused state (2026-08-27):** the D2 engineering plan's Task 1
was interrupted mid-step — `@terrastruct/d2` and `rehype-slug` are
already installed (`package.json`/`pnpm-lock.yaml` modified,
uncommitted) and `lib/render-d2.ts` exists (uncommitted, untracked).
Nothing else from that plan has been touched. This is left as-is,
neither committed nor reverted, until implementation resumes — whoever
resumes should `git status` first and pick up from there rather than
assuming a clean slate or re-doing Task 1 from scratch.

## Phase 0 — Sequencing decision (blocks everything else)

Per the spec's §4, decide before Phase 2 starts:
- **A**: finish the D2 engineering plan + Ticketmaster pilot first,
  write all new/retrofitted diagrams in D2 from the start.
- **B**: start content now in Mermaid (already working), migrate later
  if D2 is approved beyond the pilot.

Whoever resumes this plan should get an explicit answer to this before
Phase 2, not assume one.

## Phase 1 — `CHECKLIST.md` for the 5 new case studies

One per system (CS-09 through CS-13), in
`content/04-case-studies/<system>/CHECKLIST.md`, matching the existing
3 systems' structure: problem scope (functional/non-functional
requirements, explicit in-scope/out-of-scope), and a checkbox list of
every diagram/concept/trade-off/pattern/self-check item the primary
lesson must contain — reviewed against the relevant concept-module
dependencies listed in `content/04-case-studies/SYLLABUS.md`'s table
(HLD-01/03/06/07/08/09/10, LLD-01–06 as applicable per system), per
CLAUDE.md's existing rule. Independent across the 5 systems — safe to
write in parallel, one dispatch per system, or one agent doing all 5 in
sequence if that's cheaper; either is fine since these are read-only
research-into-a-checklist tasks with no shared file conflicts.

Applying the spec's §2 content-format standard starts here, not just
in the drafting phase: each checklist's diagram list should already
reflect "more diagrams, more granular" (e.g., a caching deep-dive gets
its own diagram entry, not folded into the architecture diagram's
checklist line) and its topic list should already reflect "more topics
per topic" (e.g., a matching-service section's checklist should name
the 2-3 mechanisms it needs to cover, not just "matching algorithm").

- [ ] CS-09 Ride-Sharing `CHECKLIST.md`
- [ ] CS-10 Netflix `CHECKLIST.md`
- [ ] CS-11 Food Panda `CHECKLIST.md`
- [ ] CS-12 Event Tracking System `CHECKLIST.md`
- [ ] CS-13 Notification Service `CHECKLIST.md`

## Phase 2 — Draft the 5 new primary lessons

Research-then-draft, per CLAUDE.md's existing 5-step process (check
`SYLLABUS.md` → checklist already done in Phase 1 → research reference
sources + open web → use as reference not source text → redraw
diagrams). Each lesson written to the spec's §2 content-format
standard: bullets/tables by default, `CompareTable`/`KeyStat`/`Point`
used throughout, more and smaller diagrams than the original 3 systems'
lessons averaged, more granular topic coverage per section.

Five independent files (`content/04-case-studies/<system>/{hld or
lld}.mdx`, primary side per the spec's table) — genuinely
parallelizable, same as the original Ticketmaster/Parking Lot/Amazon
Locker batch: dispatch via `superpowers:dispatching-parallel-agents`
with git-worktree isolation, one agent per system, merged back once
each completes.

- [ ] CS-09 Ride-Sharing `hld.mdx`
- [ ] CS-10 Netflix `hld.mdx`
- [ ] CS-11 Food Panda `hld.mdx`
- [ ] CS-12 Event Tracking System `lld.mdx`
- [ ] CS-13 Notification Service `lld.mdx`

## Phase 3 — Retrofit the 6 existing lessons

`content/04-case-studies/{ticketmaster,parking-lot,amazon-locker}/{hld,lld}.mdx`
— rewritten to the spec's §2 standard. This is **not** a re-scope: per
the original redesign spec's ruling, every fact/diagram-concern/
trade-off/quiz/rubric-item currently in each lesson's `CHECKLIST.md`
must still be covered after the rewrite, PLUS the additional
diagrams/topics the new standard calls for get added to that
checklist before the rewrite starts (checklist gets updated, not just
re-verified against, since the content bar genuinely went up). Six
independent files — parallelizable the same way as Phase 2.

- [ ] Ticketmaster `hld.mdx` retrofit (+ checklist update first)
- [ ] Ticketmaster `lld.mdx` retrofit (+ checklist update first)
- [ ] Parking Lot `hld.mdx` retrofit (+ checklist update first)
- [ ] Parking Lot `lld.mdx` retrofit (+ checklist update first)
- [ ] Amazon Locker `hld.mdx` retrofit (+ checklist update first)
- [ ] Amazon Locker `lld.mdx` retrofit (+ checklist update first)

## Phase 4 — Visual verification round (all 11 files)

Per the spec's §3 — not a checklist-ticking pass, a real read: start
the dev server, navigate to each of the 11 lesson routes (5 new + 6
retrofitted) in both themes, read the actual rendered text and every
diagram, judge whether it reads fast and looks right, fix what
doesn't. Report findings the same way every prior verification pass in
this repo has (e.g. `TRACKER.md`'s spend-limit-interruption log, the
mermaid-comment-bug fix) — specifics of what was found and changed,
not just "verified, all good."

- [ ] Visual pass: 5 new lessons
- [ ] Visual pass: 6 retrofitted lessons
- [ ] `pnpm test && pnpm build` clean

## Phase 5 — Update tracking, then continue

Update `content/04-case-studies/SYLLABUS.md` (flip CS-09–13 to `[x]`,
update progress counters) and `TRACKER.md` (new content-authoring rows
for all 11 files, same table shape as the original 3 systems).

Per the standing instruction ("if completed, choose new topics and
start again, don't stop until told to stop"): once Phase 4 is clean,
the next step is proposing another batch of case studies from the
extended list (`content/04-case-studies/SYLLABUS.md`'s "Extended list"
table currently has 12 remaining: Pastebin, Twitter/News Feed,
Chat/WhatsApp, YouTube, Dropbox, Instagram, Web Crawler, Search
Autocomplete, Connect Four, Movie Ticket Booking, Inventory Management,
Vending Machine) and repeating Phases 1-5 for that batch — without
waiting for a fresh approval round each time, per that instruction.
This repeats until told to stop.
