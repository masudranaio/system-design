# System Design Course — Working Rules

This is a personal system design learning repo (HLD + LLD, interview-prep
and reference use), built as a Next.js + MDX app. Scope and topics are
locked in
[docs/superpowers/specs/2026-08-26-system-design-course-outline-design.md](docs/superpowers/specs/2026-08-26-system-design-course-outline-design.md);
its Format/Repository-structure sections are superseded by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md) —
the app/component architecture, design tokens, and folder structure live
there. Lesson-by-lesson build list and progress live in
[SYLLABUS.md](SYLLABUS.md). Read all three before starting work in this
repo if they're not already in context.

## Before writing any lesson

1. **Check `SYLLABUS.md`** for the lesson's ID, objective, and dependencies.
   Make sure the dependency lessons exist first (or flag it if they don't).
2. **Write (or update) the case study's `CHECKLIST.md` first**, in
   `content/04-case-studies/<system>/`, before any MDX is drafted. It
   covers: problem scope (functional/non-functional requirements,
   explicit in-scope/out-of-scope lines), and a checkbox list per lesson
   side (HLD, LLD, and "others" only if a third artifact is genuinely
   needed) covering every diagram, concept, trade-off, pattern, and
   self-check item that lesson must contain. Review this against the
   relevant concept-module dependencies (e.g. LLD-03 for patterns, LLD-05
   for database design) before writing any MDX.
3. **Research the topic before drafting it.** For the specific topic of the
   lesson (not the whole course), search:
   - The reference sources already grouped in the design spec's
     "Reference sources" section, filtered to LLD sources for LLD lessons
     and HLD sources for HLD lessons.
   - The open web (WebSearch/WebFetch) for the topic by name, to pull in
     current terminology, common interview framings, real-world examples,
     and diagram approaches beyond just the reference sites.
4. **Use what you find as reference material, not source text.** Pull
   ideas, structure, terminology, trade-off framing, and diagram
   *approaches* from research. Do not copy paragraphs, code, or diagrams
   verbatim from paywalled or copyrighted course sites — those sources
   exist to inform an original explanation, not to be reproduced. Public
   documentation (e.g. RFCs, official docs, open-source READMEs) can be
   quoted/cited directly when useful.
5. **Diagrams are redrawn, not copied.** If a reference source's diagram is
   a good way to explain something, rebuild it as an original Mermaid
   diagram in this repo's own visual style — don't screenshot or embed
   external diagram images.

## Writing the lesson

- Follow the **Lesson template** in the design spec, as amended by
  [docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md](docs/superpowers/specs/2026-08-26-case-study-lesson-format-and-ticketmaster-design.md)'s
  "Enhanced lesson template" section, for every lesson: problem framing →
  core content (with inline "check yourself" widgets after major
  concepts) → trade-offs → worked example → interview angle → Practice &
  Self-Check (recap quiz + open design challenge with rubric +
  self-score band).
- Concept lessons and case-study lessons are MDX files under
  `content/<module>/`, rendered by the Next.js app via the shared
  `components/lesson/*` widgets (`DiagramPanel`, `QuizItem`, `Rubric`,
  `SectionTracker`) — not standalone HTML. Follow the folder structure,
  component contracts, and design tokens (color/type/layout) in
  [docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md)
  rather than re-deriving them. Preview locally via `npm run dev` before
  considering a lesson done.
- Use Mermaid for every diagram (inside `<DiagramPanel>`): architecture
  diagrams for HLD, ER/class/sequence diagrams for LLD and database
  design.
- A case study's lesson should *apply* the relevant concept lessons rather
  than re-explaining them — link back to the concept lesson instead of
  duplicating its content.
- Each module/case-study folder gets a plain-Markdown `README.md` index
  linking to its lessons — do not make indexes into MDX/HTML pages.

## After writing a lesson

- **Run a completeness pass**: walk the case study's `CHECKLIST.md`
  against the finished lesson and explicitly mark each item covered or
  flag it as dropped. Report gaps out loud rather than silently omitting
  them — don't move to the next step until every checklist item is
  either covered or explicitly called out as cut.
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
