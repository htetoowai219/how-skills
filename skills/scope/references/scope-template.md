# Scope File Template (`docs/scope/SCOPE.md`)

Use this clean, scannable single-file structure when writing or updating `docs/scope/SCOPE.md`.

## Formatting Rules

1. **Each fact lives once:** The `At a Glance` table gives quick orientation (`#`, `Phase`, `Status`, `Plan`). Detailed intent, `Done when:` criteria, checkboxes, and code pointers live inside each phase section.
2. **Zero bloat:** Never dump atomic implementation tasks into `SCOPE.md`. Atomic tasks live in `docs/scope/plans/<NN-slug>.md`. Before `/architect` runs, a `Planned` phase has a single checkbox (`- [ ] Architect plan: /architect <Phase Name>`). When `/architect` writes the plan, it ticks that box and rolls up 2–5 coarse milestones under `Build phase`.
3. **Leave stack choices open:** Unless the user explicitly dictated tools or the repo already has code, write `Deferred to /architect per phase` on the `**Tech Stack:**` line. `/architect` updates this line as stack choices are confirmed.
4. **Canonical Statuses:** Use exact casing everywhere (`At a Glance` table, phase heading suffix, and plan files):
   - `Planned` — Scoped by `/scope`, awaiting `/architect`.
   - `Architected` — Plan confirmed and saved in `docs/scope/plans/<NN-slug>.md`, awaiting `/develop`.
   - `In Progress` — Build started in `/develop` (or partially built in brownfield).
   - `Developed` — Implementation finished in `/develop`; awaiting `/check verify`.
   - `Verified` — Audited and passed in `/check verify`.
   - `Existing` — Pre-existing brownfield capability (for context only; untouched by pipeline).
   - `Dropped` — Cut during `/scope` replanning (kept for history; skipped by pipeline).

---

## `docs/scope/SCOPE.md` Template

```markdown
# Scope: <Project Name>

<1 to 2 plain sentences describing what the project does and who it serves.>

- **Project Mode:** <Casual / Hobby | Prototype / MVP | Production / Commercial> — <1-line rigor summary, e.g. "Fast working v1; solid core loop, skip enterprise ceremony (Cap: 2–4 phases)">
- **Build Approach:** <Tracer Bullet | Skateboard | Facade | Journey> (<1-line principle>)
- **Source Idea:** `docs/scope/idea.md` <!-- Omit line if no idea.md exists -->
- **Tech Stack:** <Deferred to /architect per phase | Locked stack choices from user or existing repo>

## Non-Goals & Deferred
Out of scope for the current roadmap so phases stay focused:
- **<Item 1>:** <1-line note on why it is out of scope or saved for v2>
- **<Item 2>:** <1-line note>

## At a Glance

| # | Phase | Status | Plan |
|---|---|---|---|
| 01 | <Phase 01 Name> | Planned | — |
| 02 | <Phase 02 Name> | Planned | — |
| 03 | <Phase 03 Name> | Planned | — |

---

## Phases

### 01. <Phase 01 Name> · Planned
<1 to 2 plain sentences explaining what this phase delivers and why it comes here.>
**Done when:** <Concrete, observable outcomes that prove this phase works.>
- [ ] Architect plan: `/architect <Phase 01 Name>`

### 02. <Phase 02 Name> · Planned
<1 to 2 plain sentences explaining what this phase delivers.>
**Done when:** <Concrete, observable outcomes.>
- [ ] Architect plan: `/architect <Phase 02 Name>`

### 03. <Phase 03 Name> · Planned
<1 to 2 plain sentences explaining what this phase delivers.>
**Done when:** <Concrete, observable outcomes.>
- [ ] Architect plan: `/architect <Phase 03 Name>`
```

---

## How a Phase Section Evolves Across the 5-Skill Pipeline

### 1. Created by `/scope` (`Planned`)
```markdown
### 01. Core Bookmark Loop · Planned
Scaffold the app and deliver the core add, tag, and filter bookmark flow end to end.
**Done when:** You can save a URL with tags, see it persist across reloads, and filter bookmarks by tag.
- [ ] Architect plan: `/architect Core Bookmark Loop`
```

### 2. Updated by `/architect` (`Architected`)
```markdown
### 01. Core Bookmark Loop · Architected
Scaffold the app and deliver the core add, tag, and filter bookmark flow end to end.
**Done when:** You can save a URL with tags, see it persist across reloads, and filter bookmarks by tag.
- [x] Architect plan: `/architect Core Bookmark Loop`
- [ ] Build phase: `/develop Core Bookmark Loop`
  - [ ] Project scaffold & SQLite bookmark/tag schema
  - [ ] Save, list, and tag-filter API handlers
  - [ ] Bookmark list UI with add form and tag filter bar
- [ ] Verify phase: `/check verify Core Bookmark Loop`
Plan: [01-core-bookmark-loop.md](plans/01-core-bookmark-loop.md)
```
*(In `Production / Commercial` mode, `/architect` may also append `- [ ] Pre-PR code review: /check review Core Bookmark Loop` when warranted.)*

### 3. Updated by `/develop` (`Developed`)
```markdown
### 01. Core Bookmark Loop · Developed
Scaffold the app and deliver the core add, tag, and filter bookmark flow end to end.
**Done when:** You can save a URL with tags, see it persist across reloads, and filter bookmarks by tag.
- [x] Architect plan: `/architect Core Bookmark Loop`
- [x] Build phase: `/develop Core Bookmark Loop`
  - [x] Project scaffold & SQLite bookmark/tag schema
  - [x] Save, list, and tag-filter API handlers
  - [x] Bookmark list UI with add form and tag filter bar
- [ ] Verify phase: `/check verify Core Bookmark Loop`
Plan: [01-core-bookmark-loop.md](plans/01-core-bookmark-loop.md) · Code: `src/`
```

### 4. Updated by `/check verify` (`Verified`)
```markdown
### 01. Core Bookmark Loop · Verified
Scaffold the app and deliver the core add, tag, and filter bookmark flow end to end.
**Done when:** You can save a URL with tags, see it persist across reloads, and filter bookmarks by tag.
- [x] Architect plan: `/architect Core Bookmark Loop`
- [x] Build phase: `/develop Core Bookmark Loop`
  - [x] Project scaffold & SQLite bookmark/tag schema
  - [x] Save, list, and tag-filter API handlers
  - [x] Bookmark list UI with add form and tag filter bar
- [x] Verify phase: `/check verify Core Bookmark Loop`
Plan: [01-core-bookmark-loop.md](plans/01-core-bookmark-loop.md) · Code: `src/`
```

---

## Brownfield Enrollment (Existing Codebases)

When `/scope` runs on a repo that already has shipped code, record existing capabilities briefly above `## Phases` (and in `At a Glance` with `#` set to `A`, `B`, ...) so `/architect` and `/develop` have accurate context without rebuilding them:

```markdown
## Existing Capabilities (Pre-Workflow)

### A. User Auth & Sessions · Existing
Email/password login and cookie sessions already live in `src/modules/auth/`.
```
