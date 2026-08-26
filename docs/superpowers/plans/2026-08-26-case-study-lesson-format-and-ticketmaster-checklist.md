# Case Study Lesson Format + Ticketmaster Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Status: Completed** (all 4 tasks executed; see commits `c2abfdf`,
`1b8a755`). Left unedited below as the historical record of what was
built and why — two things have since changed and are **not** reflected
in the task text below:
- Output format: `hld.html`/`lld.html` → `hld.mdx`/`lld.mdx`, per
  [2026-08-26-nextjs-mdx-app-migration-design.md](../specs/2026-08-26-nextjs-mdx-app-migration-design.md).
- Paths: `04-case-studies/...` and `03-low-level-design/...` → `content/04-case-studies/...`
  and `content/03-low-level-design/...`, per the same spec's folder migration.

The checkboxes below were never checked off during execution (tracked via
commits instead) and are left as-is.

**Goal:** Land the checklist-first case-study workflow as a durable
project rule in CLAUDE.md, and produce Ticketmaster's `CHECKLIST.md` as
the concrete first instance — no HTML lessons are built by this plan.

**Architecture:** Two independent doc edits (CLAUDE.md rule addition,
Ticketmaster checklist) where the checklist itself is drafted as two
independent content fragments (HLD, LLD) and then assembled/verified in a
final task. This is content authoring, not code — "tests" are completeness
checks against the spec, not automated test runs.

**Tech Stack:** Markdown only. No build/test tooling involved.

**Spec:** [docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)

## Global Constraints

- Do not build `04-case-studies/ticketmaster/hld.html` or `lld.html` —
  out of scope per the spec's "Purpose" section (Ticketmaster is CS-08,
  last in `04-case-studies/SYLLABUS.md`'s priority order; building it now
  would jump the queue).
- Do not flip Ticketmaster's status in `SYLLABUS.md` or
  `04-case-studies/SYLLABUS.md` — status only flips when a lesson (HTML)
  is written, per CLAUDE.md's "After writing a lesson" rule. A checklist
  is a plan, not a finished lesson.
- Every checklist item must trace back to a specific spec section (cite
  it) — no invented scope beyond spec sections 3-5.
- Markdown only, following this repo's existing style (see `CLAUDE.md`
  and `SYLLABUS.md` for tone/format reference — plain lists, tables where
  the source docs use tables, no marketing language).

---

### Task 1: Add checklist-first workflow to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (repo root)

**Interfaces:**
- Consumes: spec sections "1. Checklist-first production workflow" and "2.
  Enhanced lesson template" (verbatim process description)
- Produces: nothing consumed by other tasks — fully independent

- [ ] **Step 1: Read the current CLAUDE.md sections to edit**

Read `CLAUDE.md` in full (already shown above — lines 1-70 as of this
plan's writing). You'll be editing three existing sections:
`## Before writing any lesson` (currently a 4-item numbered list),
`## Writing the lesson` (currently a 5-item bulleted list, first bullet at
line 36), and `## After writing a lesson` (currently a 2-item bulleted
list).

- [ ] **Step 2: Insert the checklist-first step into "Before writing any lesson"**

Insert as the new item 2 (renumber the existing items 2-4 to 3-5), right
after the existing item 1 ("Check SYLLABUS.md..."):

```markdown
2. **Write (or update) the case study's `CHECKLIST.md` first**, in
   `04-case-studies/<system>/`, before any HTML is drafted. It covers:
   problem scope (functional/non-functional requirements, explicit
   in-scope/out-of-scope lines), and a checkbox list per lesson side
   (HLD, LLD, and "others" only if a third artifact is genuinely needed)
   covering every diagram, concept, trade-off, pattern, and self-check
   item that lesson must contain. Review this against the relevant
   concept-module dependencies (e.g. LLD-03 for patterns, LLD-05 for
   database design) before writing any HTML.
```

- [ ] **Step 3: Point "Writing the lesson" at the enhanced template**

Replace the current first bullet of `## Writing the lesson` (lines 36-38,
"Follow the **Lesson template** in the design spec for every lesson:
problem framing → core content → trade-offs → worked example → interview
angle → quick check.") with:

```markdown
- Follow the **Lesson template** in the design spec, as amended by
  [docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)'s
  "Enhanced lesson template" section, for every lesson: problem framing →
  core content (with inline "check yourself" widgets after major
  concepts) → trade-offs → worked example → interview angle → Practice &
  Self-Check (recap quiz + open design challenge with rubric +
  self-score band).
```

- [ ] **Step 4: Insert the completeness-pass step into "After writing a lesson"**

Insert as the new first item, before the existing "Update SYLLABUS.md"
item:

```markdown
- **Run a completeness pass**: walk the case study's `CHECKLIST.md`
  against the finished lesson and explicitly mark each item covered or
  flag it as dropped. Report gaps out loud rather than silently omitting
  them — don't move to the next step until every checklist item is
  either covered or explicitly called out as cut.
```

- [ ] **Step 5: Verify the edit reads correctly**

Read the modified `CLAUDE.md` sections back. Confirm: numbering in
"Before writing any lesson" is sequential 1-5, the "Writing the lesson"
first bullet links to the new spec and describes inline checks + Practice
& Self-Check, the new bullet in "After writing a lesson" reads as a
natural first step before the SYLLABUS update, and no existing content
was altered or duplicated beyond what's specified above.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
Add checklist-first workflow to case study lesson rules

Every case study now gets a CHECKLIST.md written before any HTML,
and a completeness pass against it after the lesson is built.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Draft Ticketmaster HLD checklist fragment

**Files:**
- Create: `/tmp/claude-1000/-home-cloudly-Documents-Learning-Project-ai-project-system-design/8ba89d57-26b8-48c1-87ec-7ac328b84ea2/scratchpad/ticketmaster-checklist-hld-fragment.md`

**Interfaces:**
- Consumes: spec sections "3. Ticketmaster problem scope" and "4.
  Ticketmaster HLD outline" (read the full spec file first — path above)
- Produces: a markdown fragment with two top-level headings, `## Problem
  Scope` and `## HLD Checklist (\`hld.html\`)`, each containing checkbox
  items. Task 4 consumes this fragment verbatim (copies it into the final
  file), so headings and checkbox syntax must be exact.

- [ ] **Step 1: Read the spec**

Read `docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md`
in full, focusing on sections 3 and 4.

- [ ] **Step 2: Write the Problem Scope section**

Write a `## Problem Scope` heading, then transcribe spec section 3
("Ticketmaster problem scope") into: the one-line problem statement as
plain text, a `### Functional Requirements` bullet list, a `### Non-Functional Requirements`
bullet list (keep the concrete numbers — ~1M concurrent users, ~100k
seat-view req/s, ~10k write TPS, <500ms search, ~100:1 read:write), and a
`### Explicitly Out of Scope` bullet list. Do not add requirements beyond
what spec section 3 lists.

- [ ] **Step 3: Write the HLD Checklist section**

Write a `## HLD Checklist (\`hld.html\`)` heading. For each of spec
section 4's 8 numbered items (Problem framing, Requirements & capacity
estimate, Architecture diagram, Deep dives, Trade-offs, Worked example,
Interview angle, Practice & Self-Check), write one `### ` subheading
matching that item's name, followed by a `- [ ]` checkbox list breaking
that item into its concrete sub-parts as listed in the spec (e.g. under
"Deep dives," one checkbox per bullet: seat-hold mechanism, double-booking
prevention, stampede handling, search/catalog scaling, booking→payment
saga). Every bullet point in spec section 4 must become its own checkbox
— do not summarize or merge items, since these are the review-time
completeness targets.

- [ ] **Step 4: Verify against the spec**

Re-read spec section 4 line by line and confirm every bullet has a
matching checkbox in your fragment. List any you missed and add them.

- [ ] **Step 5: Save the fragment**

Write the fragment to the exact path listed under Files above (create
the scratchpad directory path if it doesn't already exist — it should,
per this session's environment). No commit — this is a scratch
intermediate, not a repo artifact.

---

### Task 3: Draft Ticketmaster LLD checklist fragment

**Files:**
- Create: `/tmp/claude-1000/-home-cloudly-Documents-Learning-Project-ai-project-system-design/8ba89d57-26b8-48c1-87ec-7ac328b84ea2/scratchpad/ticketmaster-checklist-lld-fragment.md`

**Interfaces:**
- Consumes: spec section "5. Ticketmaster LLD outline" (read the full
  spec file first — path above)
- Produces: a markdown fragment with one top-level heading, `## LLD
  Checklist (\`lld.html\`)`, containing checkbox items. Task 4 consumes
  this fragment verbatim (copies it into the final file), so headings and
  checkbox syntax must be exact.

- [ ] **Step 1: Read the spec**

Read `docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md`
in full, focusing on section 5.

- [ ] **Step 2: Write the LLD Checklist section**

Write a `## LLD Checklist (\`lld.html\`)` heading. For each of spec
section 5's 10 numbered items (Problem framing, Requirements at the
object level, Class diagram, State machines, Design patterns, Database
design, Trade-offs, Worked example, Interview angle, Practice &
Self-Check), write one `### ` subheading matching that item's name,
followed by a `- [ ]` checkbox list breaking it into concrete sub-parts as
listed in the spec. In particular:
- Under "Design patterns," one checkbox per pattern (State, Strategy,
  Factory, Observer) plus one for the SOLID/Open-Closed framing point
- Under "Database design," one checkbox each for: ER diagram/schema,
  normalization decisions, indexing strategy, SQL vs NoSQL split
  (relational + Redis), and the `version` column concurrency mechanism
- Under "State machines," one checkbox for the Seat state machine and one
  for the Booking state machine, each naming its actual states from the
  spec (e.g. `AVAILABLE → LOCKED(TTL) → BOOKED`)

Every bullet point in spec section 5 must become its own checkbox — do
not summarize or merge items.

- [ ] **Step 3: Verify against the spec**

Re-read spec section 5 line by line and confirm every bullet has a
matching checkbox in your fragment. List any you missed and add them.

- [ ] **Step 4: Save the fragment**

Write the fragment to the exact path listed under Files above. No
commit — this is a scratch intermediate, not a repo artifact.

---

### Task 4: Assemble and commit Ticketmaster CHECKLIST.md

**Files:**
- Create: `04-case-studies/ticketmaster/CHECKLIST.md`
- Read: the two fragment files from Tasks 2 and 3 (exact paths above)

**Interfaces:**
- Consumes: `ticketmaster-checklist-hld-fragment.md` (headings: `## Problem
  Scope`, `## HLD Checklist (\`hld.html\`)`) and
  `ticketmaster-checklist-lld-fragment.md` (heading: `## LLD Checklist
  (\`lld.html\`)`) from Tasks 2 and 3
- Produces: `04-case-studies/ticketmaster/CHECKLIST.md`, the final
  reviewable artifact — nothing downstream in this plan consumes it, but
  it's what a future session reads before building `hld.html`/`lld.html`

- [ ] **Step 1: Read both fragments**

Read `ticketmaster-checklist-hld-fragment.md` and
`ticketmaster-checklist-lld-fragment.md` from the scratchpad paths above
in full.

- [ ] **Step 2: Assemble the final file**

Write `04-case-studies/ticketmaster/CHECKLIST.md` with this structure:

```markdown
# Ticketmaster — Case Study Checklist

Content plan for `hld.html` and `lld.html`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md).

Status: HLD not started, LLD not started. See
[SYLLABUS.md](../../SYLLABUS.md) / [04-case-studies/SYLLABUS.md](../SYLLABUS.md)
(CS-08) for build priority — this checklist is a plan, not a built lesson.

<the Problem Scope section from the HLD fragment, verbatim>

<the HLD Checklist section from the HLD fragment, verbatim>

<the LLD Checklist section from the LLD fragment, verbatim>

## Completeness Pass Log

Not yet run — fill in when `hld.html`/`lld.html` are built, per
CLAUDE.md's "After writing a lesson" rule.
```

- [ ] **Step 3: Verify assembly**

Read the assembled file back. Confirm: both fragments' content is present
unmodified, heading levels are consistent (no skipped levels), all
checkboxes render as `- [ ]` (unchecked), and the relative links to the
spec and both SYLLABUS files resolve (check the paths exist:
`ls docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md`,
`ls SYLLABUS.md`, `ls 04-case-studies/SYLLABUS.md`).

- [ ] **Step 4: Run the completeness self-check against the spec**

Re-read spec sections 3, 4, and 5 one final time in full. For each spec
bullet, confirm a matching checkbox exists in the assembled
`CHECKLIST.md`. If anything is missing, add it directly to
`CHECKLIST.md` now (don't go back to the fragments).

- [ ] **Step 5: Commit**

```bash
git add 04-case-studies/ticketmaster/CHECKLIST.md
git commit -m "$(cat <<'EOF'
Add Ticketmaster case study checklist (CS-08)

Content plan for hld.html and lld.html per the case-study lesson
format spec. Checklist only -- HTML lessons are a separate, later
piece of work per the priority build order.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
