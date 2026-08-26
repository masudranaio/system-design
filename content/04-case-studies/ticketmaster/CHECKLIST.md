# Ticketmaster — Case Study Checklist

Content plan for `hld.mdx` and `lld.mdx`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md)
(`hld.html`/`lld.html` → `hld.mdx`/`lld.mdx`; content plan unchanged).

Status: HLD built (`hld.mdx`), LLD built (`lld.mdx`) — both drafted and
verified. See
[SYLLABUS.md](../../../SYLLABUS.md) / [04-case-studies/SYLLABUS.md](../SYLLABUS.md)
(CS-08) for build priority — this checklist is a plan, not a built lesson.

## Problem Scope

Let users search for events, view a seat map, and buy tickets — without
ever selling the same seat twice, even when ~100,000 people hit "buy" on
the same show in the same second.

### Functional Requirements

- [x] Search/browse events and venues
- [x] View live seat availability for a show
- [x] Reserve a seat temporarily while paying (a time-boxed hold)
- [x] Complete payment and confirm the booking
- [x] Cancel/expire a hold or booking and release the seat

### Non-Functional Requirements

- [x] Strong consistency on seat state during checkout — no double-booking
      or overselling, even under contention
- [x] Scale: ~1M concurrent users during a popular on-sale, ~100k
      seat-view requests/sec, ~10k write transactions/sec during a ticket
      drop
- [x] Low search/browse latency (<500ms), high read:write ratio (~100:1)
      outside of drop windows
- [x] Availability for browsing even if the write path is under extreme
      load

### Explicitly Out of Scope

- [x] Full payment-gateway integration details
- [x] Seating-chart rendering/UI
- [x] Recommendations/marketing
- [x] Refund/dispute policy details

## HLD Checklist (`hld.mdx`)

### 1. Problem framing

- [x] The on-sale stampede framed as the defining challenge
- [x] Explain why this is a consistency-over-availability problem during
      checkout

### 2. Requirements & capacity estimate

- [x] Reference the functional/non-functional requirements above
- [x] Back-of-envelope math for the scale numbers (~1M concurrent users,
      ~100k seat-view req/s, ~10k write TPS)

### 3. Core content — architecture diagram

- [x] Mermaid diagram of the request flow: client → API gateway →
      search/catalog service → seat inventory service →
      booking/reservation service → payment service → notification
      service
- [x] Redis for seat holds
- [x] Message queue for confirmation/notification
- [x] Per-service datastores

### 4. Core content — deep dives

- [x] Seat-hold mechanism: Redis TTL lock + virtual queue in front of
      seat selection (what Ticketmaster's real system uses)
- [x] Double-booking prevention: distributed lock + DB-level optimistic
      version check as defense-in-depth (belt and suspenders)
- [x] Stampede handling: virtual waiting room, why it's better than
      letting 100k requests hit inventory directly
- [x] Search/catalog scaling: caching, read replicas, CDN for event pages
- [x] Booking→payment flow as a saga: hold → charge → confirm, with
      timeout-triggered rollback if payment doesn't complete in time

### 5. Trade-offs

- [x] Optimistic lock vs pessimistic lock vs distributed lock
      (Redis/Zookeeper) vs virtual queue: when each is the right call

### 6. Worked example

- [x] Sequence diagram tracing two users contending for the same seat:
      one succeeds, one is rejected cleanly

### 7. Interview angle

- [x] Follow-up: partial/group booking of adjacent seats
- [x] Follow-up: refund/cancellation flow
- [x] Follow-up: what happens if payment fails after the hold expires

### 8. Practice & Self-Check

- [x] Recap quiz on locking strategies and the consistency/availability
      trade-off
- [x] Open challenge: "design the seat-hold expiry and cleanup
      mechanism" with rubric

## LLD Checklist (`lld.mdx`)

### 1. Problem framing

- [x] Frame the problem from the object/schema level: model the booking
      domain so seat-state transitions are safe by construction, not by
      convention

### 2. Requirements at the object level

- [x] Identify the entities and lifecycle states needed to support the
      functional requirements above

### 3. Class diagram

- [x] Class diagram (Mermaid `classDiagram`) covering Event, Venue,
      SeatMap, Seat, Show, Booking, BookingItem, Payment, User,
      PricingTier, and their relationships

### 4. State machines

- [x] Seat state machine: `AVAILABLE → LOCKED(TTL) → BOOKED`, with paths
      back to `AVAILABLE` on expiry or cancellation
- [x] Booking state machine: `PENDING → CONFIRMED → CANCELLED / EXPIRED`

### 5. Design patterns

- [x] State — for Seat and Booking lifecycles, instead of scattered status
      if/else checks
- [x] Strategy — for pricing (VIP / general / dynamic), swappable without
      touching booking logic
- [x] Factory — for creating different ticket/seat types
- [x] Observer — for notifying waiting users when a held seat is released
      back to available
- [x] SOLID framing threaded through (e.g. Strategy over an if/else
      pricing block as an Open/Closed win)

### 6. Database design

- [x] ER diagram / schema for the entities above
- [x] Normalization decisions: seat inventory as its own row per
      seat-per-show rather than denormalized into Event; where
      denormalizing would help read-heavy seat-map queries
- [x] Indexing strategy for "show seat availability for show X"
- [x] SQL vs NoSQL at the object level: relational for bookings/payments
      (needs transactions), Redis alongside it for the seat-hold TTL —
      deliberately not a schema table
- [x] Concurrency at the schema level: the `version` column backing the
      optimistic-lock check

### 7. Trade-offs

- [x] State pattern vs enum+if-else
- [x] Normalized vs denormalized seat-status table for fast reads

### 8. Worked example

- [x] Sequence diagram of the reserve-seat flow through the classes,
      including the version-check retry path

### 9. Interview angle

- [x] Follow-up: "walk me through your classes"
- [x] Follow-up: "how does this prevent double-booking at the code level"
- [x] Follow-up: extensibility probes (add a new pricing strategy without
      touching `Booking`)

### 10. Practice & Self-Check

- [x] Recap quiz on pattern identification and schema decisions
- [x] Open challenge: "extend the design to support group bookings of
      adjacent seats" with rubric

## Completeness Pass Log

### `hld.mdx` (2026-08-26)

Walked every HLD checklist item above against the finished lesson; all are
covered and ticked `[x]`. Notes:

- **Problem framing**: stampede framed as the defining challenge in the
  opening + "Problem framing" section; consistency-over-availability
  explained inline via CAP theorem (flagged `HLD-01` concept-dependency).
- **Requirements & capacity estimate**: functional/non-functional
  requirements listed verbatim from this checklist; back-of-envelope math
  derives ~100k read/s and ~10k write/s from the 1M-concurrent-user figure,
  plus the 10:1 (drop) vs 100:1 (ordinary day) read:write distinction.
- **Architecture diagram**: one Mermaid flowchart covers client → CDN/API
  gateway → virtual queue → search/catalog service → seat inventory
  service → booking/reservation service → payment service → message queue
  → notification service, with Redis (seat holds) and per-service
  datastores (catalog read replicas, booking DB with version column)
  labeled on their edges.
- **Deep dives**: all five covered as their own subsections — seat-hold
  mechanism (Redis `SET NX EX`), double-booking defense-in-depth (Redis +
  DB version check), stampede handling (virtual waiting room, with its own
  comparison diagram), search/catalog scaling (CDN, cache-aside, read
  replicas, cache stampede), and the booking→payment saga (own sequence
  diagram with timeout rollback).
- **Trade-offs**: optimistic vs pessimistic vs distributed lock (Redis vs
  ZooKeeper) vs virtual queue covered as a comparison table plus prose,
  each naming what it's traded against.
- **Worked example**: dedicated sequence diagram of Alice/Bob contending
  for seat A12, one succeeding via Redis `NX`, one rejected before
  reaching the database.
- **Interview angle**: all three follow-ups covered (group booking of
  adjacent seats, cancellation/refund flow, payment-succeeds-after-hold-
  expired). Refund *policy* itself stays out of scope per this checklist's
  own "Explicitly Out of Scope" line — only the seat-release/payment-
  reversal shape is covered, which is what the follow-up is actually
  probing for in an interview.
- **Practice & Self-Check**: 7 recap `QuizItem`s spanning locking
  strategies and the consistency/availability trade-off, plus the open
  challenge ("design the seat-hold expiry and cleanup mechanism") with a
  5-item independently-checkable `Rubric` (which renders the self-score
  band automatically — `Rubric` composes `SelfScoreBand` internally, so
  the lesson doesn't call `SelfScoreBand` directly; confirmed by reading
  `components/lesson/Rubric.tsx`).
- Also wove in 4 inline "check yourself" `QuizItem`s after major concepts
  (consistency trade-off, seat-hold mechanism, double-booking
  defense-in-depth, stampede handling, saga rollback — 5 total across the
  body) beyond the closing recap quiz, per the enhanced lesson template.

**Nothing dropped.** All 5 concept-lesson links this lesson would normally
make (`HLD-01`, `HLD-03`, `HLD-06`, `HLD-07`, `HLD-10`, per
`content/04-case-studies/SYLLABUS.md`'s CS-08 dependency list) are written
inline instead, each flagged with an `HTML` comment
(`<!-- concept-dependency: HLD-XX not yet built, explained inline -->`) for
a future pass to swap in real links once those concept lessons exist, per
the ruling in `docs/superpowers/plans/TRACKER.md`.

Verified rendering at `/case-studies/ticketmaster/hld` via `pnpm dev` +
Playwright: page renders with no console errors, all 4 Mermaid diagrams
render as SVG (not raw text), quiz reveal/hide works, and the rubric's
checkbox interactions update the self-score band live. Checked in both
light and dark theme.

### `lld.mdx` (2026-08-26)

Walked every LLD checklist item above against the finished lesson; all are
covered and ticked `[x]`. Notes:

- **Problem framing**: reframes the HLD's system-level solution at the
  object/schema level — a plain `status` field plus scattered `if/else`
  checks is named as the actual bug source, not "concurrency" in the
  abstract.
- **Requirements at the object level**: each functional requirement maps
  to a specific entity/lifecycle need (search → `Event`/`Venue`/`Show`;
  live availability → cheap-to-read `Seat` status; temporary hold →
  `LOCKED` state with an owner and expiry; payment/confirm → `Booking`'s
  own lifecycle; cancel/expire → both directions back to the start state
  named explicitly, with the "two triggers, one destination state" trap
  called out).
- **Class diagram**: one `classDiagram` covers all 10 checklist entities
  (`Venue`, `SeatMap`, `Seat`, `PricingTier`, `Event`, `Show`, `Booking`,
  `BookingItem`, `Payment`, `User`) plus `SeatInventory` as the class that
  actually owns per-show seat state — a deliberate, explained addition,
  not scope creep (the "why not a status field on `Seat`" reasoning is
  spelled out in prose immediately after the diagram).
- **State machines**: both covered as their own `stateDiagram-v2` panels
  — Seat (`AVAILABLE ⇄ LOCKED → BOOKED`, with both back-edges to
  `AVAILABLE` named separately: TTL expiry and explicit cancel) and
  Booking (`PENDING → CONFIRMED/EXPIRED/CANCELLED`), with prose explaining
  where the two state machines couple (a terminal `Booking` state
  triggers `SeatInventory.release()`).
- **Design patterns**: all 5 covered as their own subsections — State
  (Seat/Booking lifecycles), Strategy (pricing), Factory (seat/ticket
  construction), Observer (hold-release notifications), and SOLID/OCP
  threaded through the State and Strategy sections explicitly (not a
  separate bolted-on paragraph).
- **Database design**: all 5 covered — `erDiagram` schema, normalization
  reasoning (why `SEAT_INVENTORY` is its own row per show+seat, and where
  a denormalized read cache pays off on top of it), indexing strategy
  (the `(show_id, state)` composite index), SQL-vs-Redis split for
  committed state vs. TTL holds, and the `version` column's optimistic-
  locking mechanics with a concrete `UPDATE ... WHERE version = ?`
  statement.
- **Trade-offs**: both covered — State pattern vs. enum+if/else, and
  normalized vs. denormalized seat-status table — each naming what it
  costs, not just what it wins.
- **Worked example**: a dedicated sequence diagram (Priya vs. Marcus on
  seat C12) traces the Redis `NX` fast-path rejection and the rarer
  version-check retry path in one diagram, with a follow-up quiz item
  reversing the ordering to check real understanding.
- **Interview angle**: all 3 follow-ups covered — "walk me through your
  classes," "how does this prevent double-booking at the code level"
  (two independent guards named explicitly), and the pricing-strategy
  extensibility probe.
- **Practice & Self-Check**: 7 recap `QuizItem`s (pattern identification
  + schema decisions) plus the open challenge (group bookings of
  adjacent seats, atomic all-or-nothing) with a concrete reference answer
  (a `GroupHold` aggregate, lock ordering to prevent deadlock,
  compensating rollback) inside a collapsible `<details>` and a 5-item
  `Rubric`. 6 additional inline `QuizItem`s appear after major concepts
  throughout the body, beyond the closing recap quiz.

**Nothing dropped.** Concept-lesson links this lesson would normally make
(`LLD-01`, `LLD-03`, `LLD-05`, per `content/04-case-studies/SYLLABUS.md`'s
CS-08 dependency list) are written inline instead, each flagged with a
JSX comment (`{/* concept-dependency: LLD-XX not yet built, explained
inline */}`) for a future pass to swap in real links once those concept
lessons exist, per the ruling in `docs/superpowers/plans/TRACKER.md`.

Verified rendering at `/case-studies/ticketmaster/lld` via `pnpm dev` +
Playwright, by the controller: page renders with no console errors, the
`classDiagram`, both `stateDiagram-v2` panels, the `erDiagram`, and the
`sequenceDiagram` all render as SVG. Confirmed live interactivity — two
`Rubric` checkboxes clicked, `SelfScoreBand` updated from "NOVICE — 0%
COVERED" to "PRACTICING — 40% COVERED" — and checked contrast/legibility
in both light and dark theme.

**Bug found and fixed during controller verification:** this file (and 4
of the other 5 newly-drafted lesson files) originally used raw HTML
comments (`<!-- concept-dependency: ... -->`) for the concept-dependency
markers per the original dispatch instructions, which MDX does not parse
— `Unexpected character '!' ... to create a comment in MDX, use {/* text
*/}`, a hard 500 on every affected route. Fixed by converting all 31
occurrences across the 5 affected files to JSX comment syntax
(`{/* ... */}`); this file's title frontmatter also had a duplicated
`(LLD)` suffix (`lib/content.ts` already appends `(HLD)`/`(LLD)` to nav
labels automatically) producing "(LLD) (LLD)" in the sidebar — fixed by
removing the manual suffix from the frontmatter title.
