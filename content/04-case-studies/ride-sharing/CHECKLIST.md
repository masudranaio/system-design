# Ride-Sharing (Uber-style) — Case Study Checklist

Content plan for `hld.mdx`, reviewed before it is drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)'s
"Enhanced lesson template," with diagram/topic density raised to
`CONTENT-GUIDE.md`'s "Content-format standard" floor (4-5+ diagrams,
granular per-mechanism coverage, bullets/tables over prose).

Status: not started. See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-09) for build priority —
this checklist is a plan, not a built lesson. `lld.mdx` (trip/driver/rider
entity design, trip state machine, matching-service class design) is the
secondary side, deferred per the priority table.

## Problem Scope

Match a rider requesting a trip with a nearby available driver, track the
trip in real time from pickup to drop-off, and price it fairly — at a
scale where drivers and riders are both moving continuously and a match
has to happen in seconds, not minutes.

### Functional Requirements

- [ ] Rider requests a ride: pickup location, destination, ride type
      (e.g. economy/pool/premium)
- [ ] System matches the rider to a nearby available driver
- [ ] Driver can accept or reject (with a bounded timeout) a match offer
- [ ] Both rider and driver see live location tracking during the trip
- [ ] System computes ETA — to pickup, and to destination
- [ ] System computes trip price, including surge/dynamic pricing
- [ ] Trip moves through a defined lifecycle (requested → matched → en
      route to pickup → in progress → completed / cancelled)
- [ ] Rider and driver rate each other after trip completion

### Non-Functional Requirements

- [ ] Matching latency: a rider sees an assigned driver in low single-digit
      seconds (~2-5s) even in dense cities
- [ ] Location freshness: driver position updates propagate to nearby
      searches within ~2-4s (drivers ping every few seconds), not
      necessarily linearizable — briefly stale location is an acceptable
      trade-off for availability
- [ ] Scale: ~1M+ concurrent active trips globally at peak, tens of
      millions of location pings/sec system-wide, matching decisions
      made per city/region independently
- [ ] Availability over strict consistency for driver location data (an
      occasional match against a driver whose position moved slightly is
      recoverable; a matching service that's down is not)
- [ ] Strong consistency required for "one driver, one active trip at a
      time" — no double-dispatch of the same driver

### Explicitly Out of Scope

- [ ] Payment processing internals (card auth, wallet balance, payouts)
- [ ] Driver background-check / onboarding workflow
- [ ] Route-turn-by-turn navigation rendering (ETA/routing engine is
      referenced as an external dependency, not designed from scratch)
- [ ] Fraud/fake-GPS detection
- [ ] Driver incentive/bonus program design

## HLD Checklist (`hld.mdx`)

### 1. Problem framing

- [ ] Frame the core challenge as two coupled hard problems: finding the
      *nearest* available driver among millions of moving points fast
      enough to feel instant, and pricing fairly when supply/demand
      swing sharply by the minute
- [ ] Explain why this is a geospatial-indexing problem first, not just
      a generic matching/queueing problem — naive "scan all drivers and
      compute distance" doesn't scale

### 2. Requirements & capacity estimate

- [ ] Reference the functional/non-functional requirements above
- [ ] Back-of-envelope math: driver ping frequency (e.g. every 4s) ×
      active driver count → location-update writes/sec; ride
      requests/sec in a dense city at peak → matching decisions/sec

### 3. Core content — architecture diagram

- [ ] Diagram 1 — system overview: rider app / driver app → API
      gateway → location service, matching/dispatch service, pricing
      service, trip service, notification service, each with its own
      datastore, plus a routing/ETA engine as an external dependency
- [ ] Diagram 2 — location ingestion path: driver app → location
      service → geospatial index (in-memory) + location history store,
      labeled with update frequency and staleness tolerance

### 4. Core content — deep dives

- [ ] **Geospatial indexing for driver search** (own diagram): compare
      geohash, quadtree, and H3 (hex grid) as the candidate-set filter;
      cover the geohash boundary-edge problem (why you must also query
      neighboring cells, not just the exact cell) and why H3's hexagons
      give uniform neighbor distance vs. a square grid's diagonal-vs-edge
      distortion
- [ ] **Nearest-driver search / radius expansion** (own diagram): start
      at the rider's cell, expand ring-by-ring (or ring of H3 neighbors)
      until enough candidates are found, then rank by real distance/ETA
      only within that small candidate set — not the whole city
- [ ] **Matching strategy** (own diagram or sequence): greedy
      nearest-match vs. batched matching window (collect requests/drivers
      over a short window, e.g. a few seconds, then solve a bipartite
      matching over the batch) — name both explicitly, not folded into
      "matching algorithm" as one line
- [ ] **Driver acceptance / reassignment flow** (own diagram): offer sent
      to top-ranked driver → bounded accept timeout (e.g. 10-15s) → on
      timeout or reject, offer cascades to next-ranked driver or
      re-enters the batch
- [ ] **Surge / dynamic pricing** (own diagram): geo-cell-based
      supply/demand ratio computed over a rolling window → multiplier
      applied to base fare → gradual decay/cooldown back to baseline as
      supply catches up, to avoid oscillation
- [ ] **Trip lifecycle / state propagation**: trip state machine driving
      what both apps display and what services react to (own diagram —
      see worked example below for the full transition set)
- [ ] **Live tracking / ETA during trip**: how location pings during an
      active trip differ from pre-match search pings (push-based
      updates to the two parties in the trip vs. index-based search)

### 5. Trade-offs

- [ ] Geohash vs. quadtree vs. H3 for the driver index — density
      adaptivity, neighbor-distance uniformity, implementation
      complexity
- [ ] Greedy (assign-first-available) vs. batched-window matching —
      latency vs. overall match quality/fairness
- [ ] Strong vs. eventual consistency for driver location — why
      eventual consistency is acceptable for search, but the "driver
      accepts one trip at a time" invariant still needs a strongly
      consistent lock/claim
- [ ] Push (server notifies driver) vs. pull (driver app polls) for
      offer delivery and location updates

### 6. Worked example

- [ ] Sequence diagram tracing one ride request end-to-end: rider
      requests → matching service queries geo-index → ranks candidates
      → sends offer to driver A (timeout, no response) → cascades to
      driver B (accepts) → trip created → both parties tracked live →
      trip completed → fare finalized with any surge multiplier applied
- [ ] Full trip state machine diagram (own diagram, distinct from the
      sequence trace): every transition including cancellation from
      rider or driver at each stage, not just the happy path

### 7. Interview angle

- [ ] Follow-up: how do you prevent two riders from being matched to the
      same driver simultaneously (race condition on driver claim)
- [ ] Follow-up: how does the design change for scheduled/advance-booked
      rides vs. on-demand
- [ ] Follow-up: how would you extend this to pooled/shared rides
      (multiple riders, one driver, route re-optimization)

### 8. Practice & Self-Check

- [ ] Recap quiz covering: geospatial index trade-offs, batched vs.
      greedy matching, surge pricing mechanics, consistency choice for
      driver location vs. driver claim
- [ ] Open design challenge: "extend the matching service to support
      driver preferences (e.g. a driver only wants airport trips) without
      breaking the nearest-match latency guarantee" — with rubric and
      self-score band
