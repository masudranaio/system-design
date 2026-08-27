# Chat / WhatsApp (Real-Time Messaging) — Case Study Checklist

Content plan for `hld.mdx`, reviewed before it is drafted, per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)'s
"Enhanced lesson template," with quality bar and format rules from
[CONTENT-GUIDE.md](../../../CONTENT-GUIDE.md) (including the
"Content-format standard" section — more/smaller diagrams, granular topic
coverage, bullets over prose).

Status: not started. See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-15) for build priority —
this checklist is a plan, not a built lesson. `lld.mdx` (message/
delivery-status state machine) is the secondary side, deferred per
CS-15's row — not planned in this checklist.

Depends on: HLD-01, 03, 06, 08, 10; LLD-01–06 (per CS-15's row in
`04-case-studies/SYLLABUS.md`). None of these concept lessons exist yet
(0/12 HLD, 0/12 LLD built) — every concept this lesson needs is explained
inline instead, each flagged with a JSX comment
(`{/* concept-dependency: HLD-XX not yet built, explained inline */}`)
for a future pass to swap in real links, per the ruling in
`docs/superpowers/plans/TRACKER.md`.

## Problem Scope

Let two people (or a group) exchange messages that arrive in real time
when both are online, and reliably once either comes back online —
without losing a message, duplicating it, or delivering it out of order
within a conversation.

### Functional Requirements

- [x] 1:1 messaging between two users, delivered in real time when both
      are online
- [x] Group messaging (up to a few hundred members per group) with the
      same real-time delivery when members are online
- [x] Delivery/read receipts: sent → delivered (reached recipient's
      device) → read (recipient opened the conversation), tracked per
      recipient in a group
- [x] Online-presence / last-seen: whether a contact is online now, and
      if not, when they were last seen
- [x] Message history persisted per conversation, with pagination/scroll-
      back for old messages
- [x] Multi-device sync: a message sent/received on one device (e.g.
      phone) shows up on a linked device (e.g. web client) in the same
      conversation state
- [x] Offline delivery: a message sent to an offline user is queued and
      delivered (plus a push notification) when they reconnect

### Non-Functional Requirements

- [x] Low delivery latency for online-to-online delivery (message
      appears on the recipient's screen within ~100–300ms of being sent)
- [x] Per-conversation ordering guarantee: messages in a single 1:1 or
      group conversation are never shown out of order, even under retries
      or network jitter — no global ordering across unrelated
      conversations required
- [x] At-least-once delivery: a message is never silently dropped; the
      client dedupes on a client-generated message ID if the same message
      arrives twice
- [x] Massive connection scale: hundreds of millions of daily active
      users, tens of millions of concurrent persistent WebSocket
      connections held open at once
- [x] High availability of the messaging path — a single chat server or
      data-center failure shouldn't drop a user's connection permanently,
      only force a reconnect
- [x] Durability: once a message is acknowledged "sent," it must survive
      a server crash on the delivery path

### Explicitly Out of Scope

- [x] The end-to-end encryption cryptography itself (key exchange,
      Signal Protocol ratcheting) — only the conceptual placement of
      encryption in the flow (client-to-client payload, server relays
      ciphertext it cannot read) is covered
- [x] Voice/video calling
- [x] Media (image/video/file) upload and CDN storage pipeline in detail
      — mentioned as "same offline-object-storage pattern as other
      systems," not designed here
- [x] Status/Stories feature
- [x] Spam/abuse detection and account-level rate limiting policy

## HLD Checklist (`hld.mdx`)

### 1. Problem framing

- [x] Frame the defining challenge as two coupled problems: (a) holding
      tens of millions of long-lived, low-latency, bidirectional
      connections at once, and (b) guaranteeing a message reaches its
      recipient exactly once, in order, even if that recipient is
      offline right now
- [x] Explain why this is a stateful-connection problem, unlike the
      mostly-stateless request/response systems covered so far — the
      server must remember which physical connection (and which
      physical server) a given user is on

### 2. Requirements & capacity estimate

- [x] Reference the functional/non-functional requirements above
- [x] Back-of-envelope math: from a DAU figure (e.g. 500M DAU, ~10%
      concurrently online) derive concurrent WebSocket connections
      (~50M), messages/sec at peak, and connections-per-server needed to
      size the connection-gateway tier (e.g. 50k–100k conns/server →
      hundreds to ~1,000 gateway servers)

### 3. Core content — architecture diagrams (5+ total, granular)

- [x] Diagram 1 — system overview: client → connection gateway
      (WebSocket-terminating tier) → message service → message queue →
      storage (message store) → push-notification service, with the
      presence store called out as its own component
- [x] Diagram 2 — WebSocket connection lifecycle: client connects →
      gateway authenticates → gateway registers (user_id → server_id)
      in the connection-routing/session store → heartbeat keeps it
      alive → disconnect/reconnect updates the routing entry
- [x] Diagram 3 — 1:1 message send/delivery flow: sender's gateway →
      message service persists + acks sender → routing lookup for
      recipient's gateway → deliver over recipient's live connection (or
      queue if offline)
- [x] Diagram 4 — group-chat fan-out flow: sender → message service →
      group-membership lookup → per-member fan-out to each online
      member's gateway (and queue entries for offline members)
- [x] Diagram 5 — offline delivery via push notification: recipient not
      connected → message queued in per-user inbox/store → push
      notification service calls APNs/FCM → user opens app → client
      syncs queued messages over a fresh WebSocket connection
- [x] (Optional 6th) — multi-device sync diagram: one account, two
      device connections both registered in the routing store, message
      fanned out to both

### 4. Core content — deep dives (2–3 branches each, not one-liners)

- [x] **Connection management**: WebSocket chosen over polling/long-
      polling and why; connection-gateway is stateless-per-request but
      the *routing table* (user_id → server_id) is the real state,
      typically in Redis; heartbeat/ping-pong for detecting dead
      connections vs. relying on TCP timeout alone
- [x] **Message delivery guarantee**: at-least-once delivery via
      persist-before-ack + retry; client-side dedup using a client-
      generated message ID (idempotency key); per-conversation ordering
      via a per-conversation sequence number (not global timestamps,
      which can race); read-receipt tracking as a separate per-recipient
      status update pipeline, not baked into the message row itself
- [x] **Online presence / last-seen**: heartbeat-driven presence with a
      TTL (absence of heartbeat within N seconds = offline); presence
      fan-out to contacts is itself a scale problem — the "who cares
      about my online status" fan-out list, and why presence often
      tolerates staleness (a few seconds' lag) as an acceptable trade
      unlike message delivery
- [x] **Group-chat fan-out**: fan-out-on-write (push to every member's
      queue at send time) vs. fan-out-on-read (store once, members pull
      on reconnect) vs. a hybrid by group size threshold
- [x] **Offline delivery & push notification fallback**: per-user
      durable inbox/queue for offline messages; push notification as a
      "wake the client" signal (APNs/FCM), not the message transport
      itself — payload stays server-side until the client fetches over
      a live connection
- [x] **Message storage**: write-heavy append-mostly store per
      conversation, partitioned by conversation ID for locality;
      pagination/scroll-back access pattern shaping the schema choice
      (wide-column/keyed-by-conversation store over a single giant
      messages table)
- [x] **End-to-end encryption (conceptual only)**: server relays
      ciphertext it cannot read; where the boundary sits in the
      architecture (encryption/decryption at the client, not the
      message service) — explicitly not designing the key-exchange
      protocol, per Out of Scope

### 5. Trade-offs

- [x] Fan-out-on-write vs. fan-out-on-read for group messages (latency
      for recipients vs. write amplification for large/celebrity groups)
- [x] Sticky connection routing (gateway holds full session state, and a
      routing table maps user → gateway) vs. a fully stateless gateway
      with all session/presence state externalized to a shared store —
      what each costs on gateway failover
- [x] WebSocket vs. long-polling/HTTP fallback for clients on networks
      that block persistent connections
- [x] Push-based delivery to a live connection vs. client-polls-on-
      reconnect for offline message sync

### 6. Worked example

- [x] Sequence diagram tracing one message from send to multi-recipient
      delivery in a mixed-state group: one member online (gets it
      instantly over their live connection), one member offline (queued
      + push notification triggers fetch), showing where the
      per-conversation sequence number and read-receipt update slot in

### 7. Interview angle

- [x] Follow-up: how do you scale presence to hundreds of millions of
      users without a presence-update storm on every reconnect
- [x] Follow-up: what happens when a user sends a message and the
      network drops before the ack — how does the client know whether it
      went through
- [x] Follow-up: how would you support message search across a user's
      entire history

### 8. Practice & Self-Check

- [x] Recap quiz covering: WebSocket connection routing, delivery
      guarantee/ordering, fan-out strategy choice, and presence trade-
      offs (5–8 questions)
- [x] Open design challenge: "extend the design to support disappearing
      messages (auto-delete after N hours) across all of a user's
      devices" with an independently-checkable rubric and self-score
      band
