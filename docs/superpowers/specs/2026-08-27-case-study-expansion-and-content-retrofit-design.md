# Case Study Expansion and Content Retrofit — Design

## Why this changed

Two related requests from the same conversation: (1) the 6 already-built
lesson files (Ticketmaster, Parking Lot, Amazon Locker — both sides
each) still read as dense prose despite the tooling for a scannable
format (`CompareTable`, `KeyStat`, `Point`) already existing since the
visual redesign — that retrofit was specced but never executed; (2) the
user wants the course's case-study roster expanded now, naming five
systems explicitly: Ride-Sharing, Netflix, Food Panda, Event Tracking,
and Notifications — plus a standing instruction to keep proposing and
building further topics in batches after this one, without stopping
for approval each time, until told to stop.

This spec covers **what** gets built and **to what content standard**.
It does not re-litigate the diagram engine decision — that's
[2026-08-27-d2-diagrams-and-sticky-layout-design.md](2026-08-27-d2-diagrams-and-sticky-layout-design.md),
whose implementation plan is written but not yet executed. See §4 for
how these two workstreams sequence against each other.

## 1. The five new case studies

Added to `content/04-case-studies/SYLLABUS.md`'s priority table as
CS-09 through CS-13 (already committed, commit `8dc03ef`). Primary side
only this pass, per the user's confirmed scope decision — matches the
existing pattern where every one of CS-03/06/08 started with one side.

| ID | System | Primary angle | Why this system, not a generic pick |
|---|---|---|---|
| CS-09 | Ride-Sharing (Uber-style) | HLD — real-time geo-matching, dispatch at scale, surge pricing | Classic "two-sided marketplace with location" problem; different scaling shape than anything else in the course (no fixed inventory, matching is the hard part, not consistency) |
| CS-10 | Netflix (Video Streaming) | HLD — CDN/adaptive-bitrate delivery, catalog + recommendation at global scale | First course system centered on content *delivery* (bandwidth, CDN edge, encoding ladders) rather than transactional correctness — a genuinely different HLD skillset than Ticketmaster/Parking Lot's write-consistency focus |
| CS-11 | Food Panda (Food Delivery) | HLD — real-time order-to-delivery matching, live tracking, ETA prediction | Combines Ride-Sharing's geo-matching with Ticketmaster-style multi-party state (restaurant, courier, customer) — a natural "apply both" system once CS-08 and CS-09 exist |
| CS-12 | Event Tracking System (log/analytics pipeline) | **LLD** — event schema, ingestion SDK/batching, processor class design | User explicitly asked for an LLD-focused pick; promoted from the extended list's "Logging Service" entry, reframed around event/analytics tracking specifically |
| CS-13 | Notification Service (email/SMS/push) | **LLD** — channel abstraction, template + delivery-status state machine, retry/dedup | Second explicit LLD-focused pick; a system every other case study in this course implicitly depends on (booking confirmations, delivery updates) but none has designed directly |

Each gets a `CHECKLIST.md` (problem scope + section-by-section coverage
list) written before any MDX, per CLAUDE.md's existing process — no
change to that rule, just applying it five more times.

## 2. Content-format standard (applies to the retrofit AND all new lessons)

This amends
[2026-08-27-visual-and-readability-redesign-design.md](2026-08-27-visual-and-readability-redesign-design.md)'s
§4 (which already established bullets-over-paragraphs, `CompareTable`/
`KeyStat`/`Point`) — this section makes it more specific and pushes it
further, per the user's explicit "more diagrams, more topics, less
plain text" direction:

- **More diagrams per lesson, and more granular ones.** Where a
  section today explains 3-4 related ideas in one paragraph block, it
  should instead pair each idea with its own small diagram (2-5 nodes)
  — not one large diagram carrying the whole section's explanatory
  weight. A lesson with 4-5 diagrams total (the current rough norm) is
  the floor, not the target, for the new lessons and the retrofit.
- **More granular topic coverage, not just reformatted prose.** "Add
  more topics in each topic" — a deep-dive that currently covers one
  mechanism should cover the 2-3 mechanisms a real interview
  conversation would actually branch into (e.g., a caching deep-dive
  should also touch invalidation strategy and cache stampede, not just
  cache-aside as one paragraph). This is genuinely more content, not a
  reshuffle of existing content — the retrofit for the 3 existing
  systems is expected to grow each lesson's topic count, not just its
  formatting.
- **Default to bullets and tables; paragraphs are the exception.**
  Tightens the redesign spec's existing "no wall of text longer than
  ~6 lines" rule: a paragraph is now the deliberate choice for
  narrative motivation and worked-example sequences specifically (per
  CONTENT-GUIDE's existing rules, unchanged) — everything else
  (requirements, comparisons, mechanism lists, API surfaces) defaults
  to a bullet list, a `CompareTable`, or a small diagram, in that order
  of preference before falling back to prose.
- **"To the point" text.** Every sentence that survives should carry a
  fact, a number, or a decision — no throat-clearing, no restating the
  heading in prose form before the bullets that already say it.

This standard is written into `CONTENT-GUIDE.md` as part of the
execution plan's first task (not yet done — see the plan doc), so it's
the actual authoring reference, not just described here.

## 3. Visual verification round

New addition to the existing completeness-pass process (CLAUDE.md's
"After writing a lesson" section, and the UI-verification rule): once a
lesson is drafted, a verification pass reads it **visually**, not just
against the checklist — the same Playwright-driven approach already
used for engineering verification, applied to content:

- Navigate to the actual rendered page, in both light and dark theme.
- Read the actual rendered text at real size/width — does it read fast?
  Are there still walls of text that should have become a table/bullets?
- Look at every rendered diagram — not just "did it render without a
  console error," but does it actually communicate the thing it's
  captioned to communicate, are node roles colored sensibly, is
  anything visually cramped or overlapping.
- Judge and adjust — this pass is expected to find real things to fix,
  not just confirm nothing crashed. Report what was found and changed,
  same as every prior verification pass in this repo's history.

## 4. Sequencing against the D2 diagram engine work

The D2 engineering plan
([implementation plan](../plans/2026-08-27-d2-diagrams-and-sticky-layout-implementation.md))
is fully written and approved but **not yet executed** — paused mid-Task-1
per the user's instruction to write this plan first. It stays paused
until the user says to resume implementation.

This matters for sequencing: the 5 new lessons and the 6-lesson
retrofit both need diagrams, and diagrams need a rendering engine.
Two honest options, not resolved here:

- **A — Finish the D2 plan and the Ticketmaster pilot first**, then
  write all new/retrofitted diagrams in D2 from the start. Avoids
  drawing ~30+ new diagrams in Mermaid only to redo them later if D2
  is approved after seeing the pilot.
- **B — Start the content work now in Mermaid** (already fully working,
  used successfully by all 6 existing lessons), and let a later pass
  migrate diagrams to D2 if/when it's rolled out beyond the
  Ticketmaster pilot.

Not deciding this in the spec — it's an execution-order question for
the plan/for whenever implementation resumes, not a design question.

## 5. Non-goals

- Not building secondary sides for CS-09–13 in this pass.
- Not building the 12+12 HLD/LLD concept lessons — same standing
  deferral as every case study built so far.
- Not deciding the D2-vs-Mermaid sequencing question here (§4).
