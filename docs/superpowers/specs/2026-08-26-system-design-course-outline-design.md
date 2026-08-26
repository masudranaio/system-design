# System Design Learning Content — Course Outline

**Date:** 2026-08-26
**Status:** Approved scope, not yet built (content produced incrementally, module by module)
**Note:** This spec's "Format" and "Repository structure" sections are
superseded by
[2026-08-26-nextjs-mdx-app-migration-design.md](2026-08-26-nextjs-mdx-app-migration-design.md) —
lessons are now MDX files under `content/`, rendered by a Next.js app, not
standalone HTML artifacts. Left unedited below as the historical record;
everything else in this spec (scope, topic lists, lesson template
content, build priority order) still governs.

## Purpose

A personal system design knowledge base covering High-Level Design (HLD) and
Low-Level Design (LLD), usable both as an interview-prep resource and as a
long-term technical reference. Content is intermediate+ to advanced,
interview-focused — introductory fundamentals are deferred to a future
module rather than built now.

Researched against AlgoMaster (LLD course, System Design Interviews course,
System Design course), DesignGurus, HelloInterview (LLD, System Design,
Behavioral, ML System Design "in a hurry" guides), and ByteByteGo to ground
the topic list and structure in how established system design courses are
organized.

### Reference sources

Grouped by the same split the source sites themselves use — LLD, HLD/system
design, and other/adjacent tracks not part of this course's current scope.

**Low-Level Design**
- https://algomaster.io/learn/lld/course-introduction
- https://www.hellointerview.com/learn/low-level-design/in-a-hurry/introduction

**High-Level Design / System Design**
- https://algomaster.io/learn/system-design-interviews/course-roadmap
- https://algomaster.io/learn/system-design/course-introduction
- https://www.designgurus.io/learn-system-design
- https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction

**Other / adjacent (future-module scope, see 06-future-modules.md)**
- https://www.hellointerview.com/learn/behavioral/course/why-the-behavioral-matters — behavioral interviews
- https://www.hellointerview.com/learn/ml-system-design/in-a-hurry/introduction — ML system design

**General / all-in-one**
- https://bytebytego.com/ — covers system design, LLD/OOP, behavioral, and ML system design

## Format

- **Lessons** are authored as self-contained interactive HTML pages,
  published as Claude Artifacts: native Mermaid diagrams (architecture, ER,
  class, sequence), collapsible sections, code/pattern tabs, and quizzes
  where useful, with dark/light theme support. This was chosen over plain
  Markdown lessons because the content is diagram- and interaction-heavy
  (architecture diagrams, class diagrams, ER diagrams) and Markdown alone
  renders these poorly compared to an interactive page.
- **Module and case-study folders** each get a `README.md` index — plain
  Markdown, for repo navigation, scanning on GitHub, and linking out to the
  HTML lessons. Markdown is used here (not HTML) because indexes are simple
  navigation lists, not diagram-heavy content.
- Content is built **one lesson at a time**, not generated in bulk upfront.

## Repository structure

```
system-design/
├── 01-fundamentals/                placeholder for now (networking/OS/DB primitives)
├── 02-high-level-design/
│   └── concepts/                   README.md index + one HTML lesson per topic
├── 03-low-level-design/
│   └── concepts/                   README.md index + HTML lessons
├── 04-case-studies/                one folder per system; hld.html and/or lld.html inside
├── 05-interview-prep/              delivery frameworks, estimation, communication
└── 06-future-modules.md            scope placeholder for topics not built now
```

Case studies are organized **per system, not per design level**: a system
like Ticketmaster or Splitwise needs both an HLD lesson (architecture) and
an LLD lesson (class design + DB schema), and splitting those into separate
top-level `hld/`/`lld/` folders would fragment one system's design story
across two disconnected places. Concept modules stay separate from case
studies because they are reusable building blocks referenced *by* multiple
case studies, not case studies themselves.

## 02-high-level-design/concepts — topic list

Core set, built first:

- Scalability & core metrics (availability, latency/throughput, CAP theorem, consistency models)
- Networking essentials (HTTP, TCP/UDP, DNS, proxies)
- Load balancing (algorithms, DNS load balancing, anycast)
- API design (REST/GraphQL/gRPC, idempotency, rate limiting, authentication — session/token/JWT/OAuth2/SSO)
- Communication patterns (long polling, websockets, SSE, webhooks, queues, pub/sub, delivery semantics, dead letter queues)
- Caching (patterns — cache-aside/read-through/write-through/write-behind, eviction policies, CDN, invalidation, stampede)
- Databases & scaling (SQL vs NoSQL, ACID, sharding, replication, indexing, read replicas, denormalization)
- Architectural patterns (microservices, event-driven, CQRS, serverless, hexagonal)
- Microservices patterns (service discovery, API gateway, circuit breaker, sidecar, service mesh)
- Distributed systems fundamentals (consensus — Paxos/Raft, clocks, leader election, distributed locks, split brain, distributed transactions — 2PC/Saga)
- Data structures for scale (bloom filters, consistent hashing, geohash, HyperLogLog)

Extended set, added later as needed per case study (not built upfront):

- Storage systems (block/file/object storage, distributed file systems)
- Big data processing (batch vs stream, MapReduce, Lambda/Kappa architecture)
- Deployment patterns (CI/CD, blue-green, canary, feature flags)
- Observability (logging, metrics, tracing, alerting)
- Security (SSL/TLS, encryption at rest, RBAC, secrets management)

## 03-low-level-design/concepts — topic list

1. OOP fundamentals
2. Class relationships (association/aggregation/composition)
3. Design principles (SOLID, DRY, KISS, YAGNI)
4. UML diagrams
5. Database design (ER modeling, normalization, schema design process, SQL vs
   NoSQL choice at the object level, indexing for the specific case) —
   grouped here as a peer of the other LLD building-block topics, not as a
   separate top-level module, since it is taught once and then applied
   inside case studies the same way OOP or design patterns are.
6. Design patterns (creational, structural, behavioral)

## 04-case-studies — starter list (expandable over time)

Every case study gets both an `hld.html` and `lld.html` where a genuine
second angle exists (which turned out to be nearly all of them — e.g. a
logging service has both a distributed-ingestion HLD story and a
log-entry/query LLD story). One side is **primary** (built first, the
system's classic interview framing); the other is **secondary** (added
later, opportunistically, once the primary side is done).

| System | Primary | Secondary |
|---|---|---|
| URL Shortener | hld | lld — ID generation service, URL mapping schema |
| Pastebin | hld | lld — paste/expiry schema, ID generation |
| Twitter / News Feed | hld | lld — Tweet/Feed model classes, ranking service |
| Chat / WhatsApp | hld | lld — message/delivery-status state machine |
| YouTube | hld | lld — video/encoding pipeline classes, playback state |
| Uber / Ride-Sharing | hld | lld — ride/driver/rider entity design, trip state machine |
| Dropbox | hld | lld — file/chunk versioning classes, sync conflict resolution |
| Instagram | hld | lld — post/feed model classes |
| Web Crawler | hld | lld — URL frontier, crawler worker classes |
| Search Autocomplete | hld | lld — trie/index class design |
| Rate Limiter | hld | lld — algorithm class design (token bucket, sliding window) |
| Ticketmaster | hld | lld — booking/seat/event schema and class design |
| Splitwise | hld | lld — expense/balance model classes and schema |
| Parking Lot | lld | hld — multi-location network, distributed availability service |
| Chess | lld | hld — online multiplayer platform, matchmaking, game-state sync |
| Elevator | lld | hld — building-network dispatch optimization at scale |
| Connect Four | lld | hld — online multiplayer at scale |
| Amazon Locker | lld | hld — city-wide locker network, availability tracking |
| Movie Ticket Booking | lld | hld — booking platform at scale (overlaps Ticketmaster) |
| Logging Service | lld | hld — distributed log ingestion/aggregation at scale |
| Inventory Management | lld | hld — distributed inventory across warehouses |
| Vending Machine | lld | hld — fleet monitoring/restocking at scale |

The priority build order (primary side of URL Shortener, Rate Limiter,
Ticketmaster, Parking Lot, Chess, Elevator, Splitwise, Amazon Locker first)
stays as the actual near-term plan — see `SYLLABUS.md`. Secondary sides and
the remaining systems are scope for later, added as they're picked up
rather than pre-built.

Each case study applies the relevant concept-module lessons (e.g. a case
study's `lld.html` references the design patterns and database design
concept lessons rather than re-explaining them).

## 05-interview-prep

- HLD delivery framework (clarify requirements → estimate scale → high-level
  design → deep dive → address bottlenecks)
- LLD delivery framework (clarify requirements → identify entities → define
  relationships/class design → apply patterns → walk through key scenarios)
- Back-of-envelope estimation (traffic, storage, bandwidth math)
- Communication and diagramming tips
- Interview pattern library: common recurring patterns across problems
  (real-time updates, handling high write throughput, failure handling,
  idempotency, pagination) — pulled from case studies as they're built,
  not authored standalone

## Lesson template

Every HTML lesson (concept or case-study) follows the same shape so the
course feels consistent:

1. **Problem framing** — why this concept/system matters, when it comes up
2. **Core content** — explanation with diagrams (Mermaid: architecture / ER /
   class / sequence as applicable)
3. **Trade-offs** — alternatives considered and why this approach
4. **Worked example** — applied to a concrete scenario
5. **Interview angle** — how this would come up and be discussed in an
   interview setting
6. **Quick check** — a short quiz or self-check question set

## 06-future-modules.md (not built now)

- Behavioral interviews (CARL framework)
- ML System Design
- 01-fundamentals deep content (networking/OS/DB primitives from scratch)

## Build order

Not fixed rigidly — built incrementally per user direction, starting from
whichever module/lesson is prioritized next in conversation.
