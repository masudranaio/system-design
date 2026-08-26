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

## Diagrams (Mermaid)

- **Match diagram type to content**: `graph`/`flowchart` for
  architecture and request flow, `classDiagram` for LLD class design,
  `stateDiagram-v2` for lifecycle/state machines, `sequenceDiagram` for
  worked-example walkthroughs and request traces, `erDiagram` for
  database schema.
- **Label edges with what flows across them** when it's not obvious —
  "seat hold (TTL)" on the arrow into Redis, not a bare unlabeled line.
- **One diagram, one concern.** Don't combine request-flow and
  data-model in a single diagram — split into two labeled panels
  instead of cramming.
- **Every diagram gets a one-sentence caption** explaining what it shows
  and why it's here — not just a title restating the diagram type.
- **State machines show every transition, including the "back" edges**
  (e.g. `LOCKED → AVAILABLE` on expiry or cancellation). A diagram that
  only shows the happy path is incomplete.
- **Redraw, never copy** a reference source's diagram (this repeats
  `CLAUDE.md`'s existing rule) — this section is about how to redraw it
  *well*, not just differently.

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
