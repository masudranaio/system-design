# Content Quality Guide

Rules for writing lesson prose, diagrams, quizzes, and self-check
material — read this before drafting any lesson's content (concept or
case study), alongside `CLAUDE.md`'s process rules and the lesson
template in
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md).
That spec's section order is superseded by
[docs/superpowers/specs/2026-08-27-lesson-evolution-format-design.md](docs/superpowers/specs/2026-08-27-lesson-evolution-format-design.md)
— the **evolution spine**, which is the current shape of every lesson.
Those two specs define the *shape* of a lesson (which sections, in what
order); this guide defines the *quality bar* within each section and
the *rules for filling it in*, so every lesson feels consistent
regardless of who or what drafted it.

Read this whole file before drafting. The sections most likely to be
skipped and most costly to get wrong are
[The evolution spine](#the-evolution-spine-writing-a-versioned-lesson),
[Text, tables, and code blocks](#text-tables-and-code-blocks), and
[Open-source and cloud mapping](#open-source-and-cloud-mapping).

## Writing the prose

- **Explain why before what.** Motivate a concept with the problem it
  solves before describing its mechanics. "Seat holds expire because a
  buyer who abandons checkout shouldn't lock a seat forever" comes
  before the TTL mechanism, not after.
- **Use concrete numbers.** "~100k seat-view requests/sec during a
  drop," not "a lot of traffic." If a real source gives a number, use
  it; if estimating, show the back-of-envelope math, don't just assert
  a figure.
- **Define every term on first use, in context** — no unexplained
  jargon, and no glossary dump either. Work the definition into the
  sentence that needs it.
- **Every trade-off names its alternative explicitly.** Don't just
  praise the chosen approach — "optimistic locking, chosen over
  pessimistic locking because..." not "we use optimistic locking, which
  is great because..."
- **One strong worked example beats three shallow ones.** Pick a single
  concrete scenario and trace it fully (specific actors, specific
  numbers, specific sequence) rather than gesturing at several.
- **Avoid AI-writing tells**: no throat-clearing ("it's important to
  note that..."), no restating the question before answering it, no
  rule-of-three padding, no hedging where a direct claim is warranted.
  Say the thing.

## Diagrams (Mermaid and D2)

- **Match diagram type to content**: `graph`/`flowchart` (Mermaid) or a
  plain shapes-and-connections D2 diagram for architecture and request
  flow, `classDiagram`/`shape: class` for LLD class design,
  `stateDiagram-v2` (same shapes-and-connections technique in D2 — no
  dedicated D2 state shape exists) for lifecycle/state machines,
  `sequenceDiagram`/`shape: sequence_diagram` for worked-example
  walkthroughs and request traces, `erDiagram`/`shape: sql_table` (per
  entity, with `constraint: primary_key`/`foreign_key`) for database
  schema.
- **Label edges with what flows across them** when it's not obvious —
  "seat hold (TTL)" on the arrow into Redis, not a bare unlabeled line.
- **One diagram, one concern, kept small.** Don't combine request-flow
  and data-model in a single diagram — split into two labeled panels
  instead of cramming. Prefer several small, focused diagrams (2-5
  nodes each) over one diagram carrying a whole section's explanatory
  weight — see "Content-format standard" below.
- **Every diagram gets a one-sentence caption** explaining what it shows
  and why it's here — not just a title restating the diagram type.
- **State machines show every transition, including the "back" edges**
  (e.g. `LOCKED → AVAILABLE` on expiry or cancellation). A diagram that
  only shows the happy path is incomplete.
- **Redraw, never copy** a reference source's diagram (this repeats
  `CLAUDE.md`'s existing rule) — this section is about how to redraw it
  *well*, not just differently.

### Diagram layout, size, and reading direction

A diagram the reader has to zoom or pan to understand has failed, no
matter how correct it is. These rules exist to make every diagram
readable at its default, fitted size.

- **Horizontal by default.** Every architecture, class, and ER diagram
  starts with `direction: right`. Request flow reads left-to-right, the
  same direction as the prose around it.
- **Vertical only where down means something.** `direction: down` is
  correct for exactly two cases: sequence diagrams (time flows down)
  and lifecycle/state machines (a state progression the reader thinks of
  as a ladder). Everything else is horizontal. If you reach for
  vertical to make a wide diagram fit, that is the wrong fix — split
  the diagram instead.
- **Width budget: ~1400px authored.** The panel auto-fits a diagram
  down to a floor of `0.65` scale and no further (see the format spec's
  §5.3), so a diagram much wider than ~1400px opens either clipped or
  at the floor with horizontal scroll. Both are worse than two smaller
  diagrams.
- **2–5 nodes is the target, 8 is the ceiling.** Past 8 nodes a diagram
  is carrying more than one concern; find the seam and split it. The
  one exception is a lesson's single "final architecture" diagram,
  where showing the whole system at once is the point.
- **Check the fitted size, not the source.** Before shipping a diagram,
  look at it in the browser at the default zoom. If you cannot read
  every label without touching a control, it is too wide or too dense.
- **No raster images, ever.** Every illustration is D2 (or Mermaid in
  not-yet-migrated lessons). A PNG cannot be theme-aware, cannot be
  diffed, and would be the only non-versionable asset in the content
  tree. If something genuinely cannot be drawn, explain it in prose and
  say why there is no diagram — don't reach for a screenshot.

### The problem-statement illustration

Every lesson's problem statement carries exactly one diagram, and it is
a **context** diagram, not an architecture diagram:

- 4–6 nodes: the actors on the left, the system as a single box in the
  middle, the external dependencies it must talk to on the right.
- No internal components. The reader has not earned them yet — v1 is
  where the inside of the box first appears.
- Edges labelled with the interaction, not the protocol: "parks a
  vehicle", not "HTTP POST".
- Its caption states the boundary in one sentence: what this lesson is
  responsible for and what it hands off.

### D2 diagrams (architecture/network, class, sequence, ER)

D2 diagrams (used via the `<D2Diagram>` MDX component — the default
engine for all new and retrofitted case-study content going forward;
Mermaid's `<DiagramPanel>` stays available and is still correct for
existing lessons not yet migrated) set color explicitly per node via
`style.fill`/`style.stroke`/`style.font-color`, rather than relying on
automatic keyword classification the way Mermaid diagrams do. Use these
values consistently so diagrams read as one system:

| Role | Authored `style.fill` (semantic key) | Authored `style.stroke` (semantic key) | Use for |
|---|---|---|---|
| client | `#3b6fd6` | `#2a52a8` | browsers, mobile apps, end users |
| network | `#5b4fbf` | `#453a94` | CDN, gateway, load balancer, waiting room |
| service | `#0e7c86` | `#0a5d64` | application services, workers |
| cache | `#b8722a` | `#8f5a20` | Redis, in-memory caches |
| datastore | `#b23a48` | `#8a2c37` | databases, persistent stores |
| queue | `#4b5262` | `#363b47` | message queues, event streams |

These hexes are **semantic keys, not the appearance that ships.** Write
them in D2 source exactly as shown above — `lib/diagram-palette.ts` maps
each authored fill to a brighter display fill, a deep stroke, and a bold
near-black label at render time (rewriting the rendered SVG's `fill`
attributes directly), and the diagram canvas is always a fixed light
"paper" background in both themes. See the design spec's
[§5.3 "Authored hex becomes a semantic key"](docs/superpowers/specs/2026-08-27-visual-design-system-refresh-design.md)
for the full mapping and rationale. A node using a fill hex the
transform doesn't recognize is left exactly as authored, so don't
invent new hexes for these six roles — reuse the values above.

Always pair a colored fill with `style.font-color: "#ffffff"` — this is
now load-bearing, not just a legibility choice: the retint transform
scans rendered `<text>` elements for `fill="#ffffff"` to find node
labels and rewrite them to the display label color, so a node authored
with any other font color won't get retinted correctly. Reference
`lib/diagram-icons.ts`'s `DIAGRAM_ICONS` map for the matching icon per
role rather than sourcing a new one per lesson. Local icon data URIs
must be quoted in D2 source (`icon: "data:image/svg+xml;base64,..."`)
— an unquoted value breaks D2's parser on the `:`/`+`/`=` characters
inside the base64 payload.

**Standard chrome for every colored D2 node** (architecture and class
alike) — this is what gives the diagrams a bold, ByteByteGo-style flat
look instead of D2's plain default boxes:

```
style.shadow: true
style.stroke-width: 2
```

Do **not** add `style.border-radius` to a `shape: class` node that has
any edges connected to it — confirmed live: D2 emits a malformed SVG
path for the connecting edge in that case (a stray `Z` closepath
directly followed by coordinates, with no command letter — invalid SVG,
logged as a console error in every browser). Verified via a minimal
repro: `border-radius` alone on two connected class shapes reproduces
it, `shadow` alone does not. Plain (non-class) shapes weren't affected
in testing, but treat `border-radius` on any shape with connected edges
as suspect and check the rendered page's console before shipping.

**Class diagrams get the same 6-color palette, applied by domain role**
(not literally the "client/network/service" infra meaning — reuse the
hex values, remap the meaning to the class's role in the design):

| Role color | Use for |
|---|---|
| service (teal) | The aggregate root / the class that coordinates or owns everything else in *this* diagram (only one per diagram) |
| cache (amber) | Entities and value objects owned by the aggregate root |
| client (blue) | External actors — people or agents that call into the system (`Customer`, `DeliveryAgent`) |
| network (violet) | A credential, token, or connector object — something that references/links two other objects rather than being owned by either |
| queue (gray) | A stub/reference node repeated from another diagram (e.g. `Package` shown again in an integration-context diagram) — signals "see the other diagram for this one's real fields," visually distinct from a fully-detailed entity |
| datastore (red) | Rarely needed in class diagrams; reserve for a class that represents a persistence boundary if one appears |

Keep a class's color consistent across every diagram it appears in
(the aggregate root that's teal in one diagram should still read as
"the coordinator" — teal — wherever it recurs, even as a stub).
Every class node gets the standard chrome above plus its role's fill/
stroke/font-color; don't leave any class shape on D2's unstyled
default (flat navy header, no shadow) — that flat look is exactly what
reads as low-effort next to a colored, shadowed one.

## Content-format standard (all new and retrofitted lessons)

Applies on top of every rule above, tightening the bar for the
case-study expansion and retrofit pass (2026-08-27) and everything
after it:

- **More diagrams per lesson, and more granular ones.** Where a section
  explains 3-4 related ideas, pair each idea with its own small diagram
  (2-5 nodes) rather than one large diagram carrying the whole
  section's explanatory weight. A lesson with 4-5 diagrams total is the
  floor, not the target.
- **More granular topic coverage, not just reformatted prose.** A
  deep-dive that could cover one mechanism should cover the 2-3
  mechanisms a real interview conversation would actually branch into
  (e.g., a caching deep-dive should also touch invalidation strategy
  and cache stampede, not just cache-aside as one paragraph).
- **Default to bullets and tables; paragraphs are the exception.** A
  paragraph is the deliberate choice for narrative motivation and
  worked-example sequences specifically — everything else
  (requirements, comparisons, mechanism lists, API surfaces) defaults to
  a bullet list, a `CompareTable`, or a small diagram, in that order of
  preference, before falling back to prose.
- **"To the point" text.** Every sentence that survives should carry a
  fact, a number, or a decision — no throat-clearing, no restating the
  heading in prose form before the bullets that already say it.

## The evolution spine: writing a versioned lesson

Every lesson builds its design in numbered versions. The reader should
finish able to *derive* the design, not just recall it. Section order
lives in
[the format spec](docs/superpowers/specs/2026-08-27-lesson-evolution-format-design.md);
these are the rules for writing each version well.

### The four-part unit

Every version — without exception — is written as four parts in this
order. Skipping any part is a defect, not a stylistic choice.

| Part | What it must contain | Common failure |
|---|---|---|
| **1. The version itself** | A `<Stage>` marker, then a diagram, then bullets on how it works. | Explaining the version without drawing it. |
| **2. What it fixes** | Named against the *previous* version's specific failure. "Fixes the counter drift from v2", not "improves availability". | Vague improvement claims. |
| **3. What it costs** | A new operational burden, a new failure mode, or a new consistency compromise. Every version costs something. | Claiming a free win. |
| **4. What still breaks** | A table: *failure · what triggers it · symptom the user sees*. This table is the bridge into the next version. | Ending on the fix, leaving the reader no reason to keep reading. |

### v1 must be genuinely defensible

The most common way this format fails is a straw-man v1 — a design so
obviously broken that the reader learns nothing from its demolition.

- **v1 is the design a competent engineer would actually ship first**,
  at the scale where it is correct. One server and one database serving
  one parking facility is not naive; it is right, until it isn't.
- **State the scale at which v1 is correct**, with a number. "Fine to
  roughly 200 vehicles/day across two gates" tells the reader what
  changed when it stopped being fine.
- **Never editorialise about v1 being bad.** Let the "what still
  breaks" table do that work. Prose like "of course, this naive
  approach quickly falls apart" is throat-clearing and pre-empts the
  reader's own reasoning.

### Version count is discovered, not targeted

- **Three versions is typical. Two is legitimate. Four is the ceiling**
  for a case study. A fifth means the lesson is two lessons.
- **Never invent a version to reach a count.** If v3 fixes everything
  the problem's requirements actually demand, v3 is the final version —
  mark it `final` and move to the deep dives.
- **Never merge two real forcing functions into one version** to save
  space either. If a version's "what it fixes" bullet list names two
  unrelated problems, it is two versions.
- **Distribution is a version only when the requirements force it.**
  An LLD v4 exists only if the problem genuinely spans processes. Open
  it with the explicit gate: "you only need this if …" followed by the
  requirement that triggers it. Reaching for distributed coordination
  that the problem does not need is the single most-penalised mistake in
  a real LLD interview, and a lesson that models it teaches the wrong
  instinct.

### The evolution recap table

Every lesson ends its design portion with one recap table — *version ·
change · problem solved · new cost* — before the deep dives begin.
This is the artifact a reader revisits the night before an interview,
so it must stand alone: each cell readable without having read the
section it summarises. One line per cell, no cross-references.

### Inline checks attach to version boundaries

Place a `<QuizItem>` immediately **before** each "what still breaks"
table, asking the reader to predict the failure. That is the highest-
value check in this format: the answer is on the next screen, so a
wrong guess is corrected instantly. Keep the per-concept checks in the
deep dives as well.

## Text, tables, and code blocks

The default is **not prose**. Every section is built from the smallest
structure that carries its content, chosen in this order.

| Content | Use | Never |
|---|---|---|
| Narrative motivation, the "why this matters" before a mechanism | A short paragraph (2–5 sentences) | A bullet list that fragments an argument |
| Requirements, mechanism lists, "how it works" steps | Bullets | A paragraph listing four things in sequence |
| Any comparison of 2+ options | A table, or `<CompareTable>` for design trade-offs | Prose weighing options across several sentences |
| Failure analysis | A table: *failure · trigger · symptom* | Prose |
| API surfaces | An endpoint table, then JSON in code blocks | Prose describing a request shape |
| Code, pseudocode, SQL, JSON, config, shell | A fenced code block with a language tag | Inline backticks for anything multi-token, or prose describing code |
| Arithmetic, capacity estimates | A fenced code block showing the working | An asserted number, or arithmetic inside a sentence |
| A relationship between things | A diagram | Prose describing what points at what |

### Rules that follow from that table

- **A paragraph must earn its place.** Prose is the deliberate choice
  for exactly two jobs: motivating a concept before its mechanics, and
  walking a worked example's sequence. Everywhere else, a paragraph is
  a sign the structure wasn't chosen.
- **No paragraph longer than five sentences.** If it needs to be
  longer, it contains a list or a table that hasn't been extracted yet.
- **Never introduce bullets with a sentence that restates the
  heading.** "There are several requirements to consider:" under a
  "Requirements" heading is pure filler — go straight to the bullets.
- **Every code block gets a language tag** (` ```python `, ` ```sql `,
  ` ```json `, ` ```text ` for arithmetic and back-of-envelope math).
  Untagged blocks lose syntax highlighting silently.
- **Code blocks are complete enough to reason about, short enough to
  read** — 5–25 lines. Show the method that matters with its real
  signature; elide the rest with a comment, not with `...`.
- **Comment the line that carries the lesson.** In a critical section,
  the comment on the lock acquisition is the teaching; the rest of the
  code is context.
- **Show arithmetic, never assert it.** Every capacity number is a code
  block a reader can check:

  ```text
  peak arrivals   = 40 vehicles/min across 4 gates
  ticket writes   = 40/min  ≈ 0.7 writes/sec   → trivially one DB
  availability qs = every gate scan + every app open
                  = 40/min + 5k app opens/min ≈ 84 reads/sec
  ```

- **Tables carry one fact per cell.** A cell containing a sentence with
  a "but" in it belongs in two columns.
- **Bold the decision, not the topic.** `**Optimistic locking**, chosen
  over pessimistic because …` — bolding leads the eye to the choice.

## Open-source and cloud mapping

Every lesson answers "what would I actually run?" in two places, using
`<StackOptions>`:

1. **Per deep dive.** Each deep-dive section ends with a
   `<StackOptions>` scoped to the mechanism it just explained.
2. **Once, consolidated.** A "Build vs buy" section before the worked
   example, covering every component named anywhere in the lesson.

The repetition is deliberate: the per-section table serves the reader
learning the mechanism, the consolidated one serves the reader
revising.

### Rules for filling it in

- **`component` is a role, never a product.** "Durable event log", not
  "Kafka". The product names belong in the three option columns.
- **Name the specific managed service, not the vendor.** "ElastiCache
  for Redis" and "Memorystore for Redis" — not "AWS caching" or "a GCP
  cache".
- **Only name a service you are confident exists and fits.** A wrong
  service name is worse than an empty cell; write "no direct
  equivalent — self-host on GKE" when that is the truth.
- **The `when` column carries a judgment, not a description.** It
  answers "when does the managed option earn its extra cost?" — HA
  failover you don't want to operate, a compliance requirement, a team
  too small to carry the ops load. A `when` cell that merely restates
  what the service does is dead weight.
- **Cover AWS and GCP.** Azure only when it has a genuinely distinctive
  offering for that component; otherwise the column noise isn't worth
  it.
- **Say when self-hosting is the right answer.** Managed is not
  automatically better, and a lesson that always recommends the cloud
  option is not teaching a trade-off.

## LLD: API design section

- **Endpoint table first, bodies second.** Columns: *method · path ·
  request · response · idempotent?*. The table is the surface; the JSON
  is the detail.
- **Idempotency is a column, not an afterthought.** Every mutating
  endpoint states whether it is idempotent and, if it is, what key
  makes it so.
- **Paths name resources, not actions.** `POST /v1/lots/{id}/tickets`,
  not `POST /issueTicket`. If an operation genuinely isn't a resource
  transition, say so and justify the RPC-style path.
- **Show one full request and response pair** in JSON code blocks — the
  most interesting one, with real values, not `"string"` placeholders.
- **Include one error response** with its status code and body shape.
  The lesson's concurrency story is only credible if the reader sees
  what a lost race returns (`409 Conflict` and what the client does
  next).
- **Version the path** (`/v1/`) so the reader sees the habit.

## LLD: database design section

The schema is derived, not presented. Four movements, in order:

1. **The naive schema** — one table, in a `sql` code block, with the
   redundancy visible.
2. **The normalization walk** — 1NF, 2NF, 3NF, each naming *the
   specific anomaly it removes in this system*: "storing the vehicle
   type's fee rate on every ticket row means a rate change requires
   rewriting history — that's the 2NF violation." Abstract definitions
   of the normal forms are not enough; the reader can get those
   anywhere.
3. **The cost of full normalization** — name this system's hottest
   query and what 3NF does to it. This is the movement most lessons
   skip, and it is the one that makes the final schema a decision
   rather than a ritual.
4. **The final schema** — 3NF plus any deliberate denormalization,
   each denormalized column justified by the query in movement 3.
   Presented as an ER diagram **and** the `CREATE TABLE` SQL.

Then:

- **An index table**: *index · the query it serves · why this column
  order*. An index with no named query is speculative and should be
  cut.
- **Name every constraint that enforces a rule from the requirements** —
  a unique constraint is often the real guard against a race the
  application layer only appears to prevent.
- **State the isolation level** the concurrency story assumes. A
  conditional update's correctness depends on it.

## Pre-ship checklist

Run this against the finished lesson, before the `CHECKLIST.md`
completeness pass:

- [ ] Problem statement is ≤5 sentences of prose, plus bullets, plus an
      in-scope/out-of-scope table, plus one context diagram.
- [ ] Every version has all four parts: stage marker, diagram, what it
      fixes, what it costs, what still breaks.
- [ ] v1 states the scale at which it is genuinely correct, with a
      number.
- [ ] No version claims a cost-free improvement.
- [ ] Evolution recap table present and readable standalone.
- [ ] Every deep dive ends with a `<StackOptions>` table.
- [ ] One consolidated "Build vs buy" `<StackOptions>` present.
- [ ] No paragraph exceeds five sentences.
- [ ] All code, SQL, JSON, and arithmetic is in tagged code blocks.
- [ ] Every diagram is horizontal unless it is a sequence or lifecycle
      diagram.
- [ ] Every diagram read in the browser at default zoom, both themes,
      every label legible without touching a control.
- [ ] At least one inline `<QuizItem>` per version transition.
- [ ] Recap quiz is 5–8 questions, each answer carries a "why".

## Quiz questions (inline checks + recap quiz)

- **Mix the format**: some short factual recall, some "why this over
  the alternative," and at least one per lesson that applies the
  concept to a scenario not explicitly covered in the text — tests
  understanding, not memorization.
- **Every answer includes a one-line "why,"** never just the fact.
  "Because a Redis TTL lock expires automatically if the buyer abandons
  checkout" — not just "Redis."
- **No trick questions or ambiguous wording.** A well-prepared reader
  should answer confidently from the lesson's own content, never guess
  the intended interpretation.
- **Only quiz on what the lesson actually explains** — don't test
  knowledge the text never covered.
- **Roughly 5-8 recap questions**, plus a handful of inline
  "check yourself" widgets after major concepts, per the enhanced
  lesson template.

## Interaction / self-check answers (the open design challenge + rubric)

- **The challenge is a genuine extension**, not a restatement — it
  should require applying the lesson's concepts under a new constraint
  (e.g. "extend the design to support group bookings of adjacent
  seats"), not re-describe what was already built.
- **Reference answers are concrete**: name the specific class, pattern,
  or mechanism ("add a `GroupHold` aggregate that atomically locks N
  adjacent seats") — never vague guidance like "consider using
  appropriate patterns."
- **Rubric items are independently checkable.** Each one should be
  answerable yes/no by re-reading what the learner wrote — "did you
  name the failure mode when one seat in the group is already held?" —
  not a subjective judgment call.
- **Self-score bands mean what they say.** "Interview-ready" should
  require genuinely complete coverage of the rubric, not "attempted most
  of it" — a band that's too generous defeats the point of self-checking.

## How this fits the existing process

This guide governs quality within each section; it doesn't change
*when* things happen. Still follow `CLAUDE.md`'s order: check
`SYLLABUS.md` → write/update the case study's `CHECKLIST.md` → research
→ draft, applying the rules above → run the
[pre-ship checklist](#pre-ship-checklist) → run the completeness pass
→ update `SYLLABUS.md`.
