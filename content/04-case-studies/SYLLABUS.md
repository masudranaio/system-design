# Case Studies — Module Syllabus

Detailed case-study list for `content/04-case-studies/`. Top-level
progress lives in [`/SYLLABUS.md`](../../SYLLABUS.md); this file is the
authority on which systems are in scope and which design level(s) each
one covers.

Every system gets both an `hld.mdx` and `lld.mdx` where a genuine second
angle exists (see the design spec's "04-case-studies" section for the
reasoning). One side is **primary** (built first, the system's classic
interview framing), the other **secondary** (added later, opportunistically).

Status: `[ ]` not started, `[~]` in progress, `[x]` done.

## Priority build order

| ID | System | Primary | Secondary | Depends on | Status |
|---|---|---|---|---|---|
| CS-01 | URL Shortener | hld | lld — ID generation service, URL mapping schema | HLD-01, 06, 07 | [ ] |
| CS-02 | Rate Limiter | hld | lld — algorithm class design (token bucket, sliding window) | HLD-01, 05; LLD-03, 06 | [ ] |
| CS-03 | Parking Lot | lld | hld — multi-location network, distributed availability service | LLD-01–05 | [x] |
| CS-04 | Elevator | lld | hld — building-network dispatch optimization at scale | LLD-01–05, 08 | [ ] |
| CS-05 | Chess | lld | hld — online multiplayer platform, matchmaking, game-state sync | LLD-01–04, 08 | [ ] |
| CS-06 | Amazon Locker | lld | hld — city-wide locker network, availability tracking | LLD-01–05 | [x] |
| CS-07 | Splitwise | hld | lld — expense/balance model classes and schema | HLD-01, 07; LLD-01–06 | [ ] |
| CS-08 | Ticketmaster | hld | lld — booking/seat/event schema and class design | HLD-01, 03, 06, 07, 10; LLD-01–06 | [x] |
| CS-09 | Ride-Sharing (Uber-style) | hld | lld — trip/driver/rider entity design, trip state machine, matching-service class design | HLD-01, 03, 06, 08, 10; LLD-01–06 | [ ] |
| CS-10 | Netflix (Video Streaming) | hld | lld — watch-progress/resume-state class design, content-catalog schema | HLD-01, 06, 07, 09, 10; LLD-01–06 | [ ] |
| CS-11 | Food Panda (Food Delivery) | hld | lld — order/restaurant/courier state machine, matching-algorithm class design | HLD-01, 03, 06, 08, 10; LLD-01–06 | [ ] |
| CS-12 | Event Tracking System (log/analytics pipeline) | lld | hld — distributed ingestion/aggregation at scale (promoted from "Logging Service" below) | LLD-01–06 | [ ] |
| CS-13 | Notification Service (email/SMS/push) | lld | hld — multi-provider fan-out and failover at scale | LLD-01–06 | [ ] |

Promoted from the extended list below into this priority table:
Ride-Sharing (was "Uber / Ride-Sharing"), Event Tracking System (was
"Logging Service"). Netflix, Food Panda, and Notification Service are
new additions, not previously in either list.

## Extended list (scope for later, added as picked up)

| System | Primary | Secondary |
|---|---|---|
| Pastebin | hld | lld — paste/expiry schema, ID generation |
| Twitter / News Feed | hld | lld — Tweet/Feed model classes, ranking service |
| Chat / WhatsApp | hld | lld — message/delivery-status state machine |
| YouTube | hld | lld — video/encoding pipeline classes, playback state |
| Dropbox | hld | lld — file/chunk versioning classes, sync conflict resolution |
| Instagram | hld | lld — post/feed model classes |
| Web Crawler | hld | lld — URL frontier, crawler worker classes |
| Search Autocomplete | hld | lld — trie/index class design |
| Connect Four | lld | hld — online multiplayer at scale |
| Movie Ticket Booking | lld | hld — booking platform at scale (overlaps Ticketmaster) |
| Inventory Management | lld | hld — distributed inventory across warehouses |
| Vending Machine | lld | hld — fleet monitoring/restocking at scale |

## Progress

Priority: 3 / 13 primary sides built, 3 / 13 secondary sides built
(Ticketmaster, Parking Lot, Amazon Locker — both sides each). CS-09
through CS-13 (Ride-Sharing, Netflix, Food Panda, Event Tracking,
Notification Service) added 2026-08-27, primary side only for this
pass — secondary sides deferred, same "opportunistic, added later"
pattern as CS-01–08. Note: none of these link back to concept lessons
yet, since HLD/LLD concept modules (0/12 built each) don't exist — each
case study lesson explains needed concepts inline instead, flagged
with `concept-dependency` comments for a future pass to convert to
real links. See the ruling in
[docs/superpowers/plans/TRACKER.md](../../docs/superpowers/plans/TRACKER.md).
