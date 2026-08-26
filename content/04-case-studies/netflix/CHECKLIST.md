# Netflix (Video Streaming) — Case Study Checklist

Content plan for `hld.mdx`, reviewed before it is drafted. Produced per
[docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](../../../docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)
(enhanced lesson template) and
[CONTENT-GUIDE.md](../../../CONTENT-GUIDE.md)'s Content-format standard
(more diagrams, more granular topic coverage, bullets/tables over prose).

Status: not started. See [SYLLABUS.md](../../../SYLLABUS.md) /
[04-case-studies/SYLLABUS.md](../SYLLABUS.md) (CS-10) for build priority —
this checklist is a plan, not a built lesson. Primary side only this pass
(`hld.mdx`); the LLD secondary side (watch-progress/resume-state class
design, content-catalog schema) is deferred to a later, opportunistic
pass, same as the rest of the CS-09–15 batch — see the LLD section at the
bottom for its placeholder scope note.

## Problem Scope

Let a member browse a personalized catalog and stream any title
smoothly, at the best quality their network supports, on any device, from
anywhere in the world — without re-buffering and without the origin
infrastructure melting under global concurrent viewership.

### Functional Requirements

- [ ] Browse/search a personalized content catalog (titles, metadata,
      artwork, episode listings)
- [ ] Play a title with adaptive-bitrate streaming (quality shifts with
      available bandwidth, no manual selection required)
- [ ] Resume playback from the last-watched position, per profile, across
      devices
- [ ] Personalized recommendation rows (e.g. "Because You Watched",
      "Top Picks") on the home screen
- [ ] Studio-to-catalog content pipeline: ingest a source master, encode
      it into a full bitrate/resolution ladder, and publish it to the
      catalog once ready

### Non-Functional Requirements

- [ ] Low playback startup latency (time from pressing "play" to first
      frame, target low single-digit seconds)
- [ ] Low rebuffer ratio (fraction of playback time spent stalled waiting
      for data) even on constrained or variable networks
- [ ] Global scale: hundreds of millions of concurrent streaming
      sessions worldwide, majority of viewing hours served from
      near-edge/ISP-embedded caches rather than a central origin
- [ ] High origin cache-hit ratio — the origin (S3 + control plane) must
      not be a bottleneck for popular, predictable-demand content
- [ ] Bandwidth-cost awareness: video is the dominant cost driver, so
      encoding efficiency and cache placement both matter economically,
      not just for latency
- [ ] Multi-region availability — a regional outage should not take down
      playback globally

### Explicitly Out of Scope

- [ ] Content licensing, DRM legal/contractual details (Widevine/
      FairPlay/PlayReady are named as the mechanism, not explained at the
      cryptographic-protocol level)
- [ ] The internals of the ML ranking/recommendation model (feature
      engineering, model architecture, training) — only the system shape
      (offline batch scoring vs. online re-ranking, candidate generation
      vs. ranking split) is covered
- [ ] Billing/subscription/account management
- [ ] Live/linear streaming (sports, live events) — this lesson covers
      video-on-demand only

## HLD Checklist (`hld.mdx`)

### 1. Problem framing

- [ ] Frame video-on-demand at global scale as two coupled problems:
      (1) getting bytes to the user fast and cheaply (CDN/delivery), and
      (2) getting the *right* bytes in front of the user (catalog +
      recommendations) — most of the lesson's structure follows this
      split
- [ ] Explain why Netflix's traffic pattern (long-lived, resumable,
      progressively-consumed video sessions with a highly skewed
      popularity distribution) makes it a caching/CDN problem first and
      a database-scale problem second, unlike e.g. a social feed

### 2. Requirements & capacity estimate

- [ ] Reference the functional/non-functional requirements above
- [ ] Back-of-envelope math: concurrent streams → aggregate egress
      bandwidth (e.g. N million concurrent streams x ~5 Mbps average
      bitrate → aggregate Tbps), and why that number rules out serving
      primarily from centralized origin servers

### 3. Core content — diagrams (5 minimum, each single-concern)

- [ ] Diagram 1 — end-to-end system architecture: client → edge/CDN
      (Open-Connect-style) → API gateway → catalog/metadata service,
      streaming/playback service, recommendation service, user/profile
      service, each with its own datastore
- [ ] Diagram 2 — upload/transcoding pipeline: studio master upload →
      object storage → distributed encoding workers producing the
      bitrate/resolution ladder → segmenting + manifest generation
      (HLS/DASH) → publish to catalog
- [ ] Diagram 3 — CDN/edge delivery architecture: origin → regional/
      origin-shield tier → ISP-embedded edge caches (Open-Connect-style)
      → client, with the nightly proactive-fill path drawn separately
      from the (rare) cache-miss pull path
- [ ] Diagram 4 — adaptive bitrate client-side logic: client buffer/
      throughput monitor feeding a bitrate-selection decision loop that
      picks the next segment's quality from the manifest
- [ ] Diagram 5 — catalog/metadata service: title/asset/manifest
      relationships and how a playback request resolves to a specific
      set of CDN segment URLs
- [ ] Optional diagram 6 — recommendation pipeline shape: viewing-event
      ingestion → offline/batch candidate generation & model
      scoring → precomputed per-profile row cache → home-screen read
      path, kept separate from the main architecture diagram

### 4. Core content — deep dives (2-3 branches each, not one-liners)

- [ ] **Encoding & the bitrate ladder**: fixed ladder vs. per-title
      encoding (analyze each title's complexity to pick the minimum
      bitrate per resolution rung) vs. per-shot/per-scene encoding
      (finer-grained optimization within a title); why animation and a
      high-action film shouldn't share a ladder
- [ ] **Segmenting & manifests**: why video is chunked into short
      segments (2-10s) instead of streamed as one file; HLS (.m3u8) vs.
      DASH (.mpd) manifest formats; how a manifest lets the client switch
      quality mid-playback without restarting
- [ ] **CDN edge caching deep dive**: (a) proactive/scheduled fill during
      off-peak hours vs. reactive pull-on-miss, and why predictable
      popularity makes proactive fill viable at Netflix's scale; (b)
      cache invalidation on a new release or a content fix (versioned
      cache keys / selective re-fill rather than a blanket flush); (c)
      origin shield / multi-tier caching — why edge caches don't all hit
      the origin directly on a miss
- [ ] **Adaptive bitrate algorithm**: throughput-based estimation vs.
      buffer-based estimation (e.g. BOLA-style) for choosing the next
      segment's bitrate; the startup-quality vs. rebuffer-risk trade-off
      the algorithm is balancing every few seconds
- [ ] **Catalog/metadata service design**: read-heavy, globally
      replicated metadata (titles, artwork variants, availability by
      region/licensing window) served from caches in front of a
      source-of-truth store; why regional content availability is a
      catalog-service concern, not a CDN concern
- [ ] **Recommendations at a high level**: candidate generation (which
      titles could plausibly be shown) vs. ranking (ordering them per
      profile); offline/batch precomputation of rows vs. online
      re-ranking for freshness; why "Continue Watching" is a different
      (simpler, event-driven) code path than the ML-ranked rows

### 5. Trade-offs

- [ ] Push (proactive) CDN caching vs. pull (reactive, cache-on-miss)
      caching — predictable-demand video vs. long-tail/unpredictable
      content
- [ ] Pre-transcode the full bitrate ladder upfront vs. transcode
      on-demand at request time — storage/compute cost vs. publish
      latency and flexibility
- [ ] HLS vs. DASH as the manifest/segmenting format — ecosystem/device
      support vs. codec flexibility
- [ ] Precomputed (offline) recommendation rows vs. real-time
      (online) ranking — staleness vs. compute cost and freshness
- [ ] Origin-shield/multi-tier caching vs. every edge node hitting
      origin directly — origin load protection vs. added hop latency
      on a cache miss

### 6. Worked example

- [ ] Sequence diagram tracing one playback session end-to-end: client
      requests manifest → catalog/streaming service resolves it →
      client's ABR logic picks an initial low-risk bitrate → client
      fetches segments from the nearest edge cache (cache hit) →
      throughput improves → client steps up to a higher-bitrate segment
      mid-playback

### 7. Interview angle

- [ ] Follow-up: "a title just released and everyone wants it at once —
      how does the CDN avoid a thundering-herd miss storm on the
      origin?"
- [ ] Follow-up: "user's network drops mid-playback — walk through what
      the client and server each do"
- [ ] Follow-up: "how would you extend this to support live/linear
      content?" (used to probe understanding of what VOD-specific
      assumptions — segment pre-availability, proactive fill — break
      for live)

### 8. Practice & Self-Check

- [ ] Recap quiz (5-8 items) spanning: per-title encoding rationale,
      HLS/DASH manifest role, proactive vs. reactive CDN fill, ABR
      decision logic, origin-shield purpose
- [ ] Open challenge: "design the resume-playback ('Continue Watching')
      feature so it works correctly across devices with the least
      possible write latency" with rubric

## LLD Checklist (`lld.mdx`) — deferred

Secondary side, deferred per `SYLLABUS.md`'s CS-10 row and the batch-wide
"primary side only this pass" note. When picked up, scope is
watch-progress/resume-state class design and content-catalog schema —
plan it as its own checklist pass (entities, state machine for playback
position sync, schema/indexing for catalog + per-profile watch state)
before drafting `lld.mdx`, per `CLAUDE.md`'s checklist-first rule. Not
expanded further here to avoid planning ahead of the locked build order.
