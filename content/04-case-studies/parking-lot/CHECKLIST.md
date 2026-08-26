# Parking Lot — Case Study Checklist

Content plan for `hld.mdx` and `lld.mdx`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: LLD built (`lld.mdx`, primary side), HLD not started (secondary
side). See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-03) for build
priority — this checklist is a plan, not a built lesson.

## Problem Scope

Design a system that manages vehicle entry, spot assignment, and fee
collection for a parking facility (LLD), and, secondarily, a service
that tracks and serves real-time spot availability across a network of
many such facilities (HLD).

### Functional Requirements

(Checked below at the single-facility scope `lld.mdx` covers; the
multi-facility aggregate view referenced in the last item is HLD's job,
not re-checked here.)

- [x] Support multiple vehicle types (motorcycle, car/compact, large
      vehicle/truck/bus) with type-to-spot compatibility rules
- [x] Automatically assign an available, compatible spot on entry
      (system-assigned, not driver-chosen)
- [x] Issue a ticket at entry recording vehicle, spot, and entry
      timestamp
- [x] Validate the ticket at exit, compute the fee, and free the spot
- [x] Support multiple levels/floors, each with a configurable number of
      spots of different sizes
- [x] Support multiple entry/exit gates operating concurrently
- [x] Reject entry when no compatible spot exists (lot/level full);
      reject exit on invalid, already-used, or lost tickets
- [x] Track real-time occupancy/availability (per level and per lot) —
      per-lot only; cross-lot aggregation is HLD scope

### Non-Functional Requirements

- [x] Concurrency: multiple gates issuing tickets and freeing spots
      simultaneously must not double-assign a spot
- [x] Scale: a garage with ~5-10 levels and hundreds to a couple
      thousand spots per lot; low single-digit transactions/sec per lot
      — a deliberately small-scale problem, don't over-engineer for
      web-scale
- [x] Low latency for the entry/exit hot path
- [x] Data integrity: a ticket must map to exactly one active parking
      session; no orphaned "occupied" spots
- [x] Availability: entry/exit should keep working even if non-critical
      subsystems (e.g. a display board) are down

### Explicitly Out of Scope

- [x] Physical hardware integration (gate arms, cameras, IoT sensors) —
      mention conceptually only
- [x] Payment gateway integration details (pricing is a pluggable
      strategy, not a full checkout flow)
- [x] Full advance-reservation/booking system — note as an extension
- [x] User accounts, authentication, mobile app UI
- [x] Detailed pricing/discount business rules beyond showing pricing is
      pluggable

## HLD Checklist (`hld.mdx`) — secondary side: multi-location network, distributed availability service

### 1. Problem framing

- [ ] Reframe at the scale of a parking network operator
      (SpotHero/ParkWhiz-style): thousands of independent facilities
      each with local inventory, needing real-time availability +
      search/reservation for a mobile app
- [ ] Identify the new core problem: availability data originates at
      the edge and must be aggregated/kept-fresh/served for geospatial
      queries at low latency — a data-freshness-and-fan-out problem,
      not object modeling

### 2. Requirements & capacity estimate

- [ ] Geospatial search for nearby available parking
- [ ] Near-real-time per-lot occupancy
- [ ] Optional cross-lot reservation/booking
- [ ] Partner ingestion API
- [ ] Scale: thousands of lots, aggregate event volume up to tens of
      thousands of events/sec
- [ ] Read path far higher volume than write path, sub-second read
      latency
- [ ] Consistency explicitly relaxed vs LLD: stale-by-seconds
      availability display is acceptable, double-booking
      money/reservations is not

### 3. Core content — architecture diagram

- [ ] Edge layer: per-lot gate systems/IoT sensors publish
      state-change events to an ingestion gateway, buffers locally,
      replays on reconnect
- [ ] Ingestion/streaming layer: durable event log (Kafka-style),
      system of record per lot
- [ ] Stream processors maintain current-state projections
- [ ] Serving/cache layer (Redis-style, sub-100ms reads, source of
      truth stays the event log + DB)
- [ ] Geospatial index (geohash/quad-tree) over lot locations
- [ ] API/gateway layer (search/reservation/partner-ingestion,
      load-balanced stateless services)
- [ ] Reservation service as a separate bounded context (strong
      consistency) from live-occupancy (eventual consistency)

### 4. Core content — deep dives

- [ ] Data model & partitioning: shard by lot_id/region; two distinct
      data shapes — high-write append-only event stream vs low-write
      high-read aggregate/cache — get different storage strategies
- [ ] Keeping availability fresh without hammering the DB: push-based
      updates via event stream -> cache invalidation, extends the LLD
      Observer pattern to network scale
- [ ] Handling flaky edge connectivity: gateway-side buffering/replay +
      periodic reconciliation job against the raw event log
- [ ] Search fan-out: geospatial bounding-box/geohash-prefix lookup,
      then batch-fetch availability from cache rather than joining the
      live stream per request

### 5. Trade-offs

- [ ] Strong consistency (reservations) vs eventual consistency (live
      occupancy) — treating both as one model wastes cost/latency on
      the read-heavy majority
- [ ] Cache/streaming projection vs direct-DB query (ops complexity vs
      required for sub-second search at scale)
- [ ] Centralized ingestion (simple, single blast radius) vs
      per-region ingestion clusters (resilient, lower-latency, more
      aggregation complexity)

### 6. Worked example

- [ ] Trace: user opens app in Seattle -> geosearch request ->
      geospatial index returns 40 candidate lot IDs -> batch-read
      current availability from cache -> ranked results under a second
- [ ] Concurrent trace: Lot #4821's gate reports a car entering ->
      event lands in stream -> processor decrements count -> cache
      updated -> next search reflects the new count within the
      propagation-delay SLA (a few seconds) — illustrates the
      eventual-consistency trade-off

### 7. Interview angle

- [ ] Follow-up: how does a lot going offline get reconciled
- [ ] Follow-up: how does the reservation service avoid conflicting
      with the live-occupancy feed

### 8. Practice & Self-Check

- [ ] Open challenge: "A partner wants advance reservations that must
      never double-book a spot, layered on top of the
      eventually-consistent live-occupancy feed. Sketch how the
      reservation service coordinates with the live-occupancy
      aggregate so a reserved-but-not-yet-occupied spot doesn't show
      as available to search users, and doesn't get double-counted as
      occupied once the driver arrives and the gate reports entry."
      with rubric

## LLD Checklist (`lld.mdx`) — primary side

### 1. Problem framing

- [x] Frame the problem as the "Hello World" of LLD interviews
- [x] Interviewer expects clarifying questions first (vehicle types?
      multi-level? multi-gate? pricing model? reservations in scope?)
      before naming a class
- [x] Set the boundary: single-facility object model now,
      multi-location concerns deferred to HLD

### 2. Requirements at the object level

- [x] Translate functional requirements into nouns-that-need-behavior:
      ParkingLot, Level, Spot, Vehicle, Ticket, Gate, Payment/Pricing
- [x] Warn against turning every noun into a class (e.g. "fee" is
      behavior, not an entity)
- [x] Decide cardinalities: one ParkingLot -> many Levels -> many
      Spots; one Ticket <-> one Vehicle <-> one Spot
- [x] Decide the vehicle-to-spot compatibility rule explicitly

### 3. Class diagram

- [x] Mermaid class diagram (`classDiagram`) covering ParkingLot (id,
      name, address, List\<Level\>, List\<EntryGate\>,
      List\<ExitGate\>, owns parkVehicle()/unparkVehicle())
- [x] Level/ParkingFloor (floor number, List\<Spot\>)
- [x] Spot (id, size/type enum MOTORCYCLE/COMPACT/LARGE, status,
      current Vehicle ref)
- [x] Vehicle (abstract base: license plate, size; subclassed
      Motorcycle/Car/Truck-Bus)
- [x] Ticket (id, Vehicle ref, Spot ref, entry/exit timestamp, status)
- [x] Gate (EntryGate issues ticket + triggers assignment; ExitGate
      validates + triggers pricing + release)
- [x] Payment/PricingStrategy (computes fee from duration + vehicle
      type)
- [x] DisplayBoard (optional, subscribes to occupancy changes)
- [x] Relationships: composition ParkingLot-Level-Spot, association
      Ticket-Vehicle and Ticket-Spot, Gate depends on ParkingLot's
      allocate/release ops, PricingStrategy/SpotAssignmentStrategy
      injected not owned

### 4. State machines

- [x] Spot state machine: AVAILABLE -> RESERVED(optional) -> OCCUPIED
      -> AVAILABLE
- [x] Ticket state machine: ISSUED(active) -> PAID/EXITED(closed),
      with edge states LOST (flat penalty fee) and
      INVALID/ALREADY_USED (rejected re-use)
- [x] Spot+Ticket transitions must be atomic together — a partial
      update is the classic bug interviewers probe for

### 5. Design patterns

- [x] Singleton (ParkingLot, one instance; note testability/
      global-state trade-off, DI as alternative)
- [x] Strategy x2: SpotAssignmentStrategy (nearest-first vs best-fit vs
      level-balancing); PricingStrategy (flat/tiered/surge) — flag
      this double-use as the key insight of the problem
- [x] Factory (VehicleFactory/SpotFactory for subtype construction)
- [x] Observer (DisplayBoard subscribes to occupancy changes, bridges
      to HLD side)
- [x] State (optional advanced answer: Ticket lifecycle as formal
      State pattern vs enum+if/else)

### 6. Database design

- [x] Tables: parking_lot, level, spot(lot_id, level_id, type,
      status), vehicle(plate, type), ticket(vehicle_id, spot_id,
      entry_time, exit_time, status, amount_paid), payment(ticket_id,
      method, amount, paid_at)
- [x] Normalize spot state into spot.status (not derived by scanning
      tickets) for O(1) "is anything free" checks
- [x] Indexing: spot(level_id, type, status) for the hot free-spot
      query
- [x] Indexing: unique index on ticket.vehicle_id WHERE
      status='ACTIVE' to catch double-entry — implemented as
      `WHERE status = 'ISSUED'` in `lld.mdx` (the lesson's own active
      state name, per its Ticket state machine, used consistently
      instead of introducing a second synonym)
- [x] Indexing: index ticket.spot_id for exit lookups
- [x] Concurrency: row-level locking or atomic UPDATE...WHERE
      status='AVAILABLE' (compare-and-set) to avoid double-assignment

### 7. Trade-offs

- [x] Best-fit vs nearest-fit spot assignment (waste vs UX vs compute)
- [x] Push (Observer) vs poll for occupancy display (instant but
      coupled vs simple but laggy — resurfaces at HLD scale)
- [x] Singleton vs DI ParkingLot (matches "one lot" vs testability)

### 8. Worked example

- [x] Sequence diagram: Car arrives at EntryGate-2 -> ParkingLot asks
      Level 3 for a free COMPACT-or-larger spot via
      SpotAssignmentStrategy -> Level returns Spot 3-047 -> spot
      atomically flips OCCUPIED, Ticket T-1042 issued -> DisplayBoard
      notified, decrements count
- [x] Continue the trace: 2 hours later, exit at ExitGate-1 -> ticket
      validated -> pricing computes fee -> payment recorded -> Spot
      flips AVAILABLE, Ticket closes -> DisplayBoard increments
- [x] Shows the atomic-transition point from the state machine section
      concretely

### 9. Interview angle

- [x] Follow-up: "How would you support advance reservation — how does
      that change the Spot state machine and assignment strategy?"
- [x] Follow-up: "Two gates process entries at the same instant, both
      see the same spot free — walk through exactly how your code
      prevents double-assignment"
- [x] Follow-up: "How would you add per-vehicle-type or time-of-day
      surge pricing without modifying Ticket or Gate?"

### 10. Practice & Self-Check

- [x] Open challenge: "Extend the design to support handicapped and
      EV-charging spots, where an EV spot enforces a max stay duration
      and different pricing, and a handicapped spot requires a permit
      check at entry. Update class diagram, state machines, identify
      which pattern(s) absorb the change vs where a new one is needed,
      and where does this design break if untouched?" with rubric

## Completeness Pass Log

Not yet run — fill in when `hld.mdx`/`lld.mdx` are built, per
CLAUDE.md's "After writing a lesson" rule.
