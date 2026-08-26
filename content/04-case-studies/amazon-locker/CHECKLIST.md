# Amazon Locker — Case Study Checklist

Content plan for `hld.mdx` and `lld.mdx`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: LLD built (`lld.mdx`, primary side), HLD built (`hld.mdx`,
secondary side) — both drafted and verified. See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-06) for build
priority — this checklist is a plan, not a built lesson.

## Problem Scope

Design a self-service parcel locker system where a courier deposits a
package into a size-matched, available compartment and a customer
retrieves it later using a time-limited access code — at both
single-station (LLD) and city-wide-network (HLD) level.

### Functional Requirements

- [x] Search for a locker station near a delivery address with
      capacity for a given package size
- [x] Carrier deposits a package: system matches size to an available
      compartment, assigns it, generates a unique access code/token
- [x] Customer notified (code + instructions) once deposited
- [x] Customer retrieves via code at touchscreen/app; correct code
      unlocks the exact compartment and frees it afterward
- [x] Access codes expire after a fixed pickup window; expired codes
      rejected
- [x] Staff/ops can force-open compartments with expired, unclaimed
      packages
- [x] Returns flow: customer drops off a return package with a
      separate drop-off code; locker enters "return-pending" state
      until carrier pickup
- [x] Specific errors: invalid code, expired code, already-used code,
      no matching-size compartment available

### Non-Functional Requirements

- [x] One access token maps to exactly one package/compartment (1:1)
- [x] Strict size matching in the base design (small/medium/large,
      sometimes XL/XXL) — no automatic fallback unless an extension
- [x] Pickup window: ~3 days standard, up to 7 days expedited, ~14
      days business accounts; 24h/48h reminder notifications
- [x] Returns dwell time longer than deliveries (~6 days vs ~2.5-3
      days)
- [x] Package limits: up to ~19 inches per dimension, under ~35 lbs
- [x] Concurrency: no double-booking the same compartment; no two
      couriers depositing into the same slot simultaneously
- [x] Must distinguish "expired" from "never existed" (keep expired
      tokens mapped, don't delete)
- [x] At scale (HLD): 24/7 availability, offline-degraded mode,
      sub-100ms availability-query latency, 2-3s unlock latency, >95%
      cache hit rate

### Explicitly Out of Scope

- [x] Payment processing for locker rental/storage fees
- [x] Full user account/auth system — assume identity already
      established
- [x] Notification system internals in the base LLD (extension only)
- [x] Lockout-after-failed-attempts mechanism (extension only)
- [x] Route optimization for delivery agents, physical robotics/
      hardware internals

## HLD Checklist (`hld.mdx`) — secondary side

### 1. Problem framing

- [x] Zoom out to a city-wide/nationwide network of thousands of
      locker stations: geo-discovery ("find a locker near me with
      capacity"), coordinating reservations across an IoT-connected
      fleet, staying available when individual lockers lose
      connectivity
- [x] Frame as "a distributed IoT + reservation system," not just the
      LLD problem at bigger numbers

### 2. Requirements & capacity estimate

- [x] Locker discovery by geo-radius + size/capacity filter
- [x] Atomic slot reservation preventing double-booking across
      concurrent requests
- [x] Deposit/pickup at any of thousands of stations
- [x] Device health/telemetry monitoring
- [x] OTA firmware updates
- [x] Returns coordination with carrier pickup scheduling
- [x] Scale: peak ~500,000 QPS on the capacity-reservation path
      (scaled from ~2,000 QPS baseline)
- [x] <100ms availability-query latency
- [x] 2-3s unlock latency
- [x] >95% cache hit rate
- [x] 24/7 with graceful offline degradation
- [x] Compartment mix ~40% small/35% medium/20% large/5% oversized,
      30-150 compartments per station
- [x] Prime Day-style events causing 10-20x volume spikes

### 3. Core content — architecture diagram

- [x] API Gateway/frontend layer: customer app, delivery-agent app,
      in-station touchscreen
- [x] Core microservices: Locker Management Service (station/
      compartment state+health), Capacity Reservation Service (hot
      path, matches packages to compartments under heavy concurrency),
      Package Service (lifecycle), Auth Service, Notification Service,
      Returns Service
- [x] Multi-level caching tier (in-process -> Redis/Memcached ->
      pre-computed regional snapshots) in front of a geo-sharded DB
      layer (Postgres transactional + InfluxDB-style time-series for
      telemetry)
- [x] Separate IoT layer: each locker connects over MQTT (async
      telemetry: heartbeat, door sensors, power, firmware version)
      with a synchronous unlock-command path and TLS/X.509 device auth

### 4. Core content — deep dives

- [x] Geo-discovery + atomic reservation under contention:
      geo-hashing for radius queries, cached ranked results,
      optimistic concurrency control with versioned conditional
      updates, pre-allocated regional reservation queues at extreme
      throughput
- [x] Multi-level caching for the 500K QPS read path: L1 in-process
      <1ms TTL 5-10s -> L2 Redis 1-5ms write-through -> L3
      pre-computed regional snapshots refreshed every 5-15s -> L4
      geo-sharded Postgres source of truth
- [x] IoT offline resilience: local cache of active pickup codes so
      pickup succeeds offline, local retry queue with exponential
      backoff, reconciliation on reconnect, battery backup 30-60min,
      fail-secure vs fail-open lock hardware trade-off

### 5. Trade-offs

- [x] Consistency vs availability for locker state: eventual (station
      keeps serving while offline, reconciles later) vs strong
      (blocks deposit until central confirms, safer but breaks
      offline-tolerance)
- [x] Local code verification (offline pickups, delayed revocation) vs
      centralized verification (safer, connectivity-dependent)
- [x] Reservation aggressiveness: conservative holds, guaranteed but
      lower utilization vs aggressive/probabilistic release based on
      predicted dwell time, higher utilization but conflict risk
- [x] Precomputed regional snapshots (sustain 500K QPS, seconds-stale)
      vs on-demand computation (fresh, can't hit throughput without
      heavy caching anyway)

### 6. Worked example

- [x] Trace: customer app queries "lockers near me with a medium
      slot" -> geo-hash lookup hits L3 snapshot cache (miss falls to
      L2 Redis then L4 Postgres)
- [x] Continue trace: customer reserves via Capacity Reservation
      Service (optimistic-concurrency conditional update on
      compartment row/version)
- [x] Continue trace: courier arrives, station briefly offline
      (cellular blip), but reservation was already synced to the
      station's local cache pre-arrival so deposit succeeds locally,
      telemetry queues confirmation
- [x] Continue trace: central system reconciles once reconnected,
      updates source-of-truth DB, invalidates stale cache entries,
      fires customer notification
- [x] Exercises geo-discovery, caching tiers, optimistic concurrency,
      offline-resilience in one flow

### 7. Interview angle

- [x] Follow-up: "How do you prevent two customers from reserving the
      same compartment at the same time across two different app
      servers?" (optimistic concurrency vs naive locking)
- [x] Follow-up: "A locker station loses internet for an hour during a
      busy period — what happens to in-flight pickups/deposits?"
      (offline-resilience deep dive)
- [x] Follow-up: "Prime Day causes a 15x spike in one metro area —
      where does the system bend/break first, how do you protect it?"
      (caching tiers, regional load balancing, queueing vs just adding
      servers)

### 8. Practice & Self-Check

- [x] Open challenge: "Extend the network-scale design to support
      dynamic, demand-aware locker placement: given historical
      utilization and dwell-time data per station, design a subsystem
      that recommends where to add new locker capacity (or reallocate
      compartment-size mix) in a city. What data would you pipe from
      the Package/Reservation services into this subsystem, how would
      you avoid it becoming a bottleneck on the hot reservation path,
      and how does this connect to dwell-time prediction?" with rubric

## LLD Checklist (`lld.mdx`) — primary side

### 1. Problem framing

- [x] Frame the problem as a single locker station (one
      LockerLocation/LockerStation aggregate managing many
      compartments), not the network
- [x] Actors: courier (deposit), customer (pickup), ops/staff
      (exceptions)
- [x] Frame as a resource-allocation-with-a-lease problem — same shape
      as parking-lot/hotel-booking LLD, a good comparison point for
      the interviewer

### 2. Requirements at the object level

- [x] Deposit operation: given package size, find available matching
      compartment, mark occupied, generate access token, return code
      or error
- [x] Pickup operation: given code, look up token, validate not
      expired/used, unlock mapped compartment, free it, invalidate
      token
- [x] Staff sweep operation: enumerate compartments with expired
      tokens, open them
- [x] NFRs at the object level: thread-safety per compartment,
      O(1)-ish code lookup, extensibility for new sizes/strategies

### 3. Class diagram

- [x] Mermaid class diagram (`classDiagram`) covering
      LockerLocation/LockerStation (aggregate root, holds Compartments
      + accessTokenMapping\<code,AccessToken\> for O(1) lookup)
- [x] Compartment (id, size, status/occupied, owns its own occupancy
      state — Information Expert pattern)
- [x] Package (packageId, size, tracking metadata, lifecycle state)
- [x] AccessToken/AccessCode (code, expiration, ref to Compartment,
      owns its own expiration logic)
- [x] Reservation (optional, between Customer/Order and Locker, for
      "reserve before courier arrives")
- [x] Customer, Courier/DeliveryAgent (actors)
- [x] Order (links Customer + Item/Package list + destination
      LockerLocation)
- [x] LockerService (facade exposing depositPackage()/pickup()/
      openExpiredCompartments())
- [x] Relationships: LockerLocation aggregates many Compartments
      (1-to-many), AccessToken references exactly one
      Compartment/Package (1-to-1), Order composes Items, Customer
      associated with Orders

### 4. State machines

- [x] Compartment state machine: AVAILABLE -> RESERVED(optional) ->
      OCCUPIED -> AVAILABLE on pickup, extension
      OUT_OF_SERVICE/MAINTENANCE, HLD variant adds a RETURN_PENDING
      branch
- [x] Package state machine: IN_TRANSIT -> DEPOSITED/STORED ->
      PICKED_UP, alternate -> EXPIRED -> RETURNED_TO_SENDER (or manual
      removal)
- [x] AccessToken state machine: ACTIVE -> EXPIRED (time-based) or
      CONSUMED (on pickup)
- [x] Key nuance: expired token stays in the mapping (not deleted) so
      the system distinguishes "expired" from "never existed" and
      openExpiredCompartments() can enumerate it

### 5. Design patterns

- [x] State (Compartment status as explicit enum
      AVAILABLE/RESERVED/OCCUPIED/OUT_OF_SERVICE, fits the state
      machine)
- [x] Strategy (compartment-assignment: exact-size-only vs fallback vs
      best-fit; notification channel selection)
- [x] Facade (LockerService coordinator hides lock management and
      multi-step workflows)
- [x] Repository (abstracts persistence for Locker/Package/Customer)
- [x] Observer (customer notification on state changes — good hook to
      mention even though full notification impl is out of base
      scope)
- [x] Factory/Builder (generateAccessToken() encapsulates token
      creation + expiration calc)
- [x] Two-Phase-Commit-style workflow (reserveCompartment() +
      confirmDeposit() split, avoids a slot marked occupied with
      nothing in it — worth naming as a technique even though not a
      GoF pattern)

### 6. Database design

- [x] Tables: locker_locations(location_id, geo-coords, status),
      compartments(slot_id, location_id FK, size, status),
      packages(package_id, compartment_id FK, customer_id FK, status,
      timestamps), access_tokens(code, package_id FK, expiration,
      used_at), access_log(actor, action, compartment_id, timestamp)
      for audit/dispute resolution
- [x] Indexing: compartments(location_id, size, status) for "find
      available compartment of size X"
- [x] Indexing: access_tokens.code (or hashed) for O(1) pickup lookup
- [x] Indexing: packages(status, expiration) for staff-sweep query
- [x] Normalization: Compartment occupancy as single source of truth
      (Information Expert argument translated to schema)
- [x] Retention: keep expired-but-unclaimed rows for a grace period
      (don't hard-delete) for staff sweeps/dispute resolution

### 7. Trade-offs

- [x] Occupancy tracking on Compartment itself (single source of
      truth) vs centralized Set\<compartmentId\> in the aggregate
      (simpler queries, drift risk)
- [x] Expired-token cleanup timing: keep mapped until staff clears vs
      eager delete — distinction vs simplicity
- [x] Compartment lookup: O(n) linear scan, fine at single-station
      scale, vs indexed available-queue per size — O(1) but two
      structures to keep in sync
- [x] Locking granularity: per-compartment lock, concurrent ops, vs
      one lock for whole aggregate, simpler but serializes
- [x] Size-matching strictness: strict exact-match, simple, vs
      fallback to larger compartment, better utilization but
      complicates the "exact compartment class" invariant

### 8. Worked example

- [x] Sequence diagram: courier deposits medium package -> system
      finds available medium compartment, marks OCCUPIED, generates
      6-digit code with 3-day expiration, notifies customer
- [x] Continue trace: 2 days later customer mistypes code (rejected,
      specific "invalid code" error, no state change)
- [x] Continue trace: retries with correct code (compartment unlocks,
      Package->PICKED_UP, AccessToken consumed,
      Compartment->AVAILABLE)
- [x] Contrast branch: customer never shows, day 3 token flips
      EXPIRED (stays mapped), staff sweep via
      openExpiredCompartments() unlocks it, compartment reset to
      AVAILABLE
- [x] Exercises deposit, pickup, expiry, staff-override in one flow

### 9. Interview angle

- [x] Follow-up: "What happens if two couriers try to deposit into the
      same compartment at the same instant?" (concurrency/locking)
- [x] Follow-up: "How would you support package sizes that don't fit
      any single compartment, or multiple packages in one order?"
      (Strategy extensibility)
- [x] Follow-up: "The customer lost their code — what do you do?"
      (reissuable AccessToken vs deleted mapping)

### 10. Practice & Self-Check

- [x] Open challenge: "Extend the design to support package returns:
      customer drops off a return item via a separate drop-off flow,
      compartment enters RETURN_PENDING (distinct from normal
      delivery occupancy so ops can tell delivery-dwell from
      return-dwell), carrier later collects all return-pending
      packages in one sweep. Which classes change, which
      states/transitions get added to the state machine, does the
      Strategy pattern need a second implementation for return-slot
      assignment?" with rubric

## Completeness Pass Log

**`hld.mdx` — 2026-08-26 (controller pass).** Walked every item in the
"HLD Checklist" section above against the finished lesson; all checked
off `[x]`, nothing dropped. Notes:

- Problem framing explicitly rejects "the LLD problem at bigger numbers"
  and reframes into the three checklist axes (geo-discovery, coordinated
  reservation, fleet-wide connectivity), opening with a link back to the
  LLD lesson.
- Requirements & capacity estimate lists every functional/non-functional
  item from the checklist verbatim (including OTA firmware updates and
  returns coordination, easy to drop) and, notably, *derives* the
  500,000 QPS figure via back-of-envelope math (2,000 events/sec baseline
  x ~15x read amplification x ~17x Prime-Day spike ≈ 500K) rather than
  just asserting the checklist's number — stronger than the checklist
  technically required.
- Architecture diagram: one `graph TD` covers the client layer (customer
  app, agent app, kiosk), all 6 named microservices, the 3-tier cache,
  the geo-sharded Postgres + time-series data layer, and a separate IoT
  channel (MQTT telemetry + TLS/X.509-authenticated unlock path) —
  every checklist element present and labeled on its edges.
- Deep dives: all 3 covered as their own subsections — geo-discovery +
  OCC reservation (with regional reservation queues for extreme
  throughput), the 4-tier cache with the checklist's exact latency/TTL
  figures per tier, and IoT offline resilience (local code cache, retry
  queue with backoff, reconciliation, 30-60min battery backup,
  fail-secure vs. fail-open explained as a genuine two-sided trade-off
  rather than a single "right" answer).
- Trade-offs: all 4 covered, each naming its alternative explicitly
  (eventual vs. strong consistency, local vs. centralized verification,
  conservative vs. probabilistic reservation release, precomputed
  snapshots vs. on-demand computation).
- Worked example: one sequence diagram traces all 4 checklist beats in
  order (geo lookup falling through the cache tiers, OCC reservation,
  offline deposit against a pre-synced local cache, reconcile +
  invalidate + notify), with prose afterward calling out two easy-to-miss
  details (reservation synced *before* the courier arrives; explicit
  cache invalidation rather than waiting for TTL).
- Interview angle: all 3 follow-ups answered with a specific mechanism,
  not just restated.
- Practice & Self-Check: 8 recap `QuizItem`s (plus 2 inline ones after
  major concepts) mixing recall/why/scenario questions, and the
  checklist's exact open-challenge scenario (demand-aware locker
  placement) with a concrete reference answer (a Placement Recommendation
  Service consuming an async event stream, isolated from the reservation
  hot path) inside a collapsible `<details>` and a 6-item `Rubric`.

Verified rendering at `/case-studies/amazon-locker/hld` via `pnpm dev` +
Playwright, by the controller: page renders with no console errors, both
`graph` architecture diagrams and the `sequenceDiagram` render as SVG.

**`lld.mdx` — built 2026-08-26.** Every item in the "LLD Checklist
(`lld.mdx`) — primary side" section above is ticked and covered
directly in the finished lesson:

- Problem framing, object-level requirements, and NFRs: covered in the
  "Problem framing" and "Requirements at the object level" sections.
- Class diagram: one `classDiagram` covers all nine required
  elements/relationships (LockerLocation aggregate root with a
  `tokensByCode` map, Compartment, Package, AccessToken, Reservation,
  Customer, DeliveryAgent, Order, LockerService), with the
  Information-Expert and composition-vs-association reasoning called
  out in prose since LLD-01/LLD-02 aren't built yet (marked with
  `concept-dependency` comments in the MDX).
- State machines: three `stateDiagram-v2` diagrams (Compartment,
  Package, AccessToken), each showing every back-edge, plus the
  expired-token-stays-mapped nuance called out explicitly in both prose
  and an inline quiz. The Compartment diagram intentionally omits the
  RETURN_PENDING branch — per the checklist wording, that branch is the
  HLD variant, not part of this LLD's base design; RETURN_PENDING is
  introduced instead in the closing open design challenge, which is
  where the checklist's own returns extension lives.
- Design patterns: all seven items (State, Strategy, Facade,
  Repository, Observer, Factory, and the two-phase-commit-style
  reserve/confirm split) covered as a dedicated subsection, each tied
  to a specific method/field in this design rather than described
  abstractly.
- Database design: all five tables, all three required indexes,
  normalization, and retention policy covered, with an `erDiagram` plus
  prose explaining the indexing rationale per query.
- Trade-offs: all five pairs covered, each naming both the chosen
  option and the explicit alternative.
- Worked example: two sequence diagrams (deposit/wrong-code/pickup, and
  expiry/staff-sweep) trace every checklist beat — deposit, mistyped
  code with no state change, correct pickup, and the day-3 expiry +
  staff sweep — connected by prose rather than crammed into one
  diagram, per CONTENT-GUIDE's "one diagram, one concern" rule.
- Interview angle: all three follow-ups answered with a concrete
  mechanism, not just named.
- Practice & Self-Check: 8 recap `QuizItem`s (plus 4 inline ones after
  major concepts, 12 total) mixing recall/why/scenario questions per
  CONTENT-GUIDE, the exact returns-extension open challenge from the
  checklist with a collapsible reference answer, and a 6-item `Rubric`
  (auto-computing the Novice/Practicing/Interview-ready self-score
  band).

Nothing from the LLD checklist section was dropped. (HLD's own
completeness pass is logged separately above, once `hld.mdx` was built.)
