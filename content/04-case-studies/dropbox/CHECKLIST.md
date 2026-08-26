# Dropbox — Case Study Checklist

Content plan for `hld.mdx` (primary side; `lld.mdx` — file/chunk
versioning classes, sync conflict resolution — deferred, opportunistic
per `SYLLABUS.md`), reviewed before any MDX is drafted. Format follows
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)'s
"Enhanced lesson template", output format per
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](../../../docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md),
diagram/content-density bar per [CONTENT-GUIDE.md](../../../CONTENT-GUIDE.md)'s
"Content-format standard" section.

Status: not started. See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-14) for build priority —
this checklist is a plan, not a built lesson.

Dependencies (`HLD-01, 06, 07, 09, 10; LLD-01–06`) don't exist as concept
lessons yet — every mechanism they'd normally cover is explained inline in
`hld.mdx`, each flagged `{/* concept-dependency: HLD-XX / LLD-XX not yet
built, explained inline */}` for a future pass to swap in real links.

## Problem Scope

Let a user store files in the cloud and keep them in sync — byte-identical
— across every device they run the client on, without re-uploading a
whole file every time one byte changes, and without silently losing data
when the same file is edited on two devices at once.

### Functional Requirements

- [ ] Upload a file and download it back, byte-for-byte identical
- [ ] Sync a file change (create/edit/delete/rename/move) across every
      device linked to the account, without the user manually re-uploading
- [ ] Detect when the same file was edited on two devices before either
      sync completed, and resolve the conflict without silent data loss
- [ ] Share a file or folder with another user (read or read-write)
- [ ] Keep version history for a file and allow reverting to a prior
      version
- [ ] Work offline: queue local edits and reconcile once connectivity
      returns

### Non-Functional Requirements

- [ ] Storage efficiency: near-duplicate and repeated content across
      users/versions should not be stored twice (chunk-level dedup)
- [ ] Sync latency: a change on one device should be visible on another
      device within a few seconds under normal connectivity, not on a
      slow poll interval
- [ ] Bandwidth efficiency: a small edit to a large file should transfer
      only the changed bytes, not the whole file
- [ ] Consistency model across devices: eventual consistency between
      devices is acceptable, but metadata (what the canonical file tree
      looks like) must be strongly consistent on the server
- [ ] Durability: file content must survive storage-node failure (no data
      loss once a write is acknowledged)
- [ ] Scale target: back-of-envelope for ~500M registered users, ~100M
      daily active devices, average file churn per user — sized in the
      lesson's capacity-estimate section, not fixed here

### Explicitly Out of Scope

- [ ] End-to-end encryption implementation details (key management,
      client-side encryption schemes) — only where "encrypted at rest/in
      transit" affects an architecture decision is it mentioned
- [ ] The desktop client's filesystem-watcher internals (inotify/FSEvents/
      ReadDirectoryChangesW specifics) — treated as a black box that
      "detects a local change happened"
- [ ] Real-time collaborative co-editing inside a single document (Google
      Docs–style operational transform/CRDT) — Dropbox syncs whole files/
      chunks, not live cursors inside one open document
- [ ] Payment/billing, storage-quota enforcement UX
- [ ] Mobile-specific camera-upload / photo-backup features

## HLD Checklist (`hld.mdx`)

### 1. Problem framing

- [ ] Frame the defining challenge: keep N devices' local file trees
      consistent with a shared server-side source of truth, cheaply,
      when files are large and most edits touch only a small part of them
- [ ] Explain why this is a bandwidth/storage-efficiency problem first and
      a consistency problem second — contrast with Ticketmaster's
      consistency-under-contention framing so the case study reads as
      architecturally distinct

### 2. Requirements & capacity estimate

- [ ] Reference the functional/non-functional requirements above
- [ ] Back-of-envelope math: total files stored, average file size,
      average chunk count/file, dedup ratio assumption, resulting raw
      vs. actual stored bytes; sync-notification fan-out size per active
      user session

### 3. Core content — architecture diagrams (5+ required, each 2-5 nodes)

- [ ] Diagram 1 — system overview: client (desktop/mobile/web) →
      API gateway → metadata service → block/blob storage service,
      with the notification service as a separate path from client back
      to client
- [ ] Diagram 2 — chunking + content-addressed dedup data flow: file →
      chunker → per-chunk SHA-256 hash → dedup check against existing
      chunk index → store-if-new / reference-if-exists
- [ ] Diagram 3 — delta-sync flow: client computes local chunk hashes,
      diffs against last-known-synced manifest, uploads only changed
      chunks, server updates the file's chunk-list manifest
- [ ] Diagram 4 — conflict-resolution flow: two devices edit the same
      file offline, both reconnect, server detects diverging version
      pointers, produces a conflicted copy for one branch
- [ ] Diagram 5 — notification path: server change → message queue →
      notification service → long-lived connection (long-poll/WebSocket)
      → client "hint" → client pulls delta from metadata service
- [ ] Optional diagram 6 — offline queue: local edit queue on the client,
      flushed and replayed against the server once connectivity returns

### 4. Core content — deep dives (2-3 real-interview branches each)

- [ ] Chunking strategy: fixed-size chunking (simple, but one inserted
      byte shifts every later chunk boundary) vs. content-defined
      chunking with a rolling hash/Rabin fingerprint (boundary anchored to
      content, so only chunks near the edit change) vs. whole-file hashing
      (no delta sync possible at all) — not just "split file into chunks"
- [ ] Deduplication: content-addressable storage keyed by chunk hash,
      cross-user dedup (same chunk uploaded by two accounts stored once),
      reference-counting chunks so a delete doesn't remove a chunk another
      file still points to
- [ ] Metadata vs. blob storage split: why metadata (file tree, chunk
      manifests, permissions) needs a strongly-consistent relational
      store while blob storage is an eventually-consistent, horizontally
      scaled, content-addressed object store (Dropbox's real Magic
      Pocket / MySQL+Vitess split named as a concrete reference point)
- [ ] Sync conflict detection: version-vector/version-counter per file
      vs. last-write-wins timestamp comparison — why a naive timestamp
      compare loses data on clock skew
- [ ] Change notification: long-polling vs. WebSocket vs. plain polling,
      and the "notification is a hint, not the payload" principle (client
      always re-pulls the authoritative delta from metadata service
      rather than trusting the push payload)
- [ ] Offline support: local edit queue, optimistic local apply, replay/
      reconciliation on reconnect, and what happens when a queued local
      edit conflicts with a server-side change that landed while offline

### 5. Trade-offs

- [ ] Block-level (chunked) sync vs. file-level sync: bandwidth/storage
      win vs. added complexity (chunk manifest bookkeeping, reassembly)
- [ ] Fixed-size chunking vs. content-defined chunking: simplicity/speed
      vs. dedup quality under mid-file edits
- [ ] Last-write-wins vs. conflicted-copy resolution: simpler UX/no manual
      merge vs. guaranteed no silent data loss
- [ ] Long-polling vs. WebSocket for the notification channel: server
      connection-cost/complexity vs. latency and battery/connection
      overhead on mobile clients
- [ ] Strong consistency for metadata vs. eventual consistency for blob
      replication: why the split is deliberate rather than uniform

### 6. Worked example

- [ ] Sequence diagram: user edits a 200MB file on Device A (offline),
      then edits the same file on Device B before A reconnects; trace
      chunk-level diff computation, upload of changed chunks from B,
      A's reconnect + conflict detection, and the conflicted-copy outcome

### 7. Interview angle

- [ ] Follow-up: how would you support files edited by many collaborators
      simultaneously (why this pushes toward OT/CRDT, out of scope here)
- [ ] Follow-up: how do you handle a single file that's larger than
      available disk space on a "selective sync" mobile client
- [ ] Follow-up: how do you detect and recover from a corrupted/partial
      chunk upload

### 8. Practice & Self-Check

- [ ] Recap quiz (5-8 items) spanning chunking strategy, dedup, metadata/
      blob split, and conflict resolution
- [ ] Open design challenge: "extend the design to support shared team
      folders with per-user permissions and a shared version history"
      with an independently-checkable rubric and self-score band

## Completeness Pass Log

_(fill in after `hld.mdx` is drafted — walk every item above against the
finished lesson, mark covered/dropped, per `CLAUDE.md`'s "After writing a
lesson" step.)_
