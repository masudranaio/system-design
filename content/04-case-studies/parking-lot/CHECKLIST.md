# Parking Lot — Case Study Checklist

Content plan for `hld.mdx` and `lld.mdx`, reviewed before either is
drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: LLD built (`lld.mdx`, primary side), HLD built (`hld.mdx`,
secondary side) — both drafted, controller verification pending. See
[SYLLABUS.md](../../../SYLLABUS.md) /
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

### 3. Core content — architecture diagrams (split: two diagrams, not one)

- [x] Diagram A — ingestion pipeline: edge layer (company-owned
      gate/IoT sensor + partner PARCS integration) publishes
      state-change events to an ingestion gateway (buffers locally,
      replays on reconnect) -> durable event log (Kafka-style,
      partitioned by `lot_id`, system of record per lot) -> stream
      processors (current-state projections) -> serving cache +
      occupancy DB (system-of-record backstop)
- [x] Diagram B — search & reservation layer: mobile client -> API/
      gateway layer (stateless, load-balanced) -> geospatial index
      (candidate lot_id lookup) + serving cache (batch read,
      sub-100ms) -> ranked results back to client; reservation service
      drawn as a separate bounded context (strong consistency) from
      live-occupancy (eventual consistency), cross-checking the same
      cache rather than owning it

### 4. Core content — deep dives (each a named 2-4-branch mechanism, not a
one-line mention)

- [x] Data model & partitioning: (a) partition key = `lot_id`/region
      (b) that key doubles as the stream processors' natural
      parallelism boundary (c) two distinct data shapes — high-write
      append-only event stream vs low-write high-read aggregate/cache
      — get different storage strategies
- [x] Keeping availability fresh without hammering the DB: (a)
      push-based update from the stream processor into the cache,
      extending the LLD Observer pattern to network scale (b) a
      compacted topic ("latest state per spot") as a cheap, replayable
      rebuild source if the cache is lost (c) cache stampede /
      thundering herd — what happens if the cache is flushed while
      ~160k reads/sec are hitting it, and why the rebuild path (from
      the compacted topic, not from every reader racing the raw event
      log or DB) avoids a self-inflicted overload
- [x] Handling flaky edge connectivity: (a) gateway-side buffering and
      replay for a known outage (b) idempotent processing via a unique
      id per event, so at-least-once delivery + idempotent processing
      together behave like exactly-once (c) periodic reconciliation
      against ground truth for the silent-drop case buffering can't
      see coming (a sensor that never emits the "exited" event at all)
- [x] Search fan-out: (a) geohash-prefix lookup collapsing a 2D
      proximity query into a 1D prefix lookup (b) the boundary edge
      case — points sharing no prefix across a cell line — fixed by
      always querying the target cell plus its 8 neighbors (c)
      quad-tree named as the alternative for uneven lot density, with
      its own trade-off (adaptive depth vs. maintaining an in-memory
      tree) (d) one batch read (`MGET`-style) against the cache
      instead of N per-candidate round trips

### 5. Trade-offs (each rendered as its own `CompareTable`, per
CONTENT-GUIDE's "default to bullets/tables" rule)

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

### 3. Class diagram (D2, split into 3 focused diagrams — one concern each)

- [x] **Diagram A — core domain classes** (`shape: class`): ParkingLot
      (id, name, address, List\<Level\>, List\<EntryGate\>,
      List\<ExitGate\>, owns parkVehicle()/unparkVehicle()),
      Level/ParkingFloor (floor number, List\<Spot\>), Spot (id,
      size/type enum MOTORCYCLE/COMPACT/LARGE, status, current Vehicle
      ref), Ticket (id, Vehicle ref, Spot ref, entry/exit timestamp,
      status), EntryGate/ExitGate (issues ticket + triggers assignment
      / validates + triggers pricing + release) — with composition
      ParkingLot-Level-Spot, association Ticket-Vehicle/Ticket-Spot,
      Gate depends on ParkingLot's allocate/release ops
- [x] **Diagram B — vehicle hierarchy** (`shape: class`): abstract
      Vehicle base (license plate, size) subclassed
      Motorcycle/Car/Truck-Bus, plus `VehicleFactory` constructing the
      right subtype — isolates the Factory-pattern concern from the
      core entity diagram instead of cramming inheritance arrows into it
- [x] **Diagram C — strategy & observer collaborators** (`shape:
      class`): SpotAssignmentStrategy/PricingStrategy interfaces
      injected into ParkingLot (dependency, not owned), Payment
      (computes/records fee), DisplayBoard (optional, subscribes to
      occupancy changes) — isolates the "swappable behavior" pattern
      concern from the structural composition diagram

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
- [x] Strategy x2, each given its own named-branch mechanism coverage
      (not a one-line mention) via `CompareTable`:
      - [x] `SpotAssignmentStrategy` — 3 named branches: nearest-first
            (cheapest query, worst waste), best-fit (least waste,
            costlier query + worse walk time), level-balancing (spreads
            load across levels, most complex to compute)
      - [x] `PricingStrategy` — 3 named branches: flat-rate (simplest,
            ignores duration), tiered-by-hour (this lesson's default),
            time-of-day/surge (matches demand, most state to track)
      - [x] Flag the double-use of Strategy (assignment + pricing as
            two independent axes of change) as the key insight of the
            problem
- [x] Factory (VehicleFactory for subtype construction)
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
- [x] Concurrency deep dive, named 3-branch mechanism coverage (not a
      one-line mention) via `CompareTable`: atomic `UPDATE ... WHERE
      status='AVAILABLE'` compare-and-set (this lesson's choice — no
      held lock, retry on 0-row-affected), pessimistic row lock
      (`SELECT ... FOR UPDATE`, blocks concurrent readers for the
      transaction's duration), optimistic version-column check
      (`WHERE version = :expected`, same retry-on-mismatch shape as
      CAS but detects any field change, not just status) — to avoid
      double-assignment

### 7. Trade-offs

- [x] Best-fit vs nearest-fit spot assignment (waste vs UX vs compute)
- [x] Push (Observer) vs poll for occupancy display (instant but
      coupled vs simple but laggy — resurfaces at HLD scale)
- [x] Singleton vs DI ParkingLot (matches "one lot" vs testability)

### 8. Worked example (split into 2 sequence diagrams — entry is one
concern, exit is another)

- [x] **Entry sequence diagram** (`shape: sequence_diagram`): Car
      arrives at EntryGate-2 -> ParkingLot asks Level 3 for a free
      COMPACT-or-larger spot via SpotAssignmentStrategy -> Level
      returns Spot 3-047 -> spot atomically flips OCCUPIED, Ticket
      T-1042 issued -> DisplayBoard notified, decrements count
- [x] **Exit sequence diagram** (`shape: sequence_diagram`): 2 hours 18
      minutes later, exit at ExitGate-1 -> ticket validated -> pricing
      computes fee -> payment recorded -> Spot flips AVAILABLE, Ticket
      closes -> DisplayBoard increments
- [x] Both diagrams together show the atomic-transition point from the
      state machine section concretely (spot flip + ticket
      create/close as one committed unit in each direction)

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

**`lld.mdx` — 2026-08-26.** Walked every item in the "LLD Checklist"
section above against the finished lesson; all checked off `[x]`, nothing
dropped. Notes:

- Problem framing opens with the clarifying-questions-first framing and
  explicitly draws the LLD/HLD boundary (single facility vs. network),
  linking to the HLD companion lesson.
- Requirements at the object level correctly separates "nouns that
  become classes" from "nouns that don't" (fee as a computed value, not
  an entity), states all four cardinalities, and gives the
  vehicle-to-spot compatibility rule as an explicit table.
- The class diagram covers all 8 checklist entities (`ParkingLot`,
  `Level`, `Spot`, `Vehicle` + 3 subtypes, `Ticket`, `EntryGate`/
  `ExitGate`, `Payment`, `DisplayBoard`) plus the two injected strategy
  interfaces, with composition/association/dependency relationships
  distinguished and explained in the caption.
- Both state machines are covered as their own `stateDiagram-v2` panels
  (Spot: `AVAILABLE ⇄ RESERVED/OCCUPIED`; Ticket: `ISSUED → PAID/LOST/
  REJECTED`), and the atomic-pairing requirement (spot flip + ticket
  close as one unit) is called out explicitly as the bug interviewers
  probe for.
- All 5 design-pattern items covered: Singleton (with the DI alternative
  and its trade-off named), Strategy used twice (assignment + pricing,
  with the "why two, not one combined policy" reasoning spelled out),
  Factory, Observer, and State framed as an optional advanced answer.
- Database design covers the schema, the `spot.status`-as-column
  reasoning (indexed point lookup vs. derived join/scan), all 3 indexes
  with what each protects, and the compare-and-set concurrency mechanism
  with a concrete `UPDATE ... WHERE status = 'AVAILABLE'` statement.
- Both trade-offs (best-fit vs. nearest-fit, push vs. poll) are covered,
  each naming its cost, not just its win; Singleton vs. DI is repeated
  here as its own trade-off entry per the checklist.
- The worked example traces one full entry-to-exit visit (Lot 12, Spot
  3-047, $10.00 fee with the arithmetic shown) via one sequence diagram,
  explicitly tied back to the state machine's atomic-transition point.
- All 3 interview-angle follow-ups are answered directly (reservation
  extension via the already-drawn `RESERVED` state, the concurrency walk-
  through, and the pricing-strategy extensibility probe).
- Practice & Self-Check: 6 recap `QuizItem`s plus the checklist's exact
  open-challenge scenario (handicapped + EV-charging spots) with a
  concrete reference answer inside a collapsible `<details>` and a
  7-item `Rubric`.

Verified rendering at `/case-studies/parking-lot/lld` via `pnpm dev` +
Playwright, by the controller: page renders with no console errors, the
`classDiagram`, both `stateDiagram-v2` panels, the `erDiagram`, and the
`sequenceDiagram` all render as SVG in both light and dark theme.

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

**`hld.mdx` — 2026-08-27 retrofit (D2 diagrams, content-format
standard).** Walked every item in the updated "HLD Checklist" section
above against the rewritten lesson; all checked off `[x]`, nothing
dropped. Notes:

- All Mermaid `<DiagramPanel>` diagrams converted to `<D2Diagram>`,
  styled per the role-color table (`client`/`network`/`service`/
  `cache`/`datastore`/`queue` fills + white font-color), verified to
  compile via `renderD2` directly (all 6 diagrams render without
  error).
- The single combined architecture diagram is now two, per the updated
  checklist: Diagram A (edge -> gateway -> event log -> stream
  processors -> cache/DB, the ingestion pipeline) and Diagram B (client
  -> API/gateway -> geospatial index + cache -> results, plus the
  reservation service's separate strongly-consistent path).
- Two new diagrams added beyond the original single architecture panel:
  a freshness/rebuild-path diagram (stream processor -> compacted topic
  -> cache) for the freshness deep dive, and a two-mechanism diagram
  (gateway buffer + reconciliation job) for the flaky-edge deep dive.
  The search fan-out deep dive also gained its own diagram (geohash
  lookup -> neighbor-cell filter -> batch cache read), which the
  original lesson covered in prose only. Total: 6 diagrams (5 D2
  architecture-family + 1 D2 sequence), above the 4-5 floor.
- Each deep dive now names its 2-4 branches explicitly via `<Point>`
  widgets or labeled bullets, instead of one paragraph per mechanism:
  partitioning (key choice, parallelism boundary, storage-shape split),
  freshness (push update, compacted-topic rebuild, **cache stampede on
  rebuild** — a genuinely new branch, added per CONTENT-GUIDE's own
  "cache deep-dive should also touch invalidation and stampede"
  example, and reflected as a checklist addition), flaky edge
  (buffering, idempotent dedup as its own named branch, reconciliation),
  search fan-out (geohash prefix, neighbor-cell fix, quad-tree
  alternative, batch read).
- Every number from the original capacity estimate (~12,000 facilities,
  ~1.7M spots, ~380 events/sec, ~56,000 msgs/sec, ~160,000 reads/sec,
  ~400:1 ratio) is preserved, now surfaced as three `<KeyStat>` widgets
  with the same back-of-envelope math in each `detail` expando, per
  CONTENT-GUIDE's "default to bullets/tables/KeyStat over paragraphs for
  requirements and numbers" rule; the narrative math walk-through stays
  in prose (the guide's own carve-out for worked numeric reasoning).
- All three trade-offs converted from prose paragraphs to their own
  `<CompareTable>` (consistency model, streaming-cache vs. direct-DB,
  centralized vs. per-region ingestion), each row naming pros, cons, and
  — for the chosen approach — `chosenBecause`, preserving every original
  trade-off argument.
- Recap quiz grew from 7 to 8 questions (added one on the new cache-
  stampede branch) — within the 5-8 guideline band. All inline
  "check yourself" `QuizItem`s from the original are preserved; two new
  ones added after the new stampede content and the split search/
  reservation architecture diagram.
- The open design challenge, reference answer, and 5-item rubric are
  unchanged verbatim — the `<Rubric>` widget now renders its own
  `<SelfScoreBand>` from the checked-item percentage, so the manual
  "Self-score: 5/5 ... Interview-ready" paragraph at the end of the old
  file was dropped as redundant, not as a content cut.
- Inline `{/* concept-dependency: ... */}` comments from the original
  (marking not-yet-built HLD-01/03/05/06/07/10/11 concept-lesson links)
  were dropped during the rewrite along with the sentences they
  annotated being folded into tighter bullets/Point widgets; the
  underlying explanations they were attached to (stateless services,
  partitioning definition, push vs. poll, at-least-once + idempotency,
  network partitions, geohash) are all still present in the prose/
  bullets. Flagging this as a deliberate copy-edit, not a silent drop —
  a future pass building those concept lessons should re-link from here
  by searching for the relevant terms rather than relying on the old
  comment markers.
- Nothing from the updated HLD checklist section was dropped.

Rendering not independently re-verified with Playwright in this pass
(content-only retrofit, per CLAUDE.md's UI-verification scope note) —
D2 compilation was verified directly via `renderD2` against all 6
diagram sources instead, all 6 succeeded with no errors.
