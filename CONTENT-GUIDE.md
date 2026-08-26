# Content Quality Guide

Rules for writing lesson prose, diagrams, quizzes, and self-check
material — read this before drafting any lesson's content (concept or
case study), alongside `CLAUDE.md`'s process rules and the lesson
template in
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md).
That spec defines the *shape* of a lesson (which sections, in what
order); this guide defines the *quality bar* within each section, so
every lesson feels consistent regardless of who or what drafted it.

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

### D2 diagrams (architecture/network, class, sequence, ER)

D2 diagrams (used via the `<D2Diagram>` MDX component — the default
engine for all new and retrofitted case-study content going forward;
Mermaid's `<DiagramPanel>` stays available and is still correct for
existing lessons not yet migrated) set color explicitly per node via
`style.fill`/`style.stroke`/`style.font-color`, rather than relying on
automatic keyword classification the way Mermaid diagrams do. Use these
values consistently so diagrams read as one system:

| Role | Fill (light) | Fill (dark) | Use for |
|---|---|---|---|
| client | `#3b6fd6` | `#6d93e8` | browsers, mobile apps, end users |
| network | `#5b4fbf` | `#9c93e0` | CDN, gateway, load balancer, waiting room |
| service | `#0e7c86` | `#34c7b8` | application services, workers |
| cache | `#b8722a` | `#e8a659` | Redis, in-memory caches |
| datastore | `#b23a48` | `#f87171` | databases, persistent stores |
| queue | `#4b5262` | `#9ba3b4` | message queues, event streams |

Always pair a colored fill with `style.font-color: "#ffffff"` — every
role color above is dark/saturated enough that white label text is the
only choice that stays legible. Reference `lib/diagram-icons.ts`'s
`DIAGRAM_ICONS` map for the matching icon per role rather than sourcing
a new one per lesson. Local icon data URIs must be quoted in D2 source
(`icon: "data:image/svg+xml;base64,..."`) — an unquoted value breaks
D2's parser on the `:`/`+`/`=` characters inside the base64 payload.

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
→ draft, applying the rules above → run the completeness pass → update
`SYLLABUS.md`.
