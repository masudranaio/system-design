# Parking Lot — Case Study Checklist

Content plan for `hld.mdx` and `lld.mdx`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: LLD not started (primary side), HLD built (secondary side, see
`hld.mdx`, completeness pass logged below). See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-03) for build
priority — this checklist is a plan, not a built lesson.

## Problem Scope

Design a system that manages vehicle entry, spot assignment, and fee
collection for a parking facility (LLD), and, secondarily, a service
that tracks and serves real-time spot availability across a network of
many such facilities (HLD).

### Functional Requirements

- [ ] Support multiple vehicle types (motorcycle, car/compact, large
      vehicle/truck/bus) with type-to-spot compatibility rules
- [ ] Automatically assign an available, compatible spot on entry
      (system-assigned, not driver-chosen)
- [ ] Issue a ticket at entry recording vehicle, spot, and entry
      timestamp
- [ ] Validate the ticket at exit, compute the fee, and free the spot
- [ ] Support multiple levels/floors, each with a configurable number of
      spots of different sizes
- [ ] Support multiple entry/exit gates operating concurrently
- [ ] Reject entry when no compatible spot exists (lot/level full);
      reject exit on invalid, already-used, or lost tickets
- [ ] Track real-time occupancy/availability (per level and per lot)

### Non-Functional Requirements

- [ ] Concurrency: multiple gates issuing tickets and freeing spots
      simultaneously must not double-assign a spot
- [ ] Scale: a garage with ~5-10 levels and hundreds to a couple
      thousand spots per lot; low single-digit transactions/sec per lot
      — a deliberately small-scale problem, don't over-engineer for
      web-scale
- [ ] Low latency for the entry/exit hot path
- [ ] Data integrity: a ticket must map to exactly one active parking
      session; no orphaned "occupied" spots
- [ ] Availability: entry/exit should keep working even if non-critical
      subsystems (e.g. a display board) are down

### Explicitly Out of Scope

- [ ] Physical hardware integration (gate arms, cameras, IoT sensors) —
      mention conceptually only
- [ ] Payment gateway integration details (pricing is a pluggable
      strategy, not a full checkout flow)
- [ ] Full advance-reservation/booking system — note as an extension
- [ ] User accounts, authentication, mobile app UI
- [ ] Detailed pricing/discount business rules beyond showing pricing is
      pluggable

## HLD Checklist (`hld.mdx`) — secondary side: multi-location network, distributed availability service

### 1. Problem framing

- [x] Reframe at the scale of a parking network operator
      (SpotHero/ParkWhiz-style): thousands of independent facilities
      each with local inventory, needing real-time availability +
      search/reservation for a mobile app
- [x] Identify the new core problem: availability data originates at
      the edge and must be aggregated/kept-fresh/served for geospatial
      queries at low latency — a data-freshness-and-fan-out problem,
      not object modeling

### 2. Requirements & capacity estimate

- [x] Geospatial search for nearby available parking
- [x] Near-real-time per-lot occupancy
- [x] Optional cross-lot reservation/booking
- [x] Partner ingestion API
- [x] Scale: thousands of lots, aggregate event volume up to tens of
      thousands of events/sec
- [x] Read path far higher volume than write path, sub-second read
      latency
- [x] Consistency explicitly relaxed vs LLD: stale-by-seconds
      availability display is acceptable, double-booking
      money/reservations is not

### 3. Core content — architecture diagram

- [x] Edge layer: per-lot gate systems/IoT sensors publish
      state-change events to an ingestion gateway, buffers locally,
      replays on reconnect
- [x] Ingestion/streaming layer: durable event log (Kafka-style),
      system of record per lot
- [x] Stream processors maintain current-state projections
- [x] Serving/cache layer (Redis-style, sub-100ms reads, source of
      truth stays the event log + DB)
- [x] Geospatial index (geohash/quad-tree) over lot locations
- [x] API/gateway layer (search/reservation/partner-ingestion,
      load-balanced stateless services)
- [x] Reservation service as a separate bounded context (strong
      consistency) from live-occupancy (eventual consistency)

### 4. Core content — deep dives

- [x] Data model & partitioning: shard by lot_id/region; two distinct
      data shapes — high-write append-only event stream vs low-write
      high-read aggregate/cache — get different storage strategies
- [x] Keeping availability fresh without hammering the DB: push-based
      updates via event stream -> cache invalidation, extends the LLD
      Observer pattern to network scale
- [x] Handling flaky edge connectivity: gateway-side buffering/replay +
      periodic reconciliation job against the raw event log
- [x] Search fan-out: geospatial bounding-box/geohash-prefix lookup,
      then batch-fetch availability from cache rather than joining the
      live stream per request

### 5. Trade-offs

- [x] Strong consistency (reservations) vs eventual consistency (live
      occupancy) — treating both as one model wastes cost/latency on
      the read-heavy majority
- [x] Cache/streaming projection vs direct-DB query (ops complexity vs
      required for sub-second search at scale)
- [x] Centralized ingestion (simple, single blast radius) vs
      per-region ingestion clusters (resilient, lower-latency, more
      aggregation complexity)

### 6. Worked example

- [x] Trace: user opens app in Seattle -> geosearch request ->
      geospatial index returns 40 candidate lot IDs -> batch-read
      current availability from cache -> ranked results under a second
- [x] Concurrent trace: Lot #4821's gate reports a car entering ->
      event lands in stream -> processor decrements count -> cache
      updated -> next search reflects the new count within the
      propagation-delay SLA (a few seconds) — illustrates the
      eventual-consistency trade-off

### 7. Interview angle

- [x] Follow-up: how does a lot going offline get reconciled
- [x] Follow-up: how does the reservation service avoid conflicting
      with the live-occupancy feed

### 8. Practice & Self-Check

- [x] Open challenge: "A partner wants advance reservations that must
      never double-book a spot, layered on top of the
      eventually-consistent live-occupancy feed. Sketch how the
      reservation service coordinates with the live-occupancy
      aggregate so a reserved-but-not-yet-occupied spot doesn't show
      as available to search users, and doesn't get double-counted as
      occupied once the driver arrives and the gate reports entry."
      with rubric

## LLD Checklist (`lld.mdx`) — primary side

### 1. Problem framing

- [ ] Frame the problem as the "Hello World" of LLD interviews
- [ ] Interviewer expects clarifying questions first (vehicle types?
      multi-level? multi-gate? pricing model? reservations in scope?)
      before naming a class
- [ ] Set the boundary: single-facility object model now,
      multi-location concerns deferred to HLD

### 2. Requirements at the object level

- [ ] Translate functional requirements into nouns-that-need-behavior:
      ParkingLot, Level, Spot, Vehicle, Ticket, Gate, Payment/Pricing
- [ ] Warn against turning every noun into a class (e.g. "fee" is
      behavior, not an entity)
- [ ] Decide cardinalities: one ParkingLot -> many Levels -> many
      Spots; one Ticket <-> one Vehicle <-> one Spot
- [ ] Decide the vehicle-to-spot compatibility rule explicitly

### 3. Class diagram

- [ ] Mermaid class diagram (`classDiagram`) covering ParkingLot (id,
      name, address, List\<Level\>, List\<EntryGate\>,
      List\<ExitGate\>, owns parkVehicle()/unparkVehicle())
- [ ] Level/ParkingFloor (floor number, List\<Spot\>)
- [ ] Spot (id, size/type enum MOTORCYCLE/COMPACT/LARGE, status,
      current Vehicle ref)
- [ ] Vehicle (abstract base: license plate, size; subclassed
      Motorcycle/Car/Truck-Bus)
- [ ] Ticket (id, Vehicle ref, Spot ref, entry/exit timestamp, status)
- [ ] Gate (EntryGate issues ticket + triggers assignment; ExitGate
      validates + triggers pricing + release)
- [ ] Payment/PricingStrategy (computes fee from duration + vehicle
      type)
- [ ] DisplayBoard (optional, subscribes to occupancy changes)
- [ ] Relationships: composition ParkingLot-Level-Spot, association
      Ticket-Vehicle and Ticket-Spot, Gate depends on ParkingLot's
      allocate/release ops, PricingStrategy/SpotAssignmentStrategy
      injected not owned

### 4. State machines

- [ ] Spot state machine: AVAILABLE -> RESERVED(optional) -> OCCUPIED
      -> AVAILABLE
- [ ] Ticket state machine: ISSUED(active) -> PAID/EXITED(closed),
      with edge states LOST (flat penalty fee) and
      INVALID/ALREADY_USED (rejected re-use)
- [ ] Spot+Ticket transitions must be atomic together — a partial
      update is the classic bug interviewers probe for

### 5. Design patterns

- [ ] Singleton (ParkingLot, one instance; note testability/
      global-state trade-off, DI as alternative)
- [ ] Strategy x2: SpotAssignmentStrategy (nearest-first vs best-fit vs
      level-balancing); PricingStrategy (flat/tiered/surge) — flag
      this double-use as the key insight of the problem
- [ ] Factory (VehicleFactory/SpotFactory for subtype construction)
- [ ] Observer (DisplayBoard subscribes to occupancy changes, bridges
      to HLD side)
- [ ] State (optional advanced answer: Ticket lifecycle as formal
      State pattern vs enum+if/else)

### 6. Database design

- [ ] Tables: parking_lot, level, spot(lot_id, level_id, type,
      status), vehicle(plate, type), ticket(vehicle_id, spot_id,
      entry_time, exit_time, status, amount_paid), payment(ticket_id,
      method, amount, paid_at)
- [ ] Normalize spot state into spot.status (not derived by scanning
      tickets) for O(1) "is anything free" checks
- [ ] Indexing: spot(level_id, type, status) for the hot free-spot
      query
- [ ] Indexing: unique index on ticket.vehicle_id WHERE
      status='ACTIVE' to catch double-entry
- [ ] Indexing: index ticket.spot_id for exit lookups
- [ ] Concurrency: row-level locking or atomic UPDATE...WHERE
      status='AVAILABLE' (compare-and-set) to avoid double-assignment

### 7. Trade-offs

- [ ] Best-fit vs nearest-fit spot assignment (waste vs UX vs compute)
- [ ] Push (Observer) vs poll for occupancy display (instant but
      coupled vs simple but laggy — resurfaces at HLD scale)
- [ ] Singleton vs DI ParkingLot (matches "one lot" vs testability)

### 8. Worked example

- [ ] Sequence diagram: Car arrives at EntryGate-2 -> ParkingLot asks
      Level 3 for a free COMPACT-or-larger spot via
      SpotAssignmentStrategy -> Level returns Spot 3-047 -> spot
      atomically flips OCCUPIED, Ticket T-1042 issued -> DisplayBoard
      notified, decrements count
- [ ] Continue the trace: 2 hours later, exit at ExitGate-1 -> ticket
      validated -> pricing computes fee -> payment recorded -> Spot
      flips AVAILABLE, Ticket closes -> DisplayBoard increments
- [ ] Shows the atomic-transition point from the state machine section
      concretely

### 9. Interview angle

- [ ] Follow-up: "How would you support advance reservation — how does
      that change the Spot state machine and assignment strategy?"
- [ ] Follow-up: "Two gates process entries at the same instant, both
      see the same spot free — walk through exactly how your code
      prevents double-assignment"
- [ ] Follow-up: "How would you add per-vehicle-type or time-of-day
      surge pricing without modifying Ticket or Gate?"

### 10. Practice & Self-Check

- [ ] Open challenge: "Extend the design to support handicapped and
      EV-charging spots, where an EV spot enforces a max stay duration
      and different pricing, and a handicapped spot requires a permit
      check at entry. Update class diagram, state machines, identify
      which pattern(s) absorb the change vs where a new one is needed,
      and where does this design break if untouched?" with rubric

## Completeness Pass Log

**`hld.mdx` — 2026-08-26.** Walked every item in the "HLD Checklist"
section above against the finished lesson; all checked off `[x]`,
nothing dropped. Notes:

- Problem framing, requirements, and the six-layer architecture diagram
  (edge -> ingestion gateway -> event log -> stream processors -> serving
  cache + geospatial index -> API/gateway, with the reservation service
  as a separate bounded context) all map directly to their checklist
  items.
- The capacity estimate works concrete numbers rather than asserting the
  scale figures: ~12,000 facilities / ~1.7M spots, ~380 state-change
  events/sec at peak vs. ~56,000 raw ingestion messages/sec once IoT
  heartbeat traffic is counted (explaining *why* the checklist's "tens
  of thousands of events/sec" figure is mostly liveness noise, not
  signal), and ~160,000 cache reads/sec on the search path — a ~400:1
  meaningful-read:write ratio.
- All four deep dives (partitioning, freshness/push-based cache updates,
  flaky-edge buffering+reconciliation, geospatial search fan-out) and
  all three trade-offs are covered as their own subsections, each naming
  its alternative explicitly per CONTENT-GUIDE.
- The worked example is a single sequence diagram interleaving the
  Seattle search trace and the Lot #4821 gate-event trace (per the
  checklist's two bullets), used to make the eventual-consistency
  trade-off concrete.
- Both interview-angle follow-ups (lot-offline reconciliation,
  reservation-vs-live-occupancy conflict) are answered directly, then
  pointed at the open challenge for full mechanics.
- The open design challenge uses the checklist's exact scenario
  (reservations layered on the eventually-consistent feed), with a
  concrete reference answer (`reserved_count` + `occupied_count`
  combined at read time, reservation retirement on gate-entry match, TTL
  expiry for no-shows) and a 5-item independently-checkable rubric
  feeding the `<Rubric>`/`<SelfScoreBand>` widgets.
- Nothing from the HLD checklist section was dropped. Concept-lesson
  links that don't exist yet (HLD-01, 03, 05, 06, 07, 10, 11) are
  explained inline instead, each flagged with an HTML
  `<!-- concept-dependency: ... -->` comment per the TRACKER.md ruling,
  so a future pass can swap in real links once those concept lessons are
  built.
- LLD checklist section is unaffected by this pass — left as-is for the
  LLD lesson's own completeness pass.
