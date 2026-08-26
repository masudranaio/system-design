# Ticketmaster — Case Study Checklist

Content plan for `hld.html` and `lld.html`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md).

Status: HLD not started, LLD not started. See
[SYLLABUS.md](../../SYLLABUS.md) / [04-case-studies/SYLLABUS.md](../SYLLABUS.md)
(CS-08) for build priority — this checklist is a plan, not a built lesson.

## Problem Scope

Let users search for events, view a seat map, and buy tickets — without
ever selling the same seat twice, even when ~100,000 people hit "buy" on
the same show in the same second.

### Functional Requirements

- [ ] Search/browse events and venues
- [ ] View live seat availability for a show
- [ ] Reserve a seat temporarily while paying (a time-boxed hold)
- [ ] Complete payment and confirm the booking
- [ ] Cancel/expire a hold or booking and release the seat

### Non-Functional Requirements

- [ ] Strong consistency on seat state during checkout — no double-booking
      or overselling, even under contention
- [ ] Scale: ~1M concurrent users during a popular on-sale, ~100k
      seat-view requests/sec, ~10k write transactions/sec during a ticket
      drop
- [ ] Low search/browse latency (<500ms), high read:write ratio (~100:1)
      outside of drop windows
- [ ] Availability for browsing even if the write path is under extreme
      load

### Explicitly Out of Scope

- [ ] Full payment-gateway integration details
- [ ] Seating-chart rendering/UI
- [ ] Recommendations/marketing
- [ ] Refund/dispute policy details

## HLD Checklist (`hld.html`)

### 1. Problem framing

- [ ] The on-sale stampede framed as the defining challenge
- [ ] Explain why this is a consistency-over-availability problem during
      checkout

### 2. Requirements & capacity estimate

- [ ] Reference the functional/non-functional requirements above
- [ ] Back-of-envelope math for the scale numbers (~1M concurrent users,
      ~100k seat-view req/s, ~10k write TPS)

### 3. Core content — architecture diagram

- [ ] Mermaid diagram of the request flow: client → API gateway →
      search/catalog service → seat inventory service →
      booking/reservation service → payment service → notification
      service
- [ ] Redis for seat holds
- [ ] Message queue for confirmation/notification
- [ ] Per-service datastores

### 4. Core content — deep dives

- [ ] Seat-hold mechanism: Redis TTL lock + virtual queue in front of
      seat selection (what Ticketmaster's real system uses)
- [ ] Double-booking prevention: distributed lock + DB-level optimistic
      version check as defense-in-depth (belt and suspenders)
- [ ] Stampede handling: virtual waiting room, why it's better than
      letting 100k requests hit inventory directly
- [ ] Search/catalog scaling: caching, read replicas, CDN for event pages
- [ ] Booking→payment flow as a saga: hold → charge → confirm, with
      timeout-triggered rollback if payment doesn't complete in time

### 5. Trade-offs

- [ ] Optimistic lock vs pessimistic lock vs distributed lock
      (Redis/Zookeeper) vs virtual queue: when each is the right call

### 6. Worked example

- [ ] Sequence diagram tracing two users contending for the same seat:
      one succeeds, one is rejected cleanly

### 7. Interview angle

- [ ] Follow-up: partial/group booking of adjacent seats
- [ ] Follow-up: refund/cancellation flow
- [ ] Follow-up: what happens if payment fails after the hold expires

### 8. Practice & Self-Check

- [ ] Recap quiz on locking strategies and the consistency/availability
      trade-off
- [ ] Open challenge: "design the seat-hold expiry and cleanup
      mechanism" with rubric

## LLD Checklist (`lld.html`)

### 1. Problem framing

- [ ] Frame the problem from the object/schema level: model the booking
      domain so seat-state transitions are safe by construction, not by
      convention

### 2. Requirements at the object level

- [ ] Identify the entities and lifecycle states needed to support the
      functional requirements above

### 3. Class diagram

- [ ] Class diagram (Mermaid `classDiagram`) covering Event, Venue,
      SeatMap, Seat, Show, Booking, BookingItem, Payment, User,
      PricingTier, and their relationships

### 4. State machines

- [ ] Seat state machine: `AVAILABLE → LOCKED(TTL) → BOOKED`, with paths
      back to `AVAILABLE` on expiry or cancellation
- [ ] Booking state machine: `PENDING → CONFIRMED → CANCELLED / EXPIRED`

### 5. Design patterns

- [ ] State — for Seat and Booking lifecycles, instead of scattered status
      if/else checks
- [ ] Strategy — for pricing (VIP / general / dynamic), swappable without
      touching booking logic
- [ ] Factory — for creating different ticket/seat types
- [ ] Observer — for notifying waiting users when a held seat is released
      back to available
- [ ] SOLID framing threaded through (e.g. Strategy over an if/else
      pricing block as an Open/Closed win)

### 6. Database design

- [ ] ER diagram / schema for the entities above
- [ ] Normalization decisions: seat inventory as its own row per
      seat-per-show rather than denormalized into Event; where
      denormalizing would help read-heavy seat-map queries
- [ ] Indexing strategy for "show seat availability for show X"
- [ ] SQL vs NoSQL at the object level: relational for bookings/payments
      (needs transactions), Redis alongside it for the seat-hold TTL —
      deliberately not a schema table
- [ ] Concurrency at the schema level: the `version` column backing the
      optimistic-lock check

### 7. Trade-offs

- [ ] State pattern vs enum+if-else
- [ ] Normalized vs denormalized seat-status table for fast reads

### 8. Worked example

- [ ] Sequence diagram of the reserve-seat flow through the classes,
      including the version-check retry path

### 9. Interview angle

- [ ] Follow-up: "walk me through your classes"
- [ ] Follow-up: "how does this prevent double-booking at the code level"
- [ ] Follow-up: extensibility probes (add a new pricing strategy without
      touching `Booking`)

### 10. Practice & Self-Check

- [ ] Recap quiz on pattern identification and schema decisions
- [ ] Open challenge: "extend the design to support group bookings of
      adjacent seats" with rubric

## Completeness Pass Log

Not yet run — fill in when `hld.html`/`lld.html` are built, per
CLAUDE.md's "After writing a lesson" rule.
