# Parking Lot + Amazon Locker Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce `CHECKLIST.md` content plans for CS-03 (Parking Lot) and
CS-06 (Amazon Locker), in the same format as
[content/04-case-studies/ticketmaster/CHECKLIST.md](../../content/04-case-studies/ticketmaster/CHECKLIST.md) —
no `hld.mdx`/`lld.mdx` are built by this plan, per CLAUDE.md's
checklist-first workflow and priority build order (both systems stay at
their existing SYLLABUS.md priority; this plan produces their content
plans only).

**Architecture:** This is content authoring, not code — "tests" are
completeness checks against the embedded research (below), not
automated test runs. Both systems were already researched (WebSearch
against real sources — see each task's Sources list); this plan's job
is transcribing that research into the established checkbox format, not
researching further. The two tasks are fully independent (different
files, no shared state) and can run in parallel.

**Tech Stack:** Markdown only.

**Spec:** [docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)
(defines the checklist format — Ticketmaster's `CHECKLIST.md` is the
worked example both tasks below must match structurally) and
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../specs/2026-08-26-nextjs-mdx-app-migration-design.md)
(output format is `.mdx`, per the migration).

## Global Constraints

- Do not build `content/04-case-studies/parking-lot/hld.mdx`,
  `lld.mdx`, `content/04-case-studies/amazon-locker/hld.mdx`, or
  `lld.mdx` — checklists only.
- Do not flip either system's status in `SYLLABUS.md` or
  `content/04-case-studies/SYLLABUS.md` — a checklist is a plan, not a
  finished lesson (same rule as the Ticketmaster checklist plan).
- Match `content/04-case-studies/ticketmaster/CHECKLIST.md`'s structure
  exactly: title, a short intro paragraph with links to the spec and
  `SYLLABUS.md` files, a Status line, `## Problem Scope` (with
  `### Functional Requirements`, `### Non-Functional Requirements`,
  `### Explicitly Out of Scope` subsections), `## HLD Checklist
  (\`hld.mdx\`)` (numbered `### N. <name>` subsections 1-8, each with
  `- [ ]` items), `## LLD Checklist (\`lld.mdx\`)` (numbered `### N.
  <name>` subsections 1-10, each with `- [ ]` items), and a closing `##
  Completeness Pass Log` section. Read Ticketmaster's file before
  starting if you need the exact shape refreshed.
- Every checkbox must trace back to a specific bullet in that task's
  embedded research — don't invent scope, and don't merge/summarize
  multiple research bullets into one checkbox (mirrors how the
  Ticketmaster checklist was built).

---

### Task 1: Parking Lot `CHECKLIST.md` (CS-03)

**Files:**
- Create: `content/04-case-studies/parking-lot/CHECKLIST.md`

**Interfaces:**
- Consumes: the embedded research below (already vetted — no further
  research needed)
- Produces: nothing consumed by another task in this plan (Task 2 is
  independent)

- [ ] **Step 1: Create the directory**

```bash
mkdir -p content/04-case-studies/parking-lot
```

- [ ] **Step 2: Transcribe the research below into the checklist format**

Source research (WebSearch against hellointerview.com,
awesome-low-level-design (GitHub), algomaster.io, lldproblems.com,
GeeksforGeeks, and smart-parking IoT architecture writeups — full
source list at the end of this task):

> ## Problem Scope
>
> **One-line problem:** Design a system that manages vehicle entry, spot
> assignment, and fee collection for a parking facility (LLD), and,
> secondarily, a service that tracks and serves real-time spot
> availability across a network of many such facilities (HLD).
>
> **Functional requirements:**
> - Support multiple vehicle types (motorcycle, car/compact, large
>   vehicle/truck/bus) with type-to-spot compatibility rules
> - Automatically assign an available, compatible spot on entry
>   (system-assigned, not driver-chosen)
> - Issue a ticket at entry recording vehicle, spot, and entry timestamp
> - Validate the ticket at exit, compute the fee, and free the spot
> - Support multiple levels/floors, each with a configurable number of
>   spots of different sizes
> - Support multiple entry/exit gates operating concurrently
> - Reject entry when no compatible spot exists (lot/level full); reject
>   exit on invalid, already-used, or lost tickets
> - Track real-time occupancy/availability (per level and per lot)
>
> **Non-functional requirements:**
> - Concurrency: multiple gates issuing tickets and freeing spots
>   simultaneously must not double-assign a spot
> - Scale: a garage with ~5-10 levels and hundreds to a couple thousand
>   spots per lot; low single-digit transactions/sec per lot — a
>   deliberately small-scale problem, don't over-engineer for web-scale
> - Low latency for the entry/exit hot path
> - Data integrity: a ticket must map to exactly one active parking
>   session; no orphaned "occupied" spots
> - Availability: entry/exit should keep working even if non-critical
>   subsystems (e.g. a display board) are down
>
> **Explicitly out of scope:**
> - Physical hardware integration (gate arms, cameras, IoT sensors) —
>   mention conceptually only
> - Payment gateway integration details (pricing is a pluggable
>   strategy, not a full checkout flow)
> - Full advance-reservation/booking system — note as an extension
> - User accounts, authentication, mobile app UI
> - Detailed pricing/discount business rules beyond showing pricing is
>   pluggable
>
> ## LLD Outline (primary side)
>
> 1. **Problem framing** — the "Hello World" of LLD interviews;
>    interviewer expects clarifying questions first (vehicle types?
>    multi-level? multi-gate? pricing model? reservations in scope?)
>    before naming a class; set the boundary: single-facility object
>    model now, multi-location concerns deferred to HLD
> 2. **Requirements at the object level** — translate functional reqs
>    into nouns-that-need-behavior: ParkingLot, Level, Spot, Vehicle,
>    Ticket, Gate, Payment/Pricing; warn against turning every noun
>    into a class (e.g. "fee" is behavior, not an entity); decide
>    cardinalities (one ParkingLot -> many Levels -> many Spots; one
>    Ticket <-> one Vehicle <-> one Spot); decide the vehicle-to-spot
>    compatibility rule explicitly
> 3. **Class diagram** — ParkingLot (id, name, address, List\<Level\>,
>    List\<EntryGate\>, List\<ExitGate\>, owns parkVehicle()/
>    unparkVehicle()); Level/ParkingFloor (floor number, List\<Spot\>);
>    Spot (id, size/type enum MOTORCYCLE/COMPACT/LARGE, status, current
>    Vehicle ref); Vehicle (abstract base: license plate, size;
>    subclassed Motorcycle/Car/Truck-Bus); Ticket (id, Vehicle ref, Spot
>    ref, entry/exit timestamp, status); Gate (EntryGate issues ticket +
>    triggers assignment; ExitGate validates + triggers pricing +
>    release); Payment/PricingStrategy (computes fee from duration +
>    vehicle type); DisplayBoard (optional, subscribes to occupancy
>    changes); relationships: composition ParkingLot-Level-Spot,
>    association Ticket-Vehicle and Ticket-Spot, Gate depends on
>    ParkingLot's allocate/release ops, PricingStrategy/
>    SpotAssignmentStrategy injected not owned
> 4. **State machines** — Spot: AVAILABLE -> RESERVED(optional) ->
>    OCCUPIED -> AVAILABLE; Ticket: ISSUED(active) -> PAID/EXITED(closed),
>    with edge states LOST (flat penalty fee) and INVALID/ALREADY_USED
>    (rejected re-use); Spot+Ticket transitions must be atomic together
>    — a partial update is the classic bug interviewers probe for
> 5. **Design patterns** — Singleton (ParkingLot, one instance; note
>    testability/global-state trade-off, DI as alternative); Strategy
>    x2 (SpotAssignmentStrategy: nearest-first vs best-fit vs
>    level-balancing; PricingStrategy: flat/tiered/surge) — sources flag
>    this double-use as the key insight of the problem; Factory
>    (VehicleFactory/SpotFactory for subtype construction); Observer
>    (DisplayBoard subscribes to occupancy changes, bridges to HLD
>    side); State (optional advanced answer: Ticket lifecycle as formal
>    State pattern vs enum+if/else)
> 6. **Database design** — tables: parking_lot, level, spot(lot_id,
>    level_id, type, status), vehicle(plate, type), ticket(vehicle_id,
>    spot_id, entry_time, exit_time, status, amount_paid),
>    payment(ticket_id, method, amount, paid_at); normalize spot state
>    into spot.status (not derived by scanning tickets) for O(1)
>    "is anything free" checks; indexing: spot(level_id, type, status)
>    for the hot free-spot query, unique index on ticket.vehicle_id
>    WHERE status='ACTIVE' to catch double-entry, index ticket.spot_id
>    for exit lookups; concurrency: row-level locking or atomic
>    UPDATE...WHERE status='AVAILABLE' (compare-and-set) to avoid
>    double-assignment
> 7. **Trade-offs** — best-fit vs nearest-fit spot assignment (waste vs
>    UX vs compute); push(Observer) vs poll for occupancy display
>    (instant but coupled vs simple but laggy — resurfaces at HLD
>    scale); Singleton vs DI ParkingLot (matches "one lot" vs
>    testability)
> 8. **Worked example** — Car arrives at EntryGate-2 -> ParkingLot asks
>    Level 3 for a free COMPACT-or-larger spot via SpotAssignmentStrategy
>    -> Level returns Spot 3-047 -> spot atomically flips OCCUPIED,
>    Ticket T-1042 issued -> DisplayBoard notified, decrements count. 2
>    hours later: exit at ExitGate-1 -> ticket validated -> pricing
>    computes fee -> payment recorded -> Spot flips AVAILABLE, Ticket
>    closes -> DisplayBoard increments. Shows the atomic-transition
>    point from item 4 concretely
> 9. **Interview angle** — "How would you support advance reservation —
>    how does that change the Spot state machine and assignment
>    strategy?"; "Two gates process entries at the same instant, both
>    see the same spot free — walk through exactly how your code
>    prevents double-assignment"; "How would you add per-vehicle-type or
>    time-of-day surge pricing without modifying Ticket or Gate?"
> 10. **Practice & Self-Check** — Open challenge: "Extend the design to
>     support handicapped and EV-charging spots, where an EV spot
>     enforces a max stay duration and different pricing, and a
>     handicapped spot requires a permit check at entry. Update class
>     diagram, state machines, identify which pattern(s) absorb the
>     change vs where a new one is needed, and where does this design
>     break if untouched?"
>
> ## HLD Outline (secondary side) — multi-location network, distributed
> availability service
>
> 1. **Problem framing** — reframe at the scale of a parking network
>    operator (SpotHero/ParkWhiz-style): thousands of independent
>    facilities each with local inventory, needing real-time
>    availability + search/reservation for a mobile app; new core
>    problem: availability data originates at the edge and must be
>    aggregated/kept-fresh/served for geospatial queries at low latency
>    — a data-freshness-and-fan-out problem, not object modeling
> 2. **Requirements & capacity estimate** — geospatial search for nearby
>    available parking; near-real-time per-lot occupancy; optional
>    cross-lot reservation/booking; partner ingestion API; scale:
>    thousands of lots, aggregate event volume up to tens of thousands
>    of events/sec; read path far higher volume than write path,
>    sub-second read latency; consistency explicitly relaxed vs LLD:
>    stale-by-seconds availability display is acceptable, double-booking
>    money/reservations is not
> 3. **Core content — architecture diagram** — edge layer (per-lot gate
>    systems/IoT sensors publish state-change events to an ingestion
>    gateway, buffers locally, replays on reconnect); ingestion/
>    streaming layer (durable event log, Kafka-style, system of record
>    per lot); stream processors maintain current-state projections;
>    serving/cache layer (Redis-style, sub-100ms reads, source of truth
>    stays the event log + DB); geospatial index (geohash/quad-tree)
>    over lot locations; API/gateway layer (search/reservation/
>    partner-ingestion, load-balanced stateless services); reservation
>    service as a separate bounded context (strong consistency) from
>    live-occupancy (eventual consistency)
> 4. **Core content — deep dives** — data model & partitioning (shard by
>    lot_id/region; two distinct data shapes — high-write append-only
>    event stream vs low-write high-read aggregate/cache — get different
>    storage strategies); keeping availability fresh without hammering
>    the DB (push-based updates via event stream -> cache invalidation,
>    extends the LLD Observer pattern to network scale); handling flaky
>    edge connectivity (gateway-side buffering/replay + periodic
>    reconciliation job against the raw event log); search fan-out
>    (geospatial bounding-box/geohash-prefix lookup, then batch-fetch
>    availability from cache rather than joining the live stream per
>    request)
> 5. **Trade-offs** — strong consistency (reservations) vs eventual
>    consistency (live occupancy) — treating both as one model wastes
>    cost/latency on the read-heavy majority; cache/streaming projection
>    vs direct-DB query (ops complexity vs required for sub-second
>    search at scale); centralized ingestion (simple, single blast
>    radius) vs per-region ingestion clusters (resilient, lower-latency,
>    more aggregation complexity)
> 6. **Worked example** — user opens app in Seattle -> geosearch request
>    -> geospatial index returns 40 candidate lot IDs -> batch-read
>    current availability from cache -> ranked results under a second.
>    Meanwhile Lot #4821's gate reports a car entering -> event lands in
>    stream -> processor decrements count -> cache updated -> next
>    search reflects the new count within the propagation-delay SLA (a
>    few seconds) — illustrates the eventual-consistency trade-off
> 7. **Interview angle** — how does a lot going offline get reconciled;
>    how does the reservation service avoid conflicting with the
>    live-occupancy feed
> 8. **Practice & Self-Check** — Open challenge: "A partner wants advance
>    reservations that must never double-book a spot, layered on top of
>    the eventually-consistent live-occupancy feed. Sketch how the
>    reservation service coordinates with the live-occupancy aggregate
>    so a reserved-but-not-yet-occupied spot doesn't show as available
>    to search users, and doesn't get double-counted as occupied once
>    the driver arrives and the gate reports entry."

Follow Ticketmaster's `CHECKLIST.md` structure exactly: each numbered
item above becomes a `### N. <name>` subsection, and every sub-bullet
within it becomes its own `- [ ]` checkbox (do not merge or summarize —
mirror how the Ticketmaster checklist split its own bullets). The
Problem Scope's Functional/Non-Functional/Out-of-Scope bullets each
become their own checkbox too.

- [ ] **Step 3: Verify against the embedded research**

Re-read the research block above line by line and confirm every bullet
has a matching checkbox in your draft. Add anything missed.

- [ ] **Step 4: Add the Completeness Pass Log section**

```markdown
## Completeness Pass Log

Not yet run — fill in when `hld.mdx`/`lld.mdx` are built, per
CLAUDE.md's "After writing a lesson" rule.
```

- [ ] **Step 5: Add the file header**

At the top of the file, before `## Problem Scope`:

```markdown
# Parking Lot — Case Study Checklist

Content plan for `hld.mdx` and `lld.mdx`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: LLD not started (primary side), HLD not started (secondary
side). See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-03) for build
priority — this checklist is a plan, not a built lesson.
```

- [ ] **Step 6: Verify links resolve**

```bash
ls docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md
ls docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md
ls SYLLABUS.md
ls content/04-case-studies/SYLLABUS.md
```

All four must succeed (confirms the `../../../` and `../` relative paths
from `content/04-case-studies/parking-lot/CHECKLIST.md` are correct —
same depth as Ticketmaster's file).

- [ ] **Step 7: Commit**

```bash
git add content/04-case-studies/parking-lot/CHECKLIST.md
git commit -m "$(cat <<'EOF'
Add Parking Lot case study checklist (CS-03)

Content plan for hld.mdx and lld.mdx, researched against
hellointerview, awesome-low-level-design, algomaster, lldproblems,
GeeksforGeeks, and smart-parking IoT architecture writeups. Checklist
only -- HTML/MDX lessons are separate, later work per the priority
build order.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**Sources** (for reference/citation inside the file if useful, not a
step to execute):
https://www.hellointerview.com/learn/low-level-design/problem-breakdowns/parking-lot,
https://github.com/ashishps1/awesome-low-level-design/blob/main/problems/parking-lot.md,
https://algomaster.io/learn/lld/design-parking-lot,
https://www.lldproblems.com/problems/design-parking-lot,
https://www.geeksforgeeks.org/system-design/designing-parking-lot-garage-system-system-design/,
https://medium.com/double-pointer/system-design-interview-parking-lot-system-ff2c58167651,
https://www.educative.io/blog/frequently-asked-design-patterns-in-low-level-design-interviews,
https://medium.com/@vishal29saraswat/designing-a-real-time-smart-parking-system-with-kafka-mqtt-4e8c63c365ca,
https://www.researchgate.net/publication/356686488_Distributed_parking_management_architecture_based_on_multi-agent_systems,
https://www.mdpi.com/2079-9292/14/5/840

---

### Task 2: Amazon Locker `CHECKLIST.md` (CS-06)

**Files:**
- Create: `content/04-case-studies/amazon-locker/CHECKLIST.md`

**Interfaces:**
- Consumes: the embedded research below (already vetted — no further
  research needed)
- Produces: nothing consumed by another task in this plan (Task 1 is
  independent)

- [ ] **Step 1: Create the directory**

```bash
mkdir -p content/04-case-studies/amazon-locker
```

- [ ] **Step 2: Transcribe the research below into the checklist format**

Source research (WebSearch against hellointerview.com, algomaster.io,
educative.io, GitHub (adityavk/amazon-locker-design), OpenGenus,
systemdesignhandbook.com, and a Substack multithreaded-LLD writeup —
full source list at the end of this task):

> ## Problem Scope
>
> **One-line problem:** Design a self-service parcel locker system
> where a courier deposits a package into a size-matched, available
> compartment and a customer retrieves it later using a time-limited
> access code — at both single-station (LLD) and city-wide-network
> (HLD) level.
>
> **Functional requirements:**
> - Search for a locker station near a delivery address with capacity
>   for a given package size
> - Carrier deposits a package: system matches size to an available
>   compartment, assigns it, generates a unique access code/token
> - Customer notified (code + instructions) once deposited
> - Customer retrieves via code at touchscreen/app; correct code
>   unlocks the exact compartment and frees it afterward
> - Access codes expire after a fixed pickup window; expired codes
>   rejected
> - Staff/ops can force-open compartments with expired, unclaimed
>   packages
> - Returns flow: customer drops off a return package with a separate
>   drop-off code; locker enters "return-pending" state until carrier
>   pickup
> - Specific errors: invalid code, expired code, already-used code, no
>   matching-size compartment available
>
> **Non-functional requirements:**
> - One access token maps to exactly one package/compartment (1:1)
> - Strict size matching in the base design (small/medium/large,
>   sometimes XL/XXL) — no automatic fallback unless an extension
> - Pickup window: ~3 days standard, up to 7 days expedited, ~14 days
>   business accounts; 24h/48h reminder notifications
> - Returns dwell time longer than deliveries (~6 days vs ~2.5-3 days)
> - Package limits: up to ~19 inches per dimension, under ~35 lbs
> - Concurrency: no double-booking the same compartment; no two
>   couriers depositing into the same slot simultaneously
> - Must distinguish "expired" from "never existed" (keep expired
>   tokens mapped, don't delete)
> - At scale (HLD): 24/7 availability, offline-degraded mode, sub-100ms
>   availability-query latency, 2-3s unlock latency, >95% cache hit rate
>
> **Explicitly out of scope:**
> - Payment processing for locker rental/storage fees
> - Full user account/auth system — assume identity already established
> - Notification system internals in the base LLD (extension only)
> - Lockout-after-failed-attempts mechanism (extension only)
> - Route optimization for delivery agents, physical robotics/hardware
>   internals
>
> ## LLD Outline (primary side)
>
> 1. **Problem framing** — a single locker station (one
>    LockerLocation/LockerStation aggregate managing many compartments),
>    not the network; actors: courier (deposit), customer (pickup),
>    ops/staff (exceptions); frame as a resource-allocation-with-a-lease
>    problem — same shape as parking-lot/hotel-booking LLD, a good
>    comparison point for the interviewer
> 2. **Requirements at the object level** — Deposit: given package size,
>    find available matching compartment, mark occupied, generate
>    access token, return code or error. Pickup: given code, look up
>    token, validate not expired/used, unlock mapped compartment, free
>    it, invalidate token. Staff sweep: enumerate compartments with
>    expired tokens, open them. NFRs at object level: thread-safety per
>    compartment, O(1)-ish code lookup, extensibility for new
>    sizes/strategies
> 3. **Class diagram** — LockerLocation/LockerStation (aggregate root,
>    holds Compartments + accessTokenMapping\<code,AccessToken\> for
>    O(1) lookup); Compartment (id, size, status/occupied, owns its own
>    occupancy state — Information Expert pattern); Package (packageId,
>    size, tracking metadata, lifecycle state); AccessToken/AccessCode
>    (code, expiration, ref to Compartment, owns its own expiration
>    logic); Reservation (optional, between Customer/Order and Locker,
>    for "reserve before courier arrives"); Customer, Courier/
>    DeliveryAgent (actors); Order (links Customer + Item/Package list +
>    destination LockerLocation); LockerService (facade exposing
>    depositPackage()/pickup()/openExpiredCompartments()); relationships:
>    LockerLocation aggregates many Compartments (1-to-many), AccessToken
>    references exactly one Compartment/Package (1-to-1), Order composes
>    Items, Customer associated with Orders
> 4. **State machines** — Compartment: AVAILABLE -> RESERVED(optional)
>    -> OCCUPIED -> AVAILABLE on pickup, extension OUT_OF_SERVICE/
>    MAINTENANCE, HLD variant adds a RETURN_PENDING branch. Package:
>    IN_TRANSIT -> DEPOSITED/STORED -> PICKED_UP, alternate -> EXPIRED
>    -> RETURNED_TO_SENDER (or manual removal). AccessToken: ACTIVE ->
>    EXPIRED (time-based) or CONSUMED (on pickup) — key nuance: expired
>    token stays in the mapping (not deleted) so the system distinguishes
>    "expired" from "never existed" and openExpiredCompartments() can
>    enumerate it
> 5. **Design patterns** — State (Compartment status as explicit enum
>    AVAILABLE/RESERVED/OCCUPIED/OUT_OF_SERVICE, fits the state
>    machine); Strategy (compartment-assignment: exact-size-only vs
>    fallback vs best-fit; notification channel selection); Facade
>    (LockerService coordinator hides lock management and multi-step
>    workflows); Repository (abstracts persistence for Locker/Package/
>    Customer); Observer (customer notification on state changes — good
>    hook to mention even though full notification impl is out of base
>    scope); Factory/Builder (generateAccessToken() encapsulates token
>    creation + expiration calc); Two-Phase-Commit-style workflow
>    (reserveCompartment() + confirmDeposit() split, avoids a slot
>    marked occupied with nothing in it — worth naming as a technique
>    even though not a GoF pattern)
> 6. **Database design** — tables: locker_locations(location_id,
>    geo-coords, status), compartments(slot_id, location_id FK, size,
>    status), packages(package_id, compartment_id FK, customer_id FK,
>    status, timestamps), access_tokens(code, package_id FK, expiration,
>    used_at), access_log(actor, action, compartment_id, timestamp) for
>    audit/dispute resolution; indexing: compartments(location_id, size,
>    status) for "find available compartment of size X", access_tokens.
>    code (or hashed) for O(1) pickup lookup, packages(status,
>    expiration) for staff-sweep query; normalization: Compartment
>    occupancy as single source of truth (Information Expert argument
>    translated to schema); retention: keep expired-but-unclaimed rows
>    for a grace period (don't hard-delete) for staff sweeps/dispute
>    resolution
> 7. **Trade-offs** — occupancy tracking on Compartment itself (single
>    source of truth) vs centralized Set\<compartmentId\> in the
>    aggregate (simpler queries, drift risk); expired-token cleanup
>    timing (keep mapped until staff clears vs eager delete — distinction
>    vs simplicity); compartment lookup (O(n) linear scan, fine at
>    single-station scale, vs indexed available-queue per size — O(1)
>    but two structures to keep in sync); locking granularity
>    (per-compartment lock, concurrent ops, vs one lock for whole
>    aggregate, simpler but serializes); size-matching strictness
>    (strict exact-match, simple, vs fallback to larger compartment,
>    better utilization but complicates the "exact compartment class"
>    invariant)
> 8. **Worked example** — Courier deposits medium package -> system
>    finds available medium compartment, marks OCCUPIED, generates
>    6-digit code with 3-day expiration, notifies customer -> 2 days
>    later customer mistypes code (rejected, specific "invalid code"
>    error, no state change) -> retries with correct code (compartment
>    unlocks, Package->PICKED_UP, AccessToken consumed,
>    Compartment->AVAILABLE) -> contrast branch: customer never shows,
>    day 3 token flips EXPIRED (stays mapped), staff sweep via
>    openExpiredCompartments() unlocks it, compartment reset to
>    AVAILABLE. Exercises deposit, pickup, expiry, staff-override in one
>    flow
> 9. **Interview angle** — "What happens if two couriers try to deposit
>    into the same compartment at the same instant?" (concurrency/
>    locking); "How would you support package sizes that don't fit any
>    single compartment, or multiple packages in one order?" (Strategy
>    extensibility); "The customer lost their code — what do you do?"
>    (reissuable AccessToken vs deleted mapping)
> 10. **Practice & Self-Check** — Open challenge: "Extend the design to
>     support package returns: customer drops off a return item via a
>     separate drop-off flow, compartment enters RETURN_PENDING
>     (distinct from normal delivery occupancy so ops can tell
>     delivery-dwell from return-dwell), carrier later collects all
>     return-pending packages in one sweep. Which classes change, which
>     states/transitions get added to the state machine, does the
>     Strategy pattern need a second implementation for return-slot
>     assignment?"
>
> ## HLD Outline (secondary side)
>
> 1. **Problem framing** — zoom out to a city-wide/nationwide network of
>    thousands of locker stations: geo-discovery ("find a locker near me
>    with capacity"), coordinating reservations across an IoT-connected
>    fleet, staying available when individual lockers lose connectivity;
>    frame as "a distributed IoT + reservation system," not just the LLD
>    problem at bigger numbers
> 2. **Requirements & capacity estimate** — locker discovery by
>    geo-radius + size/capacity filter; atomic slot reservation
>    preventing double-booking across concurrent requests; deposit/
>    pickup at any of thousands of stations; device health/telemetry
>    monitoring; OTA firmware updates; returns coordination with carrier
>    pickup scheduling; scale: peak ~500,000 QPS on the
>    capacity-reservation path (scaled from ~2,000 QPS baseline);
>    <100ms availability-query latency; 2-3s unlock latency; >95% cache
>    hit rate; 24/7 with graceful offline degradation; compartment mix
>    ~40% small/35% medium/20% large/5% oversized; 30-150 compartments
>    per station; Prime Day-style events causing 10-20x volume spikes
> 3. **Core content — architecture diagram** — API Gateway/frontend
>    (customer app, delivery-agent app, in-station touchscreen) -> core
>    microservices: Locker Management Service (station/compartment
>    state+health), Capacity Reservation Service (hot path, matches
>    packages to compartments under heavy concurrency), Package Service
>    (lifecycle), Auth Service, Notification Service, Returns Service;
>    below: multi-level caching tier (in-process -> Redis/Memcached ->
>    pre-computed regional snapshots) in front of a geo-sharded DB layer
>    (Postgres transactional + InfluxDB-style time-series for
>    telemetry); separate IoT layer: each locker connects over MQTT
>    (async telemetry: heartbeat, door sensors, power, firmware version)
>    with a synchronous unlock-command path and TLS/X.509 device auth
> 4. **Core content — deep dives** — geo-discovery + atomic reservation
>    under contention (geo-hashing for radius queries, cached ranked
>    results, optimistic concurrency control with versioned conditional
>    updates, pre-allocated regional reservation queues at extreme
>    throughput); multi-level caching for the 500K QPS read path (L1
>    in-process <1ms TTL 5-10s -> L2 Redis 1-5ms write-through -> L3
>    pre-computed regional snapshots refreshed every 5-15s -> L4
>    geo-sharded Postgres source of truth); IoT offline resilience
>    (local cache of active pickup codes so pickup succeeds offline,
>    local retry queue with exponential backoff, reconciliation on
>    reconnect, battery backup 30-60min, fail-secure vs fail-open lock
>    hardware trade-off)
> 5. **Trade-offs** — consistency vs availability for locker state
>    (eventual: station keeps serving while offline, reconciles later
>    vs strong: blocks deposit until central confirms, safer but breaks
>    offline-tolerance); local code verification (offline pickups,
>    delayed revocation) vs centralized verification (safer,
>    connectivity-dependent); reservation aggressiveness (conservative
>    holds, guaranteed but lower utilization vs aggressive/probabilistic
>    release based on predicted dwell time, higher utilization but
>    conflict risk); precomputed regional snapshots (sustain 500K QPS,
>    seconds-stale) vs on-demand computation (fresh, can't hit
>    throughput without heavy caching anyway)
> 6. **Worked example** — customer app queries "lockers near me with a
>    medium slot" -> geo-hash lookup hits L3 snapshot cache (miss falls
>    to L2 Redis then L4 Postgres) -> customer reserves via Capacity
>    Reservation Service (optimistic-concurrency conditional update on
>    compartment row/version) -> courier arrives, station briefly
>    offline (cellular blip), but reservation was already synced to the
>    station's local cache pre-arrival so deposit succeeds locally,
>    telemetry queues confirmation -> central system reconciles once
>    reconnected, updates source-of-truth DB, invalidates stale cache
>    entries, fires customer notification. Exercises geo-discovery,
>    caching tiers, optimistic concurrency, offline-resilience in one
>    flow
> 7. **Interview angle** — "How do you prevent two customers from
>    reserving the same compartment at the same time across two
>    different app servers?" (optimistic concurrency vs naive locking);
>    "A locker station loses internet for an hour during a busy period —
>    what happens to in-flight pickups/deposits?" (offline-resilience
>    deep dive); "Prime Day causes a 15x spike in one metro area — where
>    does the system bend/break first, how do you protect it?" (caching
>    tiers, regional load balancing, queueing vs just adding servers)
> 8. **Practice & Self-Check** — Open challenge: "Extend the network-scale
>    design to support dynamic, demand-aware locker placement: given
>    historical utilization and dwell-time data per station, design a
>    subsystem that recommends where to add new locker capacity (or
>    reallocate compartment-size mix) in a city. What data would you
>    pipe from the Package/Reservation services into this subsystem, how
>    would you avoid it becoming a bottleneck on the hot reservation
>    path, and how does this connect to dwell-time prediction?"

Follow Ticketmaster's `CHECKLIST.md` structure exactly, same as Task 1:
each numbered item above becomes a `### N. <name>` subsection, each
sub-bullet becomes its own `- [ ]` checkbox — no merging or summarizing.

- [ ] **Step 3: Verify against the embedded research**

Re-read the research block above line by line and confirm every bullet
has a matching checkbox in your draft. Add anything missed.

- [ ] **Step 4: Add the Completeness Pass Log section**

```markdown
## Completeness Pass Log

Not yet run — fill in when `hld.mdx`/`lld.mdx` are built, per
CLAUDE.md's "After writing a lesson" rule.
```

- [ ] **Step 5: Add the file header**

At the top of the file, before `## Problem Scope`:

```markdown
# Amazon Locker — Case Study Checklist

Content plan for `hld.mdx` and `lld.mdx`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: LLD not started (primary side), HLD not started (secondary
side). See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-06) for build
priority — this checklist is a plan, not a built lesson.
```

- [ ] **Step 6: Verify links resolve**

```bash
ls docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md
ls docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md
ls SYLLABUS.md
ls content/04-case-studies/SYLLABUS.md
```

All four must succeed.

- [ ] **Step 7: Commit**

```bash
git add content/04-case-studies/amazon-locker/CHECKLIST.md
git commit -m "$(cat <<'EOF'
Add Amazon Locker case study checklist (CS-06)

Content plan for hld.mdx and lld.mdx, researched against
hellointerview, algomaster, educative, adityavk/amazon-locker-design
(GitHub), OpenGenus, and systemdesignhandbook.com. Checklist only --
HTML/MDX lessons are separate, later work per the priority build order.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

**Sources** (for reference/citation inside the file if useful, not a
step to execute):
https://www.hellointerview.com/learn/low-level-design/problem-breakdowns/amazon-locker,
https://algomaster.io/learn/lld/design-amazon-locker,
https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles/class-diagram-for-the-amazon-locker-service,
https://github.com/adityavk/amazon-locker-design,
https://iq.opengenus.org/system-design-of-amazon-hub-locker-service/,
https://www.systemdesignhandbook.com/guides/amazon-locker-system-design/,
https://programmingappliedai.substack.com/p/lld-design-amazon-lockermultithreaded
