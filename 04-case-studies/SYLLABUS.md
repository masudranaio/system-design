# Case Studies — Module Syllabus

Detailed case-study list for `04-case-studies/`. Top-level progress lives
in [`/SYLLABUS.md`](../SYLLABUS.md); this file is the authority on which
systems are in scope and which design level(s) each one covers.

Every system gets both an `hld.html` and `lld.html` where a genuine second
angle exists (see the design spec's "04-case-studies" section for the
reasoning). One side is **primary** (built first, the system's classic
interview framing), the other **secondary** (added later, opportunistically).

Status: `[ ]` not started, `[~]` in progress, `[x]` done.

## Priority build order

| ID | System | Primary | Secondary | Depends on | Status |
|---|---|---|---|---|---|
| CS-01 | URL Shortener | hld | lld — ID generation service, URL mapping schema | HLD-01, 06, 07 | [ ] |
| CS-02 | Rate Limiter | hld | lld — algorithm class design (token bucket, sliding window) | HLD-01, 05; LLD-03, 06 | [ ] |
| CS-03 | Parking Lot | lld | hld — multi-location network, distributed availability service | LLD-01–05 | [ ] |
| CS-04 | Elevator | lld | hld — building-network dispatch optimization at scale | LLD-01–05, 08 | [ ] |
| CS-05 | Chess | lld | hld — online multiplayer platform, matchmaking, game-state sync | LLD-01–04, 08 | [ ] |
| CS-06 | Amazon Locker | lld | hld — city-wide locker network, availability tracking | LLD-01–05 | [ ] |
| CS-07 | Splitwise | hld | lld — expense/balance model classes and schema | HLD-01, 07; LLD-01–06 | [ ] |
| CS-08 | Ticketmaster | hld | lld — booking/seat/event schema and class design | HLD-01, 03, 06, 07, 10; LLD-01–06 | [ ] |

## Extended list (scope for later, added as picked up)

| System | Primary | Secondary |
|---|---|---|
| Pastebin | hld | lld — paste/expiry schema, ID generation |
| Twitter / News Feed | hld | lld — Tweet/Feed model classes, ranking service |
| Chat / WhatsApp | hld | lld — message/delivery-status state machine |
| YouTube | hld | lld — video/encoding pipeline classes, playback state |
| Uber / Ride-Sharing | hld | lld — ride/driver/rider entity design, trip state machine |
| Dropbox | hld | lld — file/chunk versioning classes, sync conflict resolution |
| Instagram | hld | lld — post/feed model classes |
| Web Crawler | hld | lld — URL frontier, crawler worker classes |
| Search Autocomplete | hld | lld — trie/index class design |
| Connect Four | lld | hld — online multiplayer at scale |
| Movie Ticket Booking | lld | hld — booking platform at scale (overlaps Ticketmaster) |
| Logging Service | lld | hld — distributed log ingestion/aggregation at scale |
| Inventory Management | lld | hld — distributed inventory across warehouses |
| Vending Machine | lld | hld — fleet monitoring/restocking at scale |

## Progress

Priority: 0 / 8 primary sides built, 0 / 8 secondary sides built.
