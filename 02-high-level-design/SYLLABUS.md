# High-Level Design — Module Syllabus

Detailed lesson breakdown for `02-high-level-design/concepts/`. Top-level
progress lives in [`/SYLLABUS.md`](../SYLLABUS.md); this file is the
authority on what each HLD lesson actually covers.

Researched primarily against AlgoMaster's System Design course (24 topic
areas / 177 lessons) and System Design Interviews course, cross-checked
against HelloInterview's System Design "in a hurry" guide and DesignGurus —
see the design spec's Reference sources for links. Each section below lists
sub-topics a lesson should cover; sub-topics are not separate HTML pages —
one lesson page covers its whole row unless noted otherwise.

Status: `[ ]` not started, `[~]` in progress, `[x]` done.

## Core set (build first)

| ID | Lesson | Sub-topics | Status |
|---|---|---|---|
| HLD-01 | Scalability & Core Metrics | Availability, Reliability, SPOF, Latency vs Throughput vs Bandwidth, CAP theorem, Consistency models (strong/eventual/causal), Consistent hashing | [ ] |
| HLD-02 | Networking Essentials | OSI model, IP addressing, TCP vs UDP, HTTP/HTTPS, DNS, Checksums, Forward/reverse proxy | [ ] |
| HLD-03 | Load Balancing | Load balancer types (L4/L7), Algorithms (round robin, least connections, consistent hashing), DNS load balancing, Anycast routing | [ ] |
| HLD-04 | API Design | API basics, Idempotency, Data formats, REST, GraphQL, gRPC, API Gateways, Rate limiting, Authentication/Authorization, Session vs Token auth, JWT, OAuth2, SSO | [ ] |
| HLD-05 | Communication Patterns | Long polling, WebSockets, Server-Sent Events, Webhooks, WebRTC, Sync vs Async, Message queues, Pub/Sub, Change Data Capture, Delivery semantics (at-most/at-least/exactly-once), Dead letter queues | [ ] |
| HLD-06 | Caching | Caching fundamentals, Patterns (cache-aside, read-through, write-through, write-behind), Eviction policies (LRU/LFU/FIFO), CDN, Distributed caching, Invalidation, Cache stampede, Cache warming | [ ] |
| HLD-07 | Databases & Scaling | Database types (relational/document/key-value/wide-column/graph/time-series/search/vector), SQL vs NoSQL, ACID transactions, B-Trees vs LSM Trees, Durability, Indexing, Partitioning, Query optimization, Read replicas, Denormalization, Materialized views, Connection pooling, Sharding, Compression | [ ] |
| HLD-08 | Architectural Patterns | Client-server, Monolithic, Microservices, Serverless, Event-driven, Peer-to-peer, Hexagonal, CQRS, Event sourcing | [ ] |
| HLD-09 | Microservices Patterns | Service discovery, API gateway, Backend-for-frontend, Sidecar, Circuit breaker, Bulkhead, Strangler fig, Service mesh | [ ] |
| HLD-10 | Distributed Systems Fundamentals | Why distribution is hard, Network partitions, Split brain, Heartbeats, Failure handling, Clock synchronization, Logical clocks, Lamport timestamps, Vector clocks, Consensus algorithms overview, Paxos, Raft, Leader election, Distributed locks, Gossip protocol, CRDTs, Operational transformation | [ ] |
| HLD-11 | Data Structures for Scale | Geohash, Quad trees, R-trees, S2/H3, Bloom filters, Cuckoo filters, HyperLogLog, Count-Min sketch, MinHash, Skip lists, Merkle trees | [ ] |
| HLD-12 | Trade-offs | Vertical vs horizontal scaling, Concurrency vs parallelism, Push vs pull, Stateful vs stateless, Long polling vs WebSockets, Strong vs eventual consistency — collects comparisons that recur across other lessons into one interview-ready reference | [ ] |

Note on HLD-10: consensus algorithms (Paxos, Raft) and leader election are
substantial enough that if HLD-10 gets too long as one lesson, it can split
into HLD-10a (failure handling & clocks) and HLD-10b (consensus & leader
election) when actually drafted — call this at write time, not now.

Note on HLD-12: added after a gap-check against AlgoMaster's dedicated
"Tradeoffs" section, which exists as its own module there rather than
folded into other lessons — interviewers often ask these as direct
comparison questions, so a single reference lesson pays off.

## Extended set (built on demand, not pre-built)

| Topic | Sub-topics |
|---|---|
| Storage Systems | Block vs File vs Object storage, Distributed file systems, Erasure coding |
| Distributed Transactions | Transaction problems, Two-Phase Commit, Three-Phase Commit, SAGA pattern, Outbox pattern |
| Big Data Processing | Batch vs Stream processing, MapReduce, ETL pipelines, Data lakes, Data warehousing, Data lakehouse, Lambda/Kappa architectures, Streaming engines |
| Deployment Patterns | Deployment strategies, CI/CD pipelines, Rolling/Blue-green deployments, Canary releases, Feature flags, A/B testing, Schema migrations, Rollbacks |
| Observability | Three pillars (logs/metrics/traces), Log aggregation, Correlation IDs, Metrics, Alerting, Dashboards, Distributed tracing |
| Advanced Security | SSL/TLS, Encryption at rest, Secrets management, Password management, RBAC, SAML |

These get pulled into the core set only when a case study actually needs
them (e.g. Distributed Transactions before Ticketmaster's HLD lesson).

## Progress

Core: 0 / 12 built.
