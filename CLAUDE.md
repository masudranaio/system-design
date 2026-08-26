# System Design Course — Working Rules

This is a personal system design learning repo (HLD + LLD, interview-prep
and reference use). Scope and structure are locked in
[docs/superpowers/specs/2026-08-26-system-design-course-outline-design.md](docs/superpowers/specs/2026-08-26-system-design-course-outline-design.md).
Lesson-by-lesson build list and progress live in
[SYLLABUS.md](SYLLABUS.md). Read both before starting work in this repo if
they're not already in context.

## Before writing any lesson

1. **Check `SYLLABUS.md`** for the lesson's ID, objective, and dependencies.
   Make sure the dependency lessons exist first (or flag it if they don't).
2. **Research the topic before drafting it.** For the specific topic of the
   lesson (not the whole course), search:
   - The reference sources already grouped in the design spec's
     "Reference sources" section, filtered to LLD sources for LLD lessons
     and HLD sources for HLD lessons.
   - The open web (WebSearch/WebFetch) for the topic by name, to pull in
     current terminology, common interview framings, real-world examples,
     and diagram approaches beyond just the reference sites.
3. **Use what you find as reference material, not source text.** Pull
   ideas, structure, terminology, trade-off framing, and diagram
   *approaches* from research. Do not copy paragraphs, code, or diagrams
   verbatim from paywalled or copyrighted course sites — those sources
   exist to inform an original explanation, not to be reproduced. Public
   documentation (e.g. RFCs, official docs, open-source READMEs) can be
   quoted/cited directly when useful.
4. **Diagrams are redrawn, not copied.** If a reference source's diagram is
   a good way to explain something, rebuild it as an original Mermaid
   diagram in this repo's own visual style — don't screenshot or embed
   external diagram images.

## Writing the lesson

- Follow the **Lesson template** in the design spec for every lesson:
  problem framing → core content → trade-offs → worked example → interview
  angle → quick check.
- Concept lessons and case-study lessons are self-contained interactive
  HTML pages, published as Claude Artifacts (see design spec's "Format"
  section for why). Use the `artifact-design` skill before drafting one.
- Use Mermaid for every diagram: architecture diagrams for HLD, ER/class/
  sequence diagrams for LLD and database design.
- A case study's lesson should *apply* the relevant concept lessons rather
  than re-explaining them — link back to the concept lesson instead of
  duplicating its content.
- Each module/case-study folder gets a plain-Markdown `README.md` index
  linking to its lessons — do not make indexes into HTML pages.

## After writing a lesson

- Update `SYLLABUS.md`: flip the lesson's checkbox/status and update the
  progress counters at the bottom.
- If research surfaced a genuinely new topic, case study, or a
  reference source worth tracking, add it to the design spec (topic
  lists) or `SYLLABUS.md` (lesson list) rather than letting it live only
  in conversation — but don't expand scope without checking with the user
  first, per the locked spec's build order.

## General

- Build one lesson at a time. Don't bulk-generate multiple lessons in one
  pass unless explicitly asked.
- Don't build a case study's secondary HLD/LLD side, or move to a
  lower-priority system, ahead of the priority order in `SYLLABUS.md`
  without checking first.
- Git identity for this repo is already configured locally
  (`masud.cseian@gmail.com` / Masud Rana) — don't reconfigure it.
- `.vscode/` is gitignored; don't remove it from `.gitignore`.
