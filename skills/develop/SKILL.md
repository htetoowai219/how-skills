---
name: develop
description: Implements a planned phase or feature strictly from its approved plan in docs/scope/plans/<NN-slug>.md, keeping code complexity proportional to Project Mode, running build/typecheck sanity checks, and updating status to Developed. Hard-stops if no plan doc exists. Do NOT use for scoping (/scope), architecture planning (/architect), or final verification sign-off (/check).
license: MIT
compatibility: Designed for Agent Skills-compatible tools (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
metadata:
  source: custom
  author: "how"
  version: "1.0.0"
allowed-tools:
  - read_file
  - run_command
  - edit_file
  - write_file
  - ask_question
---

# Develop

Turns an approved phase plan in `docs/scope/plans/<NN-slug>.md` plus codebase conventions into clean, working code.

## Output Style & Discipline

Talk to `you` directly and plainly like a senior implementation partner. `/develop` **gates, then acts**: do not re-litigate architecture decisions `/architect` already settled, and do not open a new design interview. Read the plan, match the codebase, build cleanly, verify compilation/types, update build progress, and hand off to `/check verify`.

## Artifact Ownership

- **Writes:** Application code, styles/tokens, configs, and migrations called for by the phase plan.
- **Updates `docs/scope/plans/<NN-slug>.md`:**
  - Sets `**Status:** In Progress` at start, then `**Status:** Developed` when implementation finishes.
  - Ticks `[x]` on completed tasks inside `## Build Plan`.
  - Logs minor unavoidable implementation tweaks under `## Implementation Notes`.
  - **Never** ticks `- [ ]` items inside `## Verification Checklist` (owned strictly by `/check verify`).
- **Updates `docs/scope/SCOPE.md`:**
  - Advances phase status (`Architected` → `In Progress` → `Developed`) in `At a Glance` and the phase heading.
  - Ticks `- [x] Build phase` and completed milestone sub-boxes, and fills `Code: <paths>` on the pointer line.
  - **Never** ticks `- [ ] Verify phase` or marks a phase `Verified`.

---

## Execution

### Step 0: Hard Plan Gate & Pre-Flight Checks (Mandatory First Step)

1. **Locate `docs/scope/SCOPE.md` and the phase's plan doc:**
   - Read `docs/scope/SCOPE.md` (if present).
   - If `/develop` was called with a phase name/number, match that phase row. If called with no argument, find the active `In Progress` or first `Architected` phase in `SCOPE.md`.
   - Resolve the plan file in `docs/scope/plans/<NN-slug>.md`.
2. **Hard Stop Gate if No Plan Exists:**
   - If no plan doc exists in `docs/scope/plans/` for the target phase (e.g., the phase is still `Planned`, or `docs/scope/plans/` is missing): **STOP immediately. Write zero code.**
   - Tell `you` plainly:
     > *"No plan doc found in `docs/scope/plans/` for `<Phase Name>` yet. Run `/architect <Phase Name>` first to lock the design and stack, then come back to `/develop <Phase Name>`."*
3. **Git & Workspace Sanity Check (fast, non-blocking warnings):**
   - Check `git status --short` (skip silently if not a git repo).
   - If unrelated uncommitted changes exist in files this phase will touch, warn `you` briefly before editing so work does not tangle.
   - Check if the repo has a scaffold/manifest (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, etc.). If no project exists yet and this phase's `## Build Plan` includes initial project scaffolding, initialize the project cleanly per the plan's chosen stack; otherwise stop and flag if a non-scaffold phase has no project to build into.

### Step 1: Load Context, Classify Track & Check Resume Point

1. **Read the plan doc in full:**
   - Extract **Project Mode** (`Casual / Hobby` | `Prototype / MVP` | `Production / Commercial`), **Build Approach**, **Stack & Libraries**, **Requirements (`AC-1..N`)**, **Technical Design** (including Value Sourcing & Key Invariants), and **Build Plan**.
   - Check **Input & Contract Completeness:** If a load-bearing detail required by `AC-1..N` is genuinely missing or contradictory in the plan, pause and ask `you` via interactive picker before guessing.
2. **Match local codebase conventions:**
   - Read `AGENTS.md` (if present) and 2–3 neighboring source files in the target directories to match naming, imports, error handling, and folder layout.
   - If the plan's `**Convention Skills:**` line names an installed skill (or one clearly governs this stack), read its `SKILL.md` on demand and follow its conventions.
3. **Classify the build track** and read only the matching guide(s):
   - **Logical** (backend APIs, schemas/migrations, CLI, services, state/data logic) → read [Logical Track Guide](references/logical-guide.md).
   - **UI** (pages, screens, layouts, components, styling/tokens) → read [UI Track Guide](references/ui-guide.md).
   - **Both** (full-stack vertical slice) → read both guides. Follow the plan's **Build Approach** order (data/API first so UI binds to real data under `Tracer Bullet`/`Skateboard`/`Journey`; UI on typed mocks first under `Facade`).
4. **Resume check:**
   - Inspect `## Build Plan` in `docs/scope/plans/<NN-slug>.md`. Skip any tasks already ticked `[x]`. If resuming partway through, state where you are picking up (*"2/5 build tasks already done; resuming at task 3"*).
   - Update `**Status:** In Progress` in the plan doc and `In Progress` in `docs/scope/SCOPE.md` if not already set.

### Step 2: Proportional, Plan-Faithful Implementation

Work through unchecked `## Build Plan` tasks in order on the main thread:

1. **Keep complexity proportional to `Project Mode`:**
   - **Casual / Hobby:** Write clean, direct, flat code. Zero unnecessary interfaces, factories, or enterprise wrappers. Only install packages the plan calls for.
   - **Prototype / MVP:** Modular, readable code with input validation at boundaries, clean state handling, and working empty/loading/error states.
   - **Production / Commercial:** Full type safety (no lazy `any` escapes), strict boundary validation, ownership/RBAC enforcement, pagination, idempotency where specified, live-applied migrations, and complete error handling.
2. **Deviation Discipline (Minor Tweaks vs. Major Deviations):**
   - **Minor unavoidable tweak** (e.g., library version API syntax difference, splitting a helper file cleanly, adjusting a local port or CSS variable name while keeping the same behavior): proceed and log a 1-line bullet under `## Implementation Notes` in `docs/scope/plans/<NN-slug>.md`.
   - **Major deviation** (changing data model relationships, swapping libraries, altering API route contracts, or dropping/changing an `AC-N`): **STOP immediately before writing the deviation.** Explain the blocker concisely and ask `you` via interactive picker (`ask_question` / `AskUserQuestion` / plain text):
     - `Approve plan adjustment & continue in /develop` (update the plan doc sections + `## Implementation Notes`, then build)
     - `Stop & revise in /architect first`
3. **Clean up superseded code:** Whenever a task replaces an old handler, mock, or helper, delete the dead code and dangling imports in the same pass—never leave old and new implementations side by side unless the plan explicitly specifies a dual-run migration.
4. **Apply migrations live:** If a task creates or alters a database schema/migration and a local database is active, run the migration/push command and confirm it succeeds—a generated but unapplied migration is not done.

### Step 3: Build & Typecheck Sanity Gate

Before marking the phase `Developed`:
- Run the project's native static & build checks that exist (`npm run typecheck` / `tsc --noEmit`, `npm run build`, `npm run lint`, `cargo check`, `go vet ./...`, `python -m py_compile`, etc.).
- Fix any compile, type, import, or lint errors introduced by this phase.
- Tick `[x]` on each completed task in `## Build Plan` inside `docs/scope/plans/<NN-slug>.md` only after it compiles cleanly.
- If blocked mid-phase (e.g., waiting on user credentials or external asset files), leave unfinished `## Build Plan` tasks unchecked `[ ]`, keep status `In Progress`, and report clearly what landed and what is waiting.

### Step 4: Mark `Developed` & Hand Off to `/check verify`

Once all `## Build Plan` tasks are complete and build/typecheck sanity checks pass:

1. **Update `docs/scope/plans/<NN-slug>.md`:**
   - Set `**Status:** Developed`.
   - Confirm all `## Build Plan` items are `[x]` and any minor adjustments are noted under `## Implementation Notes`.
   - **Confirm all `## Verification Checklist` boxes remain unchecked `- [ ]`.**
2. **Surgically update `docs/scope/SCOPE.md`:**
   - Set this phase's `At a Glance` status and section heading suffix to `Developed`.
   - Tick `- [x] Build phase: /develop <Phase Name>` and its milestone sub-boxes.
   - Leave `- [ ] Verify phase: /check verify <Phase Name>` **unchecked**.
   - Add `· Code: <concise touched dirs/files>` to the phase's `Plan:` pointer line.
3. **Output the concise report:**

```markdown
## /develop complete · <Phase Name>

**Built:** <1–2 sentence summary of what was implemented and which sanity checks passed>.
**Updated:** `docs/scope/plans/<NN-slug>.md` & `docs/scope/SCOPE.md` → `Developed` (verification checklist left open for `/check`).
**Implementation Notes:** <"None — built strictly per plan" OR 1-line summary of minor tweaks recorded in the plan doc>.
**Heads up:** <Required `.env` keys to set or manual step needed, or omit line if none>.

Next: run `/check verify <Phase Name>` to audit and verify this phase (consider `/clear` first if context is long).
```

`/develop` stops here. Never run `/check` automatically or mark a phase `Verified`.

---

## References

- [Logical Track Guide](references/logical-guide.md) — Data layer, service logic, API wiring, dead-code cleanup, and Project Mode calibration for backend/CLI/logic builds.
- [UI Track Guide](references/ui-guide.md) — Surface completeness bar, design token discipline, responsive states, and accessibility checks for UI builds.
