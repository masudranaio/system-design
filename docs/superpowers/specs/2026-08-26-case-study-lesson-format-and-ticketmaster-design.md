# Case Study Lesson Format + Ticketmaster Pilot — Design

**Date:** 2026-08-26
**Status:** Approved, spec-only (no lessons built yet)
**Amends:** [2026-08-26-system-design-course-outline-design.md](2026-08-26-system-design-course-outline-design.md)
 — extends its "Lesson template" section and its 04-case-studies process;
does not change locked scope, structure, or the priority build order.
**Output format amended by:**
[2026-08-26-nextjs-mdx-app-migration-design.md](2026-08-26-nextjs-mdx-app-migration-design.md) —
everywhere below that says `hld.html`/`lld.html`, read `hld.mdx`/`lld.mdx`.
The content plan (this doc) is otherwise unaffected.

## Purpose

Two things, decided together because the second is a concrete instance of
the first:

1. A **checklist-first production workflow** and an **enhanced interactive
   lesson template** (self-checks woven through the content, not just
   bolted on at the end) that every future case-study lesson — HLD and
   LLD — follows.
2. A **pilot content plan for Ticketmaster** (`CS-08`), used to prove the
   format out before it's applied to the rest of the priority list. Chosen
   as pilot because it's the priority list's richest two-sided case study
   (both HLD and LLD are substantial, not one thin secondary side).

Ticketmaster's own `hld.html`/`lld.html` build is **out of scope for this
spec** — per CLAUDE.md's priority build order (Ticketmaster is `CS-08`,
last in the priority list), building it now would jump the queue. This
spec produces its `CHECKLIST.md` (a content plan) so the format is
validated on paper; the actual HTML build happens later, in priority
order, opportunistically or on request.

## 1. Checklist-first production workflow

Every case study now produces three artifacts, in this order:

1. **`04-case-studies/<system>/CHECKLIST.md`** — written first, before any
   HTML. Contains:
   - Problem scope: functional requirements, non-functional requirements,
     explicit in-scope/out-of-scope lines
   - A checkbox list per lesson side (HLD, LLD, and "others" only if a
     case study genuinely needs a third artifact — expected to be rare)
     covering every diagram, concept, trade-off, pattern, and self-check
     item that lesson must contain
   - This is the reviewable planning artifact — check it against the
     concept-module dependencies (e.g. LLD-03 for patterns, LLD-05 for DB
     design) before any HTML gets written
2. **`hld.html` / `lld.html`** — built against the checklist, using the
   enhanced template (Section 2 below)
3. **Completeness pass** — after the HTML is built, walk the checklist
   against the finished lesson and explicitly mark each item covered or
   flag it as dropped (report gaps out loud rather than silently omitting
   them), then update the case study's `README.md` index and flip status
   in `SYLLABUS.md` / `04-case-studies/SYLLABUS.md`

This is a process addition to CLAUDE.md's "Before writing any lesson" /
"After writing a lesson" sections, not a one-off for Ticketmaster.

## 2. Enhanced lesson template

The locked 6-part shape from the course outline spec is unchanged in
sequence — problem framing → core content → trade-offs → worked example →
interview angle → quick check — but self-checks are now woven through it
instead of concentrated only at the end:

- **Core content / Trade-offs**: after each major concept or component, a
  small inline "check yourself" widget — 1-2 MCQ or short-answer, with a
  click-to-reveal answer plus a one-line explanation. Contextual to the
  concept just explained, not a separate quiz block.
- **Quick check → "Practice & Self-Check"** (renamed and expanded into
  three parts):
  a. **Rapid-fire recap quiz** — 5-8 questions spanning the whole lesson,
     reveal-toggle answers
  b. **Open design challenge** — one substantial prompt ("extend X to
     handle Y") with a collapsible reference answer and an explicit
     self-tick rubric checklist (did you cover A / B / C / D)
  c. **Self-score band** — Novice / Practicing / Interview-ready, based on
     how many rubric items were ticked

Mechanics stay static-HTML-friendly (no backend, self-contained artifact):
`<details>`/`<summary>` or click-to-reveal for answers, radio buttons with
instant feedback for MCQs, checkboxes for the rubric. Per the course
outline spec's Format section, the `artifact-design` skill is used before
drafting the actual HTML.

## 3. Ticketmaster problem scope

**One-line problem:** let users search for events, view a seat map, and
buy tickets — without ever selling the same seat twice, even when ~100,000
people hit "buy" on the same show in the same second.

**Functional requirements:**
- Search/browse events and venues
- View live seat availability for a show
- Reserve a seat temporarily while paying (a time-boxed hold)
- Complete payment and confirm the booking
- Cancel/expire a hold or booking and release the seat

**Non-functional requirements** (grounded in HelloInterview's Ticketmaster
breakdown — see Sources):
- Strong consistency on seat state during checkout — no double-booking or
  overselling, even under contention
- Scale: ~1M concurrent users during a popular on-sale, ~100k seat-view
  requests/sec, ~10k write transactions/sec during a ticket drop
- Low search/browse latency (<500ms), high read:write ratio (~100:1)
  outside of drop windows
- Availability for browsing even if the write path is under extreme load

**Explicitly out of scope** (mentioned only as one-line interview
follow-ups, not built out as full sections): full payment-gateway
integration details, seating-chart rendering/UI, recommendations/
marketing, refund/dispute policy details.

## 4. Ticketmaster HLD outline (`hld.html`)

1. **Problem framing** — the on-sale stampede as the defining challenge;
   why this is a consistency-over-availability problem during checkout
2. **Requirements & capacity estimate** — functional/non-functional reqs
   above, back-of-envelope math for the scale numbers
3. **Core content — architecture diagram** (Mermaid): client → API
   gateway → search/catalog service → seat inventory service →
   booking/reservation service → payment service → notification service;
   Redis for seat holds; message queue for confirmation/notification;
   per-service datastores
4. **Core content — deep dives** (the parts that make this problem worth
   asking):
   - Seat-hold mechanism: Redis TTL lock + virtual queue in front of seat
     selection (what Ticketmaster's real system uses)
   - Double-booking prevention: distributed lock + DB-level optimistic
     version check as defense-in-depth (belt and suspenders)
   - Stampede handling: virtual waiting room, why it's better than letting
     100k requests hit inventory directly
   - Search/catalog scaling: caching, read replicas, CDN for event pages
   - Booking→payment flow as a saga: hold → charge → confirm, with
     timeout-triggered rollback if payment doesn't complete in time
5. **Trade-offs** — optimistic lock vs pessimistic lock vs distributed
   lock (Redis/Zookeeper) vs virtual queue: when each is the right call
6. **Worked example** — sequence diagram tracing two users contending for
   the same seat: one succeeds, one is rejected cleanly
7. **Interview angle** — common follow-ups: partial/group booking of
   adjacent seats, refund/cancellation flow, what happens if payment fails
   after the hold expires
8. **Practice & Self-Check** — recap quiz on locking strategies and the
   consistency/availability trade-off; open challenge: "design the
   seat-hold expiry and cleanup mechanism" with rubric

## 5. Ticketmaster LLD outline (`lld.html`)

1. **Problem framing** — from the object/schema level: model the booking
   domain so seat-state transitions are safe by construction, not by
   convention
2. **Requirements at the object level** — entities and lifecycle states
   needed to support the functional requirements above
3. **Core content — class diagram** (Mermaid `classDiagram`): Event,
   Venue, SeatMap, Seat, Show, Booking, BookingItem, Payment, User,
   PricingTier and their relationships
4. **Core content — state machines** (Mermaid `stateDiagram`):
   - Seat: `AVAILABLE → LOCKED(TTL) → BOOKED`, with paths back to
     `AVAILABLE` on expiry or cancellation
   - Booking: `PENDING → CONFIRMED → CANCELLED / EXPIRED`
5. **Core content — design patterns** (explicit subsection, applies
   [LLD-03](../../../content/03-low-level-design/SYLLABUS.md) rather than
   re-teaching it):
   - **State** — for Seat and Booking lifecycles, instead of scattered
     status `if/else` checks
   - **Strategy** — for pricing (VIP / general / dynamic), swappable
     without touching booking logic
   - **Factory** — for creating different ticket/seat types
   - **Observer** — for notifying waiting users when a held seat is
     released back to available
   - SOLID framing threaded through (e.g. Strategy over an `if/else`
     pricing block as an Open/Closed win)
6. **Core content — database design** (explicit subsection, applies
   [LLD-05](../../../content/03-low-level-design/SYLLABUS.md) rather than
   re-teaching it):
   - ER diagram / schema for the entities above
   - Normalization decisions: seat inventory as its own row per
     seat-per-show rather than denormalized into Event; where
     denormalizing *would* help read-heavy seat-map queries
   - Indexing strategy for "show seat availability for show X"
   - SQL vs NoSQL at the object level: relational for bookings/payments
     (needs transactions), Redis alongside it for the seat-hold TTL —
     deliberately not a schema table
   - Concurrency at the schema level: the `version` column backing the
     optimistic-lock check
7. **Trade-offs** — State pattern vs enum+if-else; normalized vs
   denormalized seat-status table for fast reads
8. **Worked example** — sequence diagram of the reserve-seat flow through
   the classes, including the version-check retry path
9. **Interview angle** — "walk me through your classes," "how does this
   prevent double-booking at the code level," extensibility probes (add a
   new pricing strategy without touching `Booking`)
10. **Practice & Self-Check** — recap quiz on pattern identification and
    schema decisions; open challenge: "extend the design to support group
    bookings of adjacent seats" with rubric

## 6. Artifacts produced by this spec

- This design doc
- `CLAUDE.md` — add the checklist-first workflow to "Before writing any
  lesson" / "After writing a lesson"
- `04-case-studies/ticketmaster/CHECKLIST.md` — the concrete checklist
  instance for sections 3-5 above

`hld.html` and `lld.html` for Ticketmaster are not built by this spec —
see "Purpose" above.

## Sources

- [Ticketmaster System Design Interview Guide — HelloInterview](https://www.hellointerview.com/learn/system-design/answer-keys/ticketmaster)
- [Design a Ticket Booking Site Like Ticketmaster — HelloInterview](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ticketmaster)
- [Ticketmaster System Design: Step-by-Step Guide — System Design Handbook](https://www.systemdesignhandbook.com/guides/ticketmaster-system-design/)
- [Movie Ticket Booking Low Level Design — LLD Hub](https://lldhub.in/blog/movie-ticket-booking-lld)
- [Design a Movie Ticket Booking System — Low Level Design Mastery](https://www.lowleveldesignmastery.com/interview-guide/case-studies/easy/movie-ticket-booking-system/)
