# System Design Course — Working Rules

This is a personal system design learning repo (HLD + LLD, interview-prep
and reference use), built as a Next.js + MDX app. Scope and topics are
locked in
[docs/superpowers/specs/2026-08-26-system-design-course-outline-design.md](docs/superpowers/specs/2026-08-26-system-design-course-outline-design.md);
its Format/Repository-structure sections are superseded by
[docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md](docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md) —
the app/component architecture, design tokens, and folder structure live
there. Content quality rules (prose, diagrams, quizzes, self-check
answers) live in [CONTENT-GUIDE.md](CONTENT-GUIDE.md) — read before
drafting any lesson's actual content, not just its plan. Lesson-by-lesson
build list and progress live in [SYLLABUS.md](SYLLABUS.md). Read all four
before starting work in this repo if they're not already in context.

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

- Follow [CONTENT-GUIDE.md](CONTENT-GUIDE.md) for prose, diagram, quiz,
  and self-check-answer quality — it's the quality bar within each
  section; this list (below) is the shape.
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

## UI verification (any app-shell, component, or pipeline work)

Applies to any task that touches `app/`, `components/`, or rendering
(the Next.js plans in `docs/superpowers/plans/`) — not to content-only
(`.mdx`) work, which is covered by the completeness pass below instead.

- **Never mark UI work done from code review alone.** Start the dev
  server and drive it with the Playwright MCP tools
  (`mcp__plugin_playwright_playwright__*`) — navigate to every route or
  component state the task touched, take a snapshot/screenshot, and read
  it back before reporting the task complete.
- **Test both themes, every time.** Toggle `next-themes` to `light` and
  to `dark` (not just the OS default) and capture/inspect both — a
  contrast or token bug that only shows in one theme is still a bug.
  This repeats and binds `docs/superpowers/specs/2026-08-26-nextjs-mdx-app-migration-design.md`'s
  design-tokens section: every token pair (`--color-*`, light/dark) is
  in scope for this check, not just the ones the task directly edited.
- **Check professional polish, not just "it renders":** text is legible
  against its surface in both themes, spacing/alignment holds at a
  couple of viewport widths, interactive elements (buttons, nav links,
  quiz/rubric widgets) show a visible focus/hover state, no layout
  overflow or horizontal scroll on the page body.
- **Fix what you find before moving on** — a UI task isn't done because
  it compiles; it's done because it was seen, in both themes, and looked
  right.

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
