# Food Panda — Case Study Checklist

Content plan for `hld.mdx` (primary side), reviewed before drafting. CS-11
in [SYLLABUS.md](../SYLLABUS.md) — primary angle HLD: real-time
order-to-delivery matching, live tracking, ETA prediction. `lld.mdx`
(order/restaurant/courier state machine, matching-algorithm class design)
is secondary — deferred, added opportunistically per the priority order.

Dependencies: HLD-01, 03, 06, 08, 10; LLD-01–06. None of these concept
lessons exist yet — every needed concept is explained inline in `hld.mdx`,
each flagged with a `{/* concept-dependency: HLD-XX not yet built,
explained inline */}` comment for a future pass to convert to a real link,
per the ruling in `docs/superpowers/plans/TRACKER.md`.

**Relationship to sibling case studies** (both in this same repo — apply,
don't re-derive):

- **Ride-Sharing (CS-09)** owns the deep dive on courier/driver geo-matching:
  geohash/quadtree proximity search, driver-supply modeling, surge pricing
  mechanics. Food Panda's matching section should name the same
  nearest-courier search primitive and link to it, then spend its own
  budget on what's genuinely different — an order has a *production step*
  (the kitchen) the rider-matching problem doesn't have, and a single
  courier can carry multiple orders at once (batching), which trip-based
  ride-matching doesn't do.
- **Ticketmaster (CS-08)** owns the deep dive on multi-party state
  machines coordinated through a single transactional flow (booking →
  payment saga) and optimistic-locking/contention patterns. Food Panda's
  order lifecycle is multi-party in a different shape — three independent
  actors (customer, restaurant, courier) each mutate their own view of one
  order concurrently, none of them contending for the same *resource*
  (no seat to double-sell) — so the interesting problem is event ordering
  and fan-out notification, not locking. Name this contrast explicitly
  rather than re-explaining saga/locking from scratch.

## Problem Scope

Let a customer browse restaurants, place an order, have the restaurant
accept and prepare it, get it matched to a courier, and track it live to
their door — coordinating three independent parties who don't share a
database and don't trust each other's clocks.

### Functional Requirements

- [x] Browse/search restaurants by location, cuisine, and availability
- [x] View a restaurant's menu and place an order (cart → checkout)
- [x] Restaurant receives the order and can accept or reject it, then
      marks prep progress (received → preparing → ready for pickup)
- [x] System matches the order to an available courier and offers the
      assignment (accept/decline with timeout)
- [x] Courier picks up the order and delivers it; live location is
      visible to the customer throughout
- [x] Order delivery is confirmed (customer or courier marks complete)
- [x] Cancellation path for customer, restaurant, or courier, at the
      lifecycle stages where each is actually allowed to cancel

### Non-Functional Requirements

- [x] Matching latency: courier assigned within a few seconds of an order
      being marked ready-soon, not after the food is already cold
- [x] Location-update throughput: tens of thousands of courier GPS pings
      per second citywide during peak, delivered to trackers with low
      (~seconds) end-to-end latency
- [x] ETA accuracy expectations: a live countdown that's usefully close
      (not necessarily exact) and recalculates smoothly rather than
      jumping, as conditions change
- [x] High availability during meal-time peaks/surge (lunch and dinner
      rushes are 5-10x baseline order volume, not steady-state load)
- [x] Eventual consistency across the three parties' views of one order
      is acceptable (a few seconds of staleness on "restaurant sees the
      order" is fine) — this is explicitly not a strict-consistency
      problem the way seat inventory is

### Explicitly Out of Scope

- [x] Restaurant menu/inventory management internals (item availability
      toggles, stock sync) — treated as an existing upstream system
- [x] Payment authorization/settlement details, refund policy
- [x] Courier onboarding, background checks, pay/incentive structure
- [x] Recommendation/search ranking (which restaurants surface first)
- [x] In-app chat between customer/courier

## HLD Checklist (`hld.mdx`)

### 1. Problem framing

- [x] Frame the defining challenge: coordinating three independent
      parties (customer, restaurant, courier) around one order, where
      the restaurant's prep time is a real-world production step the
      system can only estimate, not control
- [x] Name this as a three-sided marketplace explicitly, contrasted with
      Ride-Sharing's two-sided (rider/driver) marketplace — the third
      side (restaurant) is what makes matching timing-dependent rather
      than instant

### 2. Requirements & capacity estimate

- [x] Reference the functional/non-functional requirements above
- [x] Back-of-envelope math: orders/sec citywide at peak, courier
      location-ping rate (pings/courier/interval × active couriers),
      fan-out reads per order (customer + restaurant + courier all
      polling/subscribing to the same order's state)

### 3. Core content — architecture diagrams (5+, one concern each)

- [x] Diagram 1: three-sided marketplace overview — customer app,
      restaurant app/POS integration, courier app, and the platform
      services connecting them
- [x] Diagram 2: order-placement path — client → API gateway → order
      service → restaurant notification → payment
- [x] Diagram 3: matching/dispatch path — order-ready signal → matching
      service → courier candidate pool → offer/accept
- [x] Diagram 4: live-tracking data path — courier app → location
      ingestion → geo store/cache → fan-out to subscribed customer
      clients (WebSocket/SSE/polling)
- [x] Diagram 5: event backbone — Kafka/queue decoupling order-state
      changes from matching, tracking, and notification consumers, so
      each scales/fails independently

### 4. Core content — deep dives (each with 2-3 real-interview branches)

- [x] **Courier-order matching**: name multiple real strategies, not just
      "assign nearest courier" — greedy nearest-available assignment vs.
      batch-window assignment (collect a few seconds of candidate
      orders/couriers, then solve an optimal assignment) vs. an
      offer/accept model with per-courier timeout and re-offer on decline
- [x] **Order batching**: a single courier carrying multiple orders —
      same-restaurant batching (two orders from one restaurant, one trip)
      vs. route-batching (multiple restaurants near each other, one
      courier loop) vs. why batching trades delivery speed for courier
      utilization/cost, and when the matching service should *not* batch
      (perishable/hot food, tight promised-ETA orders)
- [x] **Live location tracking**: push model (courier streams GPS via
      WebSocket) vs. poll model, geo-indexing choice (Redis geospatial
      vs. quadtree/H3 grid) for "which couriers are near this restaurant"
      — link to Ride-Sharing's matching-lesson treatment of the same
      geo-index primitive rather than re-deriving it, and add what's new
      here: fan-out of one courier's location to N subscribed customers
- [x] **ETA prediction**: framed as a pipeline of estimates, not one
      number — kitchen prep-time estimate, courier-to-restaurant time,
      restaurant-to-customer time, each with its own model/heuristic and
      its own error bar; why ETAs are recalculated periodically rather
      than computed once at order time (traffic, kitchen delay, courier
      detour)
- [x] **Order lifecycle fan-out / notification**: how customer,
      restaurant, and courier apps each see order-state updates without
      polling a shared database — event-driven push per state transition,
      contrasted with Ticketmaster's saga (this system has no
      single-writer transaction coordinating the three parties)
- [x] **Restaurant availability & capacity signal**: how the system knows
      a restaurant can/can't take new orders right now (manual toggle vs.
      order-queue-depth-based auto-throttle) — brief, since inventory
      internals are out of scope, but the *signal* feeding matching isn't

### 5. Trade-offs

- [x] Greedy nearest-courier assignment vs. batch-window optimal
      assignment: latency vs. overall efficiency/fairness
- [x] Push (WebSocket/SSE) vs. poll for live tracking: server cost/
      complexity vs. staleness
- [x] Single-order-per-trip vs. batching: delivery speed vs. courier
      utilization and per-order cost
- [x] Strong per-order consistency vs. eventual consistency across the
      three parties' views — why this system chooses eventual (unlike
      Ticketmaster's seat-inventory writes)

### 6. Worked example

- [x] Sequence diagram tracing one order end-to-end: customer places
      order → restaurant accepts → prep-time estimate feeds matching →
      courier offered and accepts → pickup → live tracking updates →
      delivery confirmed — naming which service emits which event at
      each step

### 7. Interview angle

- [x] Follow-up: courier declines the offer / times out — re-offer logic
- [x] Follow-up: restaurant rejects the order after payment — refund/
      re-route implications (kept at the shape level; refund policy
      itself stays out of scope per this checklist)
- [x] Follow-up: courier goes offline mid-delivery — detection and
      customer-facing fallback
- [x] Follow-up: scale the matching service across cities — why matching
      is naturally geo-partitioned (a courier in Berlin never competes
      for an order in Manila)

### 8. Practice & Self-Check

- [x] Recap quiz covering: three-sided marketplace framing, batching
      strategies, ETA pipeline stages, push vs. poll tracking, eventual
      consistency reasoning
- [x] Open design challenge: "extend the matching service to support
      scheduled orders (deliver at a specific future time) alongside
      on-demand orders" — with rubric
