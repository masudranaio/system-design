# Event Tracking System — Case Study Checklist

Content plan for `lld.mdx` (primary) and, later, `hld.mdx` (secondary),
reviewed before either is drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: `lld.mdx` **drafted and completeness-passed** (see log at the
bottom). `hld.mdx` not started — see
[SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-12) for build
priority. LLD-01–06 (this lesson's listed dependencies) don't exist yet;
needed concepts (class design, state machines, database design,
concurrency/dedup patterns) are explained inline and flagged with
`<!-- concept-dependency: ... -->` comments per the TRACKER.md ruling,
for a future pass to convert to real links.

## Problem Scope

Design the ingestion pipeline for a product-analytics/telemetry system
(Segment/Snowplow/Google-Analytics-SDK-shaped): a client SDK that
captures user/app events, batches and ships them; a server that
validates, deduplicates, and durably ingests them; and a processor that
turns raw events into stored, query-ready records.

### Functional Requirements

(Checked below at the single-pipeline scope `lld.mdx` covers; a
multi-region/high-fan-out version of this same pipeline is HLD's job,
not re-checked here.)

- [x] Client SDK exposes a `track(eventName, properties)`-style API to
      capture arbitrary named events with a property payload
- [x] SDK buffers events locally and sends them in batches, not one
      HTTP call per event
- [x] SDK retries failed sends with backoff and persists unsent events
      across a process restart (bounded local queue)
- [x] Server-side ingestion endpoint validates event schema (required
      fields, type checks, payload size limits) and rejects malformed
      events without blocking the rest of a batch
- [x] Ingestion assigns/uses a client-generated event ID and
      deduplicates on it before persisting
- [x] Processor consumes validated events and writes them to durable
      storage in a query-ready shape (e.g. columnar/partitioned by
      event time)
- [x] Basic server-side enrichment: attach ingestion timestamp,
      server-assigned sequence/offset, and derived fields (e.g.
      geo-from-IP) without blocking on slow enrichment sources

### Non-Functional Requirements

- [x] Delivery guarantee: at-least-once from SDK to durable storage,
      made effectively-once via idempotent dedup — no interviewer-grade
      system claims true exactly-once across a network boundary
- [x] Ordering: no global ordering guarantee across events from
      different clients; best-effort per-client ordering only, and the
      design must state why (partition/shard key choice)
- [x] Throughput: single-service scale — thousands of events/sec
      ingested per node, not a hyperscale multi-region figure (that's
      HLD's job)
- [x] Durability: an event accepted by the server (2xx to the client)
      must not be silently lost before it lands in storage
- [x] Low client overhead: SDK must not block the host app's main
      thread/UI on network I/O
- [x] Backpressure: a slow or down ingestion endpoint must degrade
      gracefully (SDK queues/drops per a defined policy) rather than
      crash the host app

### Explicitly Out of Scope

- [x] The analytics query/dashboard/BI layer (how stored events get
      queried or visualized) — mention only that storage is
      query-ready, don't design the query engine
- [x] ML-based anomaly detection or real-time alerting on event streams
- [x] Multi-region ingestion, cross-datacenter replication, and
      global-scale fan-out — HLD's job
- [x] User identity resolution/merging across devices (identity graph)
      beyond a single client-supplied user/anonymous ID
- [x] Full schema-registry/schema-evolution tooling — note schema
      versioning as a concept, don't design a registry service

## LLD Checklist (`lld.mdx`) — primary side

### 1. Problem framing

- [x] Frame as: "design the logging/analytics pipeline behind a
      product's `analytics.track()` call" — a common LLD framing
      distinct from log-aggregation-for-ops (e.g. ELK-style) systems
- [x] Interviewer expects clarifying questions first: what triggers an
      event (client action vs. server action)? delivery guarantee
      required? ordering needs? who consumes the data downstream?
- [x] Set the boundary: single ingestion pipeline object/class model
      now, multi-region/massive-fan-out concerns deferred to HLD

### 2. Requirements at the object level

- [x] Translate functional requirements into nouns-that-need-behavior:
      `Event`, `EventBatch`, `Tracker`/`AnalyticsClient` (SDK entry
      point), `Transport`, `RetryQueue`, `IngestionService`,
      `Validator`, `Processor`, `EventStore`
- [x] Warn against turning every property into a class (event
      `properties` is a schemaless/typed map, not one class per event
      type)
- [x] Decide cardinalities: one `AnalyticsClient` -> many `Event`s ->
      batched into `EventBatch`es -> one `Transport` call per batch
- [x] Decide what identifies an event uniquely (client-generated UUID
      at creation time, not server-assigned) and why that choice makes
      dedup possible at all

### 3. Class diagram

- [x] Class diagram (D2 `shape: class`) covering `Event` (id, name,
      timestamp, `userId`/`anonymousId`, `properties: Map`,
      `contextMetadata` e.g. device/app version)
- [x] `AnalyticsClient`/`Tracker` (public `track()`/`identify()` API,
      owns a `Buffer` and a `Transport`, exposes `flush()`)
- [x] `EventBuffer`/`Queue` (bounded in-memory + optional on-disk
      persisted queue, `add()`, `drain(batchSize)`)
- [x] `Transport` interface with `HttpTransport` implementation (send
      batch, report success/failure) — the Strategy seam for pluggable
      delivery (HTTP vs. a local socket vs. a message-queue client)
- [x] `RetryPolicy` (backoff schedule, max attempts) collaborating with
      `Transport`
- [x] Server side: `IngestionController` (receives batch), `Validator`
      (schema check), `Deduplicator` (event-ID check against a
      short-lived store), `EventProcessor` (enrich + persist)
- [x] Relationships: composition `AnalyticsClient`-`EventBuffer`,
      association `AnalyticsClient`-`Transport` (injected, not owned),
      `IngestionController` depends on `Validator`/`Deduplicator` as
      injected collaborators, not subclasses

### 4. Sequence diagram — client batch-send-ack flow

- [x] Trace: app calls `track("checkout_completed", {...})` -> event
      enqueued locally -> buffer hits size/time threshold -> `flush()`
      triggers `Transport.send(batch)` -> server validates + dedups +
      acks -> SDK clears the acked events from its local queue -> on
      network failure, batch stays queued and retries per
      `RetryPolicy`
- [x] Caption calls out the exact ack semantics: the SDK only drops
      events from its local queue after a positive server ack, which
      is *why* at-least-once (not silent loss) is achievable

### 5. State diagram — event delivery lifecycle

- [x] State diagram (D2 shapes+connections): `CREATED` -> `QUEUED`
      (buffered client-side) -> `SENDING` -> `ACKED`/`SENT` (removed
      from local queue) on success
- [x] Failure branch: `SENDING` -> `RETRY_PENDING` (backoff timer) ->
      back to `SENDING`, with a `DROPPED` terminal state once
      max-retries or queue-capacity is exceeded (define the drop
      policy explicitly: oldest-dropped vs. newest-rejected)
- [x] Server-side continuation: `RECEIVED` -> `VALIDATED`/`REJECTED`
      (bad schema) -> `DEDUPED` (duplicate ID, discarded but still
      2xx'd to client) -> `PERSISTED`
- [x] Show the "back" edges explicitly (retry loop, drop-on-exhaustion)
      per CONTENT-GUIDE — no happy-path-only diagram

### 6. ER diagram — storage schema

- [x] ER diagram (D2 `shape: sql_table`) covering `raw_event` (event_id
      PK, event_name, user_id, anonymous_id, occurred_at, received_at,
      properties JSON/columnar, schema_version)
- [x] `event_schema_registry` (event_name, version, required_fields) —
      referenced conceptually for validation, not fully designed (per
      out-of-scope)
- [x] `dedup_index`/short-TTL table or cache entity (event_id,
      first_seen_at) representing the dedup window, distinct from
      permanent storage
- [x] Partitioning note: partition `raw_event` by `occurred_at` (time)
      for write locality and retention/rollup, called out as a design
      decision not just a column

### 7. Concepts / mechanisms with real-interview depth

- [x] **Delivery guarantee deep dive** (3 branches, not 1 line):
      at-least-once as the achievable baseline; idempotency-key
      (event_id) dedup at ingestion to make it effectively-once; how
      the dedup window is bounded (TTL cache, not infinite storage) and
      what happens to a duplicate that arrives after the window expires
- [x] **Ordering deep dive** (2-3 branches): no cross-client ordering
      guarantee; per-client ordering achieved by keying a queue/stream
      partition on client/user ID; how out-of-order arrival at the
      processor is handled (timestamp on the event itself, not
      arrival order, drives any time-series rollup)
- [x] **Batching mechanics deep dive**: trigger conditions (size
      threshold vs. time threshold, whichever fires first), what
      happens to partially-acked batches (per-event ack inside a batch
      response, not all-or-nothing)
- [x] **Schema validation deep dive**: required-field/type checks,
      unknown-field handling (permissive vs. strict), what "reject"
      means operationally (event dropped vs. quarantined to a
      dead-letter store for later inspection)
- [x] **Backpressure/local-queue-overflow deep dive**: bounded queue
      size, overflow policy (drop-oldest vs. drop-newest vs. sampling),
      why unbounded local queuing risks OOM-ing the host app

### 8. Design patterns

- [x] Builder (`Event.builder()...build()` for constructing an event
      with required + optional properties cleanly, vs. a
      telescoping constructor)
- [x] Strategy (`Transport` interface: HTTP vs. WebSocket vs.
      message-queue client, swappable without touching
      `AnalyticsClient`)
- [x] Observer (buffer-full or flush-timer triggers a listener that
      invokes send — decouples the timing mechanism from the send
      mechanism)
- [x] Chain of Responsibility (server-side pipeline: validate ->
      dedup -> enrich -> persist, each stage can short-circuit)
- [x] Singleton (optional, flagged with its testability trade-off): a
      single global `AnalyticsClient` instance per host app, vs.
      dependency-injecting it

### 9. Trade-offs

- [x] Batching interval/size trade-off: larger batches/longer
      intervals reduce network overhead and battery/CPU cost but
      increase data latency and the blast radius of a lost batch
- [x] Sync vs. async SDK send: async (fire-and-forget with local
      queuing) protects host-app responsiveness at the cost of a
      window where events aren't yet durably acked; sync blocks the
      caller and is essentially never the right default for a
      client SDK
- [x] At-least-once + dedup vs. exactly-once coordination protocol:
      dedup is simpler and scales better than distributed transactions
      / two-phase commit, at the cost of needing a bounded dedup
      window instead of a correctness guarantee that holds forever
- [x] Client-side ID generation vs. server-assigned ID: client-side
      (UUID at creation) is what makes dedup possible at all, at the
      cost of trusting the client to generate well-distributed,
      non-colliding IDs

### 10. Worked example

- [x] Trace one event end to end with concrete numbers: user taps
      "Add to Cart" -> SDK builds `Event(id=evt-9f2a..., name=
      "product_added", properties={sku, price})` -> buffered
      (batch threshold: 20 events or 10s, whichever first) -> at t+7s
      a network blip drops the send -> `RetryPolicy` backs off
      (1s, 2s, 4s) -> batch resent at t+11s -> server validates,
      finds `evt-9f2a...` not in the dedup cache, persists it, acks
      -> SDK drains the event from its local queue
- [x] Continue the trace with an actual duplicate: the SDK's first
      send *did* reach the server and was persisted, but the ack was
      lost in transit -> SDK retries -> server sees `evt-9f2a...`
      already in the dedup cache -> discards the duplicate write but
      still returns 2xx -> illustrates why idempotency-key dedup, not
      "hope delivery is exactly-once," is what makes retries safe

### 11. Interview angle

- [x] Follow-up: "Your dedup cache has a 24-hour TTL. A device was
      offline for 3 days and now replays its local queue — walk
      through what happens to those events."
- [x] Follow-up: "How would you detect and handle a client sending a
      burst of malformed events (bad schema) without dropping the
      whole batch or silently losing the well-formed events in it?"
- [x] Follow-up: "The product team wants per-event-type schemas that
      evolve over time. How does your `Event`/`Validator` design
      accommodate a new required field being added to an existing
      event type without breaking already-deployed SDK versions?"

### 12. Practice & Self-Check

- [x] 5-8 recap `QuizItem`s covering: at-least-once vs. exactly-once
      claim, why client-generated IDs enable dedup, batching
      trigger conditions, the drop policy on local-queue overflow, the
      Strategy pattern's role for `Transport`, per-client vs. global
      ordering
- [x] Open challenge: "Extend the SDK to support offline queuing that
      survives an app restart or device reboot (not just an in-memory
      buffer), while keeping the at-least-once + dedup guarantee
      intact. Which class(es) change, what gets persisted to disk and
      when, and how does startup replay interact with the batching and
      retry logic already designed?" with rubric and self-score band

## HLD Checklist (`hld.mdx`) — secondary side, deferred

Not written yet — deferred per CS-12's "opportunistic, added later"
status in `SYLLABUS.md`. When picked up, scope it as: distributed
ingestion/aggregation at scale (many services/SDKs -> durable log ->
stream processors -> partitioned analytical storage), reusing this
lesson's `Event`/dedup/delivery-guarantee model rather than
re-deriving it, the same way Parking Lot's `hld.mdx` reused its `lld`
companion's Observer pattern at network scale.

## Completeness Pass Log

Run after drafting `lld.mdx` (2026-08-27). Every checkbox above is
covered by the finished lesson — walked section by section against the
live file:

- **Problem scope** (functional/non-functional/out-of-scope): all
  covered in "Problem framing" and "Requirements at the object level."
- **§1–2** (framing, object-level requirements): covered, including the
  "properties as a Map, not one class per event type" warning and the
  client-generated-ID rationale.
- **§3** (class diagram): one D2 `class`-shape diagram with all 10
  listed classes and the composition/association/dependency
  relationships named in prose underneath it.
- **§4** (sequence diagram): one D2 `sequence_diagram` tracing
  track() -> buffer -> flush -> send -> ack -> retry, with the
  ack-then-drop caption called out explicitly.
- **§5** (state diagram): one combined client+server state diagram
  with both back edges (retry loop, drop-on-exhaustion) and the
  DROPPED/REJECTED terminal states.
- **§6** (ER diagram): one D2 `sql_table` diagram with `raw_event`,
  `event_schema_registry`, `dedup_index`, plus the `occurred_at`
  partitioning rationale in prose.
- **§7** (5 deep dives): delivery guarantee (3 branches), ordering (3
  branches), batching mechanics, schema validation, backpressure — all
  present as their own subsections, plus an extra D2 architecture-type
  diagram for the server-side Chain of Responsibility pipeline (beyond
  the checklist's minimum, not a substitute for any listed item).
- **§8** (5 patterns): Builder, Strategy, Observer, Chain of
  Responsibility, Singleton (flagged trade-off) — all named explicitly
  with the mechanism they replace.
- **§9** (4 trade-offs): all four present as `CompareTable`s with an
  explicit "chosen because."
- **§10** (worked example): full `evt-9f2a...` trace with concrete
  batch-threshold numbers and backoff timing, plus a second D2 sequence
  diagram for the lost-ack duplicate scenario.
- **§11** (3 interview follow-ups): all three present, answered in
  detail referencing earlier sections.
- **§12** (practice & self-check): 7 recap `QuizItem`s (within the 5-8
  band) covering every named topic, plus the open design challenge
  (offline queuing) with a reference answer, a 5-item `Rubric`, and the
  `SelfScoreBand` the `Rubric` component renders automatically.

**Nothing was dropped.** Diagram count: 6 (class, 2x sequence, state,
ER, architecture/pipeline) — above the CONTENT-GUIDE floor of 4-5. All
6 D2 chart sources were compiled directly against
`@terrastruct/d2`'s `compile()`/`render()` (the same library
`lib/render-d2.ts` uses) outside the Next.js app to confirm they parse
and render without error before this lesson was considered done.
