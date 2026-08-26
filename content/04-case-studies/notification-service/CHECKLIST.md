# Notification Service — Case Study Checklist

Content plan for `lld.mdx` (primary side). `hld.mdx` (secondary side —
multi-provider fan-out and failover at scale) is deferred, opportunistic,
per [SYLLABUS.md](../SYLLABUS.md) (CS-13) — not planned in this pass.
Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md),
with the output format amended by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md).

Status: not yet built — this checklist is a plan, not a built lesson.
Dependencies LLD-01–06 (concept modules) don't exist yet; every mechanism
that would normally link to one of those lessons must be explained
inline in `lld.mdx` and flagged with a
`{/* concept-dependency: LLD-0X ... */}` comment for a future pass to
convert to a real link, per the existing ruling used in the other
case-study lessons already built (parking-lot, ticketmaster,
amazon-locker).

Note: every other case study in this course is an implicit consumer of
this system — booking confirmations (Ticketmaster), delivery/arrival
updates (ride-sharing, food delivery), locker pickup codes (Amazon
Locker), watch-party invites (Netflix) all ultimately call "send a
notification." Worth one line in the worked example tying this system
back to that role, without turning the lesson into a tour of the other
case studies.

## Problem Scope

Design the internal service other backend systems call to send a
transactional notification (email, SMS, or push) to a user, with
template rendering, multi-channel delivery, retry-on-failure, and
delivery-status tracking.

### Functional Requirements

- [ ] Accept a "send notification" request identifying: recipient,
      notification type/template, template variables, and target
      channel(s) (email / SMS / push — a request may target more than
      one channel for the same event, e.g. email + push for a booking
      confirmation)
- [ ] Render a message from a named template + variables per channel
      (an email template differs in shape from an SMS template for the
      same logical event — subject/body/HTML vs. a single short string)
- [ ] Dispatch the rendered message through a channel-specific provider
      (e.g. SMTP relay for email, Twilio-style API for SMS, FCM/APNs
      for push) behind a common interface
- [ ] Track delivery status per notification attempt (queued -> sent ->
      delivered/failed/bounced), and expose it for query (e.g. "did
      booking confirmation #4821 get delivered?")
- [ ] Retry a failed send automatically up to a bounded number of
      attempts, with backoff between attempts
- [ ] Deduplicate: the same logical notification (same idempotency key)
      requested twice must not result in two sends
- [ ] Fail over to a secondary provider on the same channel when the
      primary provider is down or erroring persistently (e.g. primary
      SMTP relay unreachable -> secondary relay)
- [ ] Respect a basic per-user opt-out/preference check before sending
      (e.g. user disabled SMS) — mention as a gate in the flow, not a
      full preference-center feature

### Non-Functional Requirements

- [ ] At-least-once delivery: a notification is never silently dropped
      on transient failure — it retries until success, dead-letter, or
      max attempts
- [ ] Delivery latency expectations differ by channel: push/SMS
      near-real-time (seconds), email tolerates seconds-to-low-minutes
      — state this explicitly, it shapes the sync-vs-queue trade-off
- [ ] Dedup guarantee: exactly-once *effect* per idempotency key, even
      though delivery itself is at-least-once (retries of the same
      attempt shouldn't fan out into duplicate provider calls)
- [ ] Scale: assume a mid-size product, on the order of a few hundred
      to a few thousand notification requests/sec at peak (e.g. a flash
      sale triggering booking confirmations) — enough to require a
      queue-and-worker design, not enough to need the HLD side's
      cross-region fan-out
- [ ] Availability: a single provider outage on one channel must not
      block sends on other channels, and should degrade to
      failover/retry rather than rejecting the request outright

### Explicitly Out of Scope

- [ ] Building an actual SMTP/SMS/push gateway — providers are external,
      integrated behind an interface, not reimplemented
- [ ] Marketing/bulk-campaign scheduling UI and audience segmentation
      (this is transactional/triggered notifications, not a campaign
      tool)
- [ ] Rich user preference center (granular per-category opt-in/out UI)
      — the single opt-out gate above is enough to show the hook exists
- [ ] Cross-region/multi-datacenter fan-out at scale — that's the HLD
      side's job if/when it gets built
- [ ] In-app notification feed/inbox rendering (this system triggers
      external-channel delivery, not an in-product notification tray)

## LLD Checklist (`lld.mdx`) — primary side

### 1. Problem framing

- [ ] Frame as "the system every other service calls" — open with 2-3
      concrete call sites (order confirmed, OTP code, price-drop alert)
      to motivate why channel abstraction and reliability matter before
      naming a class
- [ ] Interviewer expects clarifying questions first: which channels?
      transactional only or also bulk/marketing? synchronous
      response needed, or fire-and-forget? what's the retry/dedup
      contract?
- [ ] Set the boundary: this lesson designs the notification service
      itself (channel abstraction, template rendering, delivery
      lifecycle, retry/dedup) — not the campaign/segmentation layer
      that might sit in front of it, and not the multi-region scale-out
      (HLD, deferred)

### 2. Requirements at the object level

- [ ] Translate functional requirements into nouns-that-need-behavior:
      Notification, Template, Channel, Provider, DeliveryAttempt,
      NotificationRequest
- [ ] Warn against modeling "Email"/"SMS"/"Push" as separate top-level
      classes with duplicated fields — they're implementations of one
      Channel abstraction, not distinct domain concepts
- [ ] Decide cardinalities: one NotificationRequest -> one-or-many
      Notifications (one per target channel) -> many DeliveryAttempts
      (one per retry); one Template -> many rendered Notifications
- [ ] Decide the idempotency-key contract explicitly: caller supplies
      one (or the service derives one from request content) and it's
      unique per logical notification, not per attempt

### 3. Class diagram

- [ ] `classDiagram`: `NotificationChannel` interface (`send(message):
      DeliveryResult`) implemented by `EmailChannel`, `SMSChannel`,
      `PushChannel` — the Strategy abstraction
- [ ] `Provider` interface nested under each channel (e.g.
      `EmailProvider` implemented by `PrimarySMTPProvider`/
      `SecondarySMTPProvider`) — separates "which channel" from "which
      vendor on that channel," the hook failover needs
- [ ] `Template` (id, channel, subject/body fields per channel shape,
      variable placeholders) + a `TemplateRenderer` that binds
      variables into a `Template` to produce a `RenderedMessage`
- [ ] `Notification` (id, idempotency key, recipient, channel, template
      ref, rendered payload, status, attempt count)
- [ ] `DeliveryAttempt` (notification ref, attempt number, provider
      used, timestamp, result/error)
- [ ] `NotificationService` (facade: `send(request)`, orchestrates
      render -> dedup check -> enqueue -> dispatch -> status update)
- [ ] Relationships: `NotificationChannel` and `Provider` injected
      (Strategy), not owned; `Notification` composes its
      `DeliveryAttempt` history; `Template` is referenced, not owned,
      by `Notification`

### 4. State machine — delivery-status lifecycle

- [ ] `stateDiagram-v2`: `QUEUED -> SENDING -> SENT -> DELIVERED`, with
      branches `SENDING -> FAILED` (transient, retry-eligible) and
      `SENT -> BOUNCED` (permanent, provider-reported after accepting
      the send — the "looked sent, actually wasn't" case)
- [ ] Retry loop shown as a back-edge: `FAILED -> SENDING` (bounded by
      max-attempt count), not just a dangling terminal state
- [ ] Dead-letter terminal state: `FAILED -> DEAD_LETTERED` once max
      attempts exhausted — the diagram must show this as a real,
      reachable state, not just described in prose
- [ ] Note which transitions are provider-driven (webhook/callback:
      `SENT -> DELIVERED`, `SENT -> BOUNCED`) vs. service-driven
      (`QUEUED -> SENDING`, `SENDING -> FAILED`) — interviewers probe
      this distinction because it changes what triggers the transition

### 5. Sequence diagram — send-with-failover flow

- [ ] `sequenceDiagram`: caller -> `NotificationService.send()` ->
      dedup check (idempotency key lookup) -> template render ->
      enqueue to worker queue -> worker picks up -> `EmailChannel`
      calls `PrimarySMTPProvider` -> provider times out/errors ->
      circuit breaker trips after N consecutive failures ->
      `EmailChannel` calls `SecondaryProvider` -> success -> status
      updated to `SENT`
- [ ] Show the dedup check as a real step (cache/DB lookup on
      idempotency key) before enqueueing, not an implied detail

### 6. Database design (ER diagram)

- [ ] `erDiagram`: `notification` (id, idempotency_key UNIQUE, channel,
      recipient, template_id FK, status, attempt_count, created_at),
      `template` (id, channel, name, subject/body_template, version),
      `delivery_attempt` (id, notification_id FK, attempt_number,
      provider, result, error_code, attempted_at)
- [ ] Indexing: unique index on `notification.idempotency_key` — the
      mechanism that actually enforces dedup, not just a description
      of "we check for duplicates"
- [ ] Indexing: `notification(status, created_at)` for the
      retry-worker's "find stuck/failed notifications to retry" query
- [ ] Note: template versioning (a template can change after a
      notification using it was already rendered) — store the
      rendered payload on `notification`, don't re-render from a
      possibly-changed template when checking delivery status later

### 7. Concept/mechanism deep dives (each with 2-3 real-interview branches)

- [ ] **Retry policy**: exponential backoff (with jitter, to avoid a
      thundering-herd retry wave against a recovering provider) + a
      max-attempts cap + what happens at the cap (dead-letter queue,
      not silent drop) — three branches, not one "retry on failure"
      line
- [ ] **Dedup / idempotency**: idempotency key sourced from the caller
      vs. derived from request content hash; where the check happens
      (DB unique constraint vs. a fast-path cache check before hitting
      the DB); what "duplicate" means when the *first* attempt is still
      in flight (must not double-send while attempt #1 is pending, not
      just after it completes)
- [ ] **Provider failover**: health-check/circuit-breaker trip
      condition (N consecutive failures or an error-rate threshold);
      half-open probe behavior before fully trusting a recovered
      primary; failover cost trade-off (secondary provider may cost
      more or have different deliverability — not a free swap)
- [ ] **Channel abstraction extensibility**: adding a new channel
      (e.g. WhatsApp) means implementing `NotificationChannel` +
      registering a `Provider`, without touching `NotificationService`
      or existing channels — this is the Strategy pattern's payoff,
      state it explicitly rather than leaving it implicit in the class
      diagram

### 8. Design patterns

- [ ] Strategy: `NotificationChannel` (email/SMS/push) — the primary
      pattern the whole lesson hangs off
- [ ] Strategy (nested): `Provider` per channel (primary/secondary
      vendor) — flag this as Strategy-within-Strategy, distinct from
      the channel-level Strategy above, and why they're separate
      abstractions rather than one combined enum
- [ ] Factory: `ChannelFactory`/`ProviderFactory` resolving the
      concrete implementation from a channel/provider identifier, so
      callers never `new` a concrete class directly
- [ ] Template Method (or a simple `TemplateRenderer` if Template
      Method is overkill for this shape): the render step is
      channel-shaped but variable-binding logic is shared — call out
      which parts vary per channel and which don't
- [ ] Circuit Breaker: wraps each `Provider` call, trips on repeated
      failure, protects the retry loop from hammering a fully-down
      provider — connect explicitly to the retry-policy deep dive above
      rather than treating it as a separate unrelated pattern
- [ ] Observer (optional, brief): notification-status change publishes
      an event other services can subscribe to (e.g. "booking
      confirmation delivered") — note as an extension point, not core

### 9. Trade-offs

- [ ] Synchronous send (caller blocks for provider response) vs.
      queue-and-worker send (caller gets an immediate "accepted",
      actual dispatch happens async) — latency/simplicity vs.
      throughput/resilience to provider slowness; state which this
      lesson picks and why (queue-and-worker, given the NFRs) rather
      than presenting both as equally valid
- [ ] Per-channel rate limiting (protect each provider's own rate
      limit/cost budget) vs. one global limiter (simpler, but a slow
      SMS provider throttles unrelated email sends) — argue for
      per-channel
- [ ] Dead-letter after max retries vs. retrying indefinitely — bounded
      retry protects the queue from being clogged by a permanently
      broken recipient (e.g. invalid email address) at the cost of a
      genuine transient outage occasionally exhausting attempts before
      recovery
- [ ] Storing the rendered payload vs. re-rendering on read — storage
      cost vs. correctness when templates change after send (resurfaces
      the database-design note above as a named trade-off)

### 10. Worked example

- [ ] Trace one full request: Ticketmaster's booking service calls
      `NotificationService.send()` with idempotency key
      `booking-4821-confirmed`, template `booking_confirmation`,
      channels `[email, push]` -> dedup check passes (first time) ->
      two `Notification` rows created (one per channel) -> both
      enqueued -> email worker renders + calls primary SMTP -> primary
      times out twice -> circuit breaker trips -> failover to secondary
      -> `DELIVERED` after provider webhook confirms; push worker
      succeeds on first attempt via FCM -> `SENT`
- [ ] Continue the trace: the same booking service retries its own
      call (e.g. its own network blip) with the *same* idempotency key
      10 seconds later -> dedup check finds the existing
      `Notification` rows -> no new send, existing status returned —
      makes the dedup guarantee concrete, not just asserted

### 11. Interview angle

- [ ] Follow-up: "How do you prevent a burst of duplicate sends when
      the calling service itself retries the HTTP request to you?"
      (ties to the in-flight-dedup branch above)
- [ ] Follow-up: "A provider is up but slow (not erroring) — does your
      circuit breaker catch this, and should it?"
- [ ] Follow-up: "How would you add a new channel (WhatsApp) without
      touching any existing channel's code?"
- [ ] Follow-up: "How do you avoid retry storms across many
      notifications when a provider goes down all at once?" (backoff
      jitter + circuit breaker acting together, not either alone)

### 12. Practice & Self-Check

- [ ] 6-8 recap `QuizItem`s covering: Strategy vs. hardcoded
      if/else channel dispatch, why idempotency key uniqueness lives at
      the DB layer not just app logic, what distinguishes `FAILED` from
      `BOUNCED`, why backoff needs jitter not just exponential growth,
      why Provider is a separate abstraction from Channel
- [ ] Open challenge: "Add a new push-notification sub-channel (e.g.
      WhatsApp Business messages) without modifying
      `NotificationService`, any existing `NotificationChannel`
      implementation, or the retry/circuit-breaker infrastructure.
      Identify every class you add vs. every class you touch, and name
      the one shared piece of infrastructure (retry policy, circuit
      breaker, dedup check) that must keep working unmodified for the
      new channel to be a genuine drop-in." with rubric (independently
      checkable items: does the answer add a new `NotificationChannel`
      implementation instead of branching in existing code; does it
      register via the factory instead of a new caller-side switch;
      does it reuse the existing retry/circuit-breaker/dedup path
      instead of reimplementing it per-channel; does it name the
      template-shape difference for the new channel if relevant)

## Completeness Pass Log

(To be filled in after `lld.mdx` is drafted — walk every item above
against the finished lesson per `CLAUDE.md`'s "After writing a lesson"
step, mark each covered or explicitly flagged as dropped.)
