# Lesson Evolution Format — Design

**Date:** 2026-08-27
**Status:** approved (design), implementation pending
**Supersedes:** the "Enhanced lesson template" section of
[2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)
— that doc's section order is replaced by §2 and §3 below. Everything
else in it (component contracts, self-check design, rubric shape)
still stands.
**Amends:** [CONTENT-GUIDE.md](../../../CONTENT-GUIDE.md) — the detailed
authoring rules that follow from this design are written there, not
here. This doc records *why*; `CONTENT-GUIDE.md` records *how*.

## 1. Problem

The 13 existing case-study lessons are technically correct and pass
`CONTENT-GUIDE.md`'s quality bar, but they read as **finished answers
rather than reasoning**. A lesson opens on the production architecture,
then explains its parts. That has three concrete costs for an
interview-prep reader:

1. **No visible derivation.** The reader learns *that* Ticketmaster
   uses a Redis seat hold, not *why* the obvious first design fails and
   what forced that choice. In an interview they have to derive the
   design live, from a blank whiteboard — which the lessons never model.
2. **Trade-offs are quarantined.** Trade-offs live in one section near
   the end, disconnected from the decision they justify. A reader
   skimming the architecture section sees no cost attached to any
   choice.
3. **Prose carries load that structure should carry.** Requirements,
   comparisons, API surfaces, and schema decisions appear as paragraphs
   where a table or a code block would be scannable and revisable.

Two further gaps, both raised directly by the repo owner:

4. **No build-vs-buy dimension.** Every lesson names components
   generically ("a message queue", "a cache") with no mapping to what
   you would actually run — an open-source binary, an AWS managed
   service, or a GCP one. That mapping is exactly what a working
   engineer needs and what interviewers frequently probe.
5. **LLD lessons skip the concurrency ladder.** They jump from class
   design to a thread-safe distributed design without walking the
   single-process → multi-threaded → multi-process progression, so the
   reader never learns *when* distribution is actually warranted.

## 2. Approach: a versioned evolution spine

Every lesson is restructured around numbered design versions. Each
version is a complete, working-at-its-scale design, and each is
presented as a four-part unit:

```
Stage n  →  diagram  →  what it fixes  →  what it costs  →  what still breaks
```

The final version is not announced as "the answer"; it is simply the
version where the remaining costs are ones we accept, stated
explicitly. This makes the lesson's structure *itself* the teaching
device: the reader sees a design being pressured into shape.

### 2.1 Why this over the alternatives

Two alternatives were considered and rejected:

- **Keep the current shape, add a "how we got here" section.** Cheaper,
  but the derivation stays a footnote to a pre-baked answer — it fixes
  none of problems 1–3, only documents them.
- **Full Socratic format (question → reader attempts → reveal).**
  Maximum engagement, but it makes the lessons unusable as *reference*
  material, which is half of this repo's stated purpose (interview prep
  **and** reference). The evolution spine keeps linear readability
  while still showing derivation.

### 2.2 The evolution axis differs by lesson type

The spine is the same; what grows along it is not.

| Lesson type | The axis of growth | Typical versions |
|---|---|---|
| HLD | **Scale and failure tolerance** | v1 single server → v2 replicated/cached → v3 dedicated services + purpose-built stores → v4 multi-region / partition-tolerant |
| LLD | **Change tolerance, then concurrency** | v1 one class, one thread → v2 decomposed with patterns → v3 thread-safe in one process → v4 correct across processes |

A lesson does **not** pad to four versions. Three is common; two is
legitimate for a genuinely small problem. Inventing a version to hit a
count is a defect — see `CONTENT-GUIDE.md`'s rules on this.

## 3. Lesson section order

### 3.1 HLD lessons

1. **Problem statement** — ≤5 sentences of prose, then a must-do /
   must-not-do bullet pair, then an in-scope / out-of-scope table. One
   D2 *context illustration*: actors → system → external dependencies,
   4–6 nodes, `direction: right`.
2. **Requirements & scale** — functional and non-functional bullets; a
   capacity table; the arithmetic itself in a fenced code block.
3. **v1 — the simplest thing that works** — deliberately naive.
   Diagram, plus three bullets on why it is genuinely sufficient at
   its own scale. A v1 the reader can dismiss as a straw man teaches
   nothing.
4. **Where v1 breaks** — table: *failure · what triggers it · symptom
   the user sees*.
5. **v2, v3, v4 …** — each as the four-part unit from §2.
6. **Evolution recap** — one table: *version · change · problem solved
   · new cost*. This is the lesson's revision artifact and the thing a
   reader re-reads the night before an interview.
7. **Deep dives** — one per mechanism the final version depends on.
   Each ends with its own `<StackOptions>` table.
8. **Trade-offs** — `<CompareTable>`, for the decisions where a
   reasonable engineer could have gone the other way.
9. **Build vs buy** — one consolidated `<StackOptions>` table covering
   every component named anywhere in the lesson.
10. **Worked example** — one scenario traced end to end, as a sequence
    diagram plus a numbered walkthrough.
11. **Interview angle**.
12. **Practice & Self-Check** — recap quiz, open design challenge,
    rubric, self-score band.

### 3.2 LLD lessons

1. **Problem statement** + D2 domain illustration.
2. **Requirements at the object level** — nouns table: *noun · becomes
   a class? · why / why not*.
3. **v1 — one class, one thread** — the naive implementation as a real
   code block: type switches, inline calculation, no lifecycle.
4. **Where v1 breaks** — table naming the specific principle each
   defect violates (OCP, SRP), plus the concrete maintenance cost.
5. **v2 — decompose for change** — the class split, plus the patterns
   the defects in v1 force (Strategy, State, Factory, Observer). One
   small class diagram per relationship, never one diagram carrying
   the whole model.
6. **v3 — one process, many threads** — the race as a sequence
   diagram; the critical section as a code block; a table comparing
   global lock, fine-grained lock, and lock-free/CAS.
7. **v4 — many processes** — gated behind an explicit "you only need
   this if …". Conditional update (`UPDATE … WHERE status = 'FREE'`),
   optimistic `version` column, idempotency key, and distributed lock
   *only* where genuinely required. All SQL in code blocks.
8. **API design** — endpoint table (*method · path · request · response
   · idempotent?*), then representative request/response JSON in code
   blocks.
9. **Database design, evolved** — naive single table (SQL) → a
   normalization walk naming the specific anomaly each of 1NF/2NF/3NF
   removes → the *cost* of full normalization on this system's hottest
   query → the final schema (3NF plus any deliberate denormalization)
   as an ER diagram and SQL → an index table (*index · query it serves
   · why this column order*).
10. **Class-level evolution recap** — table: *version · what changed ·
    principle or pattern applied · cost*.
11. **Trade-offs** · 12. **Build vs buy** · 13. **Worked example** ·
    14. **Interview angle** · 15. **Practice & Self-Check** — as HLD.

### 3.3 Where inline checks go

`<QuizItem>` inline checks attach to **version boundaries**, not just
to concepts: the strongest inline check in this format is "what breaks
in v2?" asked immediately before the section that answers it. At least
one inline check per version transition, plus the existing per-concept
checks in deep dives.

## 4. New components

Two, and no more. Everything else reuses `CompareTable`, `KeyStat`,
`Point`, `QuizItem`, `Rubric`, `SelfScoreBand`, `D2Diagram`,
`DiagramPanel`.

### 4.1 `<Stage>`

```tsx
<Stage
  n={2}
  title="Availability service with per-facility counters"
  verdict="Fixes counter drift under concurrent gate scans; adds an event pipeline to operate and monitor."
/>
```

| Prop | Type | Meaning |
|---|---|---|
| `n` | `number` | Version number. Rendered as a chip. |
| `title` | `string` | What this version *is*, named by its defining change. |
| `verdict` | `string` | One line: what it buys, semicolon, what it costs. Both halves are required — a verdict with no cost is a defect. |
| `final` | `boolean?` | Marks the accepted design; renders a distinct chip treatment. |

Rationale: without it, four consecutive `###` headings make the
progression invisible when skimming, which defeats the entire point of
the format. The `verdict` prop's required two-part shape is what
mechanically enforces "every version states its cost."

Rendering: a numbered chip using the track accent color, the title as
an `h3`-equivalent, and the verdict as a single de-emphasized line
below. It sets `id` from a slug of the title so the table of contents
and deep links keep working.

### 4.2 `<StackOptions>`

```tsx
<StackOptions
  title="Availability counters"
  rows={[
    {
      component: "In-memory counter store",
      oss: "Redis (`INCR`/`DECR`)",
      aws: "ElastiCache for Redis",
      gcp: "Memorystore for Redis",
      when: "Managed is worth it once you need HA failover you don't want to operate.",
    },
  ]}
/>
```

| Prop | Type | Meaning |
|---|---|---|
| `title` | `string` | Which part of the design this table covers. |
| `rows[].component` | `string` | The generic role, not a product name. |
| `rows[].oss` | `string` | What you would self-host. |
| `rows[].aws` | `string` | Nearest AWS managed equivalent. |
| `rows[].gcp` | `string` | Nearest GCP managed equivalent. |
| `rows[].when` | `string` | One line on when the managed option earns its cost. Required — a mapping with no judgment attached is trivia. |

Rationale: roughly 20 of these tables will exist across the course.
Hand-written markdown tables drift in column order, header wording, and
whether the "when" column is present at all. A component makes the
shape non-negotiable.

Placement is **both** per-section and consolidated, per §3: each deep
dive ends with a `<StackOptions>` scoped to that mechanism, and the
lesson carries one consolidated `<StackOptions>` covering everything.
The repetition is deliberate — the per-section table serves the reader
learning the mechanism, the consolidated one serves the reader
revising.

## 5. Diagram interaction changes

### 5.1 Wheel no longer zooms

`usePanZoom` currently calls `e.preventDefault()` on wheel and maps
`deltaY` to scale. The effect is that scrolling the article with the
cursor anywhere over a diagram silently zooms the diagram instead of
scrolling the page — and since lessons are diagram-dense, the cursor is
over a diagram most of the time.

Change: remove `onWheel` from `usePanZoom`'s returned `bind` and delete
its handler. With no handler, the event bubbles and the page scrolls
normally. Zoom becomes button-only (`+`, `−`, reset, fit-to-width,
expand). Pointer drag-to-pan is unchanged and still works for a
zoomed-in diagram.

### 5.2 Fit to the panel by default

Today every diagram mounts at `scale: 1`, so a diagram authored wider
than the panel opens cropped, and the reader must find the fit button.

Change: `DiagramChrome` fits on mount and re-fits when the panel
resizes, via a `ResizeObserver` on the scroll container. Auto-fit stops
permanently once the reader touches any zoom control — a `userAdjusted`
ref, set by the toolbar handlers, gates the observer. Without that
gate, resizing the window (or a sidebar animating) would throw away a
reader's deliberate zoom.

### 5.3 A readability floor of 0.65

Commit `0079b77` fixed D2 text becoming unreadable when a wide diagram
was scaled down to panel width. Auto-fitting reintroduces exactly that
pressure, so auto-fit is clamped:

```
autoFitScale = clamp(panelWidth / intrinsicWidth, 0.65, 1)
```

- Never scales **up** past 1 — a small diagram blown up blurs and gains
  nothing (this clamp already exists in `fitToWidth`).
- Never scales **down** past 0.65 — below that, D2's label text stops
  being readable at normal viewing distance. A diagram that still does
  not fit at 0.65 keeps horizontal scroll and the expand button, which
  is the correct outcome: the diagram is too wide and should be
  redrawn or split.

The floor applies to **auto**-fit only. The explicit fit-to-width
button remains unclamped at the bottom, because pressing it is an
informed request to see the whole thing however small.

### 5.4 Horizontal-first authoring

D2's `direction: right` is already used in 13 files but inconsistently.
It becomes a rule: horizontal for architecture, class, and ER diagrams;
vertical only for sequence diagrams and lifecycle/state machines, where
top-to-bottom carries the meaning. Paired with a practical width budget
(~1400px authored, which fits the article column above the 0.65 floor)
this keeps diagrams legible without zooming. Detailed rules and the
node-count guidance live in `CONTENT-GUIDE.md`.

## 6. Testing

| Change | How it's verified |
|---|---|
| `<Stage>` | Unit test: renders `n`, `title`, `verdict`; `final` variant; slug `id` derived from title. |
| `<StackOptions>` | Unit test: renders all five columns per row; table has an accessible caption/heading. |
| Wheel-zoom removal | Unit test asserting `bind` has no `onWheel`; live Playwright check that scrolling with the cursor over a diagram scrolls the article. |
| Auto-fit + floor | Unit tests on the clamp arithmetic (fits, too-wide, too-small, exactly-at-floor); live check that a wide diagram opens fully visible. |
| `userAdjusted` gate | Unit test: after `zoomIn`, a simulated resize does not change scale. |
| Every rewritten lesson | Playwright in **both** themes per `CLAUDE.md`'s UI-verification rule, plus the `CHECKLIST.md` completeness pass. |

## 7. Rollout

Infrastructure first, then content, one lesson at a time.

1. **Infrastructure** — §4 components and §5 diagram changes, with
   tests. Nothing content-facing depends on prose, so this lands as one
   unit.
2. **`CONTENT-GUIDE.md` expansion** — the detailed authoring rules
   (§2–§4 turned into enforceable instructions).
3. **Parking Lot HLD** — first content rewrite. Chosen because the
   problem is small enough that the evolution spine is unambiguous,
   making it the cheapest place to discover format problems.
4. **Parking Lot LLD**.
5. **Stop.** Owner review of both Parking Lot sides before any other
   system is touched.

Remaining systems, in `content/04-case-studies/SYLLABUS.md` priority
order, are rewritten one at a time after that review — never in
parallel, never bulk-generated.

## 8. Scope boundaries

**In scope:** the 13 existing case-study lesson files; the two new
components; the diagram interaction changes; the `CONTENT-GUIDE.md`
expansion.

**Out of scope:**

- The HLD/LLD **concept** modules (0/12 each, unbuilt). This format
  applies to them when they are built, but building them is not part of
  this work.
- New case studies. No system is added to the syllabus by this work.
- Raster illustrations. Every illustration is D2. A PNG cannot be
  theme-aware, cannot be diffed, and would be the only
  non-versionable asset in the content tree. If a concept genuinely
  cannot be drawn in D2, the lesson says so in prose rather than
  reaching for an image.
- Migrating remaining Mermaid `<DiagramPanel>` diagrams to D2. Lessons
  being rewritten will use D2 for new diagrams (already the default per
  `CONTENT-GUIDE.md`), but a wholesale Mermaid retirement is separate
  work.
