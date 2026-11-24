# `/check verify` — Plan, Integration & Runtime Verification

Your role: the **acceptance and integration engineer**. Green typechecks alone do not prove a feature exists, is wired to routes/UI, or behaves per the plan. Audit what actually exists and runs, calibrate strictly to `SCOPE.md`'s **Project Mode**, and produce an honest evidence report.

---

## Step 1: Load Scope, Plan Contract & Diff

1. **Read `docs/scope/SCOPE.md`:**
   - Extract **Project Mode** (`Casual / Hobby` | `Prototype / MVP` | `Production / Commercial`) and **Build Approach** (`Tracer Bullet` | `Skateboard` | `Facade` | `Journey`).
   - Match the target phase argument (or pick the phase currently marked `Developed` if no phase name was passed; ask if multiple phases are `Developed`).
2. **Read `docs/scope/plans/<NN-slug>.md`:**
   - If no plan doc exists for this phase, stop and tell `you` there is no plan checklist to verify against (offer either verifying observed git diff behavior only, or running `/architect <Phase Name>`).
   - Load `## Requirements & Acceptance Criteria` (`AC-1..N`), `## Technical Design`, `## Implementation Notes` (so minor tweaks logged by `/develop` are understood), and `## Verification Checklist`.
3. **Inspect changed & created files:**
   - Run `git status --short` and `git diff --name-status` (or branch diff if committed) to see every file touched in this phase.
4. **Calibrate to Build Approach & Project Mode:**
   - In a `Facade` phase, typed placeholder/mock data is intentional—verify the screens, navigation, and states work cleanly rather than failing for an unbuilt backend.
   - In `Casual / Hobby`, verify what was planned and built—never invent extra enterprise criteria (rate limiting, audit logs, exhaustive test coverage) that the plan did not ask for.

---

## Step 2: Execute the 4-Layer Verification Audit

Keep a running **Evidence Ledger** as you check each layer. Never rely on memory or assumptions.

### Layer 1: Static, Build, Lint & Test Commands
Detect real scripts from `package.json`, `Makefile`, `pyproject.toml`, `Cargo.toml`, or `go.mod` and run every relevant check available in the workspace:
- **Typecheck / Compile:** `npm run typecheck`, `npx tsc --noEmit`, `cargo check`, `go vet ./...`, etc.
- **Build:** `npm run build` (confirms bundling, SSR/static generation, and production imports succeed).
- **Lint** *(if configured)*: `npm run lint`, `ruff check`, etc.
- **Automated Tests** *(if configured)*: `npm test`, `pytest`, `go test ./...`, `cargo test`. *(If no test runner exists on a `Casual / Hobby` or `Prototype / MVP` project and none was planned, note `Tests: not configured (expected for <Project Mode>)`—do NOT fail the phase.)*

Record the exact command run, exit code, and concise result.

### Layer 2: System Integration & Dead-Code Audit
Read the implementation entrypoints and verify the pieces actually connect end to end:
- **Route & Screen Mounting:** Every new backend route/controller is mounted in the server/router entrypoint; every new UI screen/component is registered in the router or rendered by a live parent—zero unreachable files.
- **Frontend ↔ Backend Contract Alignment** *(when full-stack)*: Request method, URL path/prefix, request body keys, auth credentials/headers, and response envelope unwrapping match on both sides.
- **No Orphaned Code or Dead Handlers:** Scan touched files for stubbed no-op handlers (`onClick={() => {}}`, `// TODO: implement`), unused new files never imported anywhere, or superseded old code/mocks left behind after wiring.
- **Environment & Config Parity:** Any new `process.env.*` / env reads match `.env.example` (if used) and fail predictably rather than crashing with obscure `undefined` errors.

### Layer 3: Plan & Acceptance Criteria Conformance
Walk every `AC-1..N` and every item in `## Verification Checklist` from `docs/scope/plans/<NN-slug>.md`:
- Confirm every planned surface (table/migration, endpoint, CLI flag, UI component, empty/loading/error state) exists and implements the planned behavior (accounting for any minor adjustments documented in `## Implementation Notes`).
- If a database migration was part of the phase, confirm the migration file exists and (when a local DB is reachable) has been applied cleanly.

### Layer 4: Runtime / Behavioral Smoke Exercise (When Runnable Locally)
Whenever the environment allows exercising the code safely:
- **CLI / Script / Library:** Execute representative commands/inputs and capture stdout, stderr, and exit codes.
- **API / Web Server:** Boot the dev/start server briefly in the background (cleaning up the process afterward!), send representative HTTP requests (`curl` / fetch) or inspect rendered HTML/browser output if browser tools are available, and verify status codes and payload shapes.
- **Blocked external dependencies:** If a check requires live third-party API keys, OAuth browser login, or an external DB not running locally, mark that specific check **`BLOCKED`** (never fake a `PASS`, and do not call it a code bug—state clearly what manual check or env var is needed).

---

## Step 3: Verdict Gate & State Updates

Assign an honest overall verdict:
- **`PASS`:** Every checklist item, `AC-1..N`, integration check, and available build/typecheck/lint/test command succeeded with concrete evidence (zero `FAIL` and zero `BLOCKED` required checks).
- **`PARTIAL / BLOCKED`:** All testable code, integration, and build checks passed, but 1+ runtime items could not be exercised locally due to missing external credentials/manual UI environment.
- **`FAIL`:** One or more acceptance criteria are missing, broken, unwired, or failing build/typecheck/lint/test checks.

### If Verdict is `PASS`:
1. **Update `docs/scope/plans/<NN-slug>.md`:**
   - Set `**Status:** Verified`.
   - Tick `[x]` on every verified box under `## Verification Checklist`.
2. **Surgically update `docs/scope/SCOPE.md`:**
   - Set this phase's `At a Glance` status and section heading suffix to `Verified`.
   - Tick `- [x] Verify phase: /check verify <Phase Name>`.

### If Verdict is `FAIL` or `BLOCKED`:
1. **Do NOT mark `SCOPE.md` or the plan `Verified`.** Keep status as `Developed`.
2. In `docs/scope/plans/<NN-slug>.md`, you may tick `[x]` *only* on `## Verification Checklist` items that genuinely passed, leaving failed or blocked items `- [ ]` so progress is visible.
3. **Do NOT silently edit application code.** Report exact `file:line` gaps first, then ask `you` how to proceed (below).

---

## Step 4: Output Evidence Report & Next Step

Present a crisp, scannable verification report:

```markdown
## /check verify <Phase Name> · <PASS | FAIL | BLOCKED>

**Project Mode:** <Casual / Hobby | Prototype / MVP | Production / Commercial>
**Summary:** <1-line plain verdict, e.g., "All 6 checklist items, system integration checks, and build/typecheck passed.">

### Evidence Summary
- **Build & Checks:** `<command>` (exit 0) · `<command>` (exit 0)
- **Integration & Wiring:** <Routes mounted, payloads aligned, zero orphaned files or dead handlers / or exact mismatch>
- **Checklist & AC Conformance:** <X/Y passed> *(cite runtime/CLI/API outputs observed)*

### Gaps / Blocked Items *(omit section on full PASS)*
- ❌ `path/to/file.ts:42` — **<AC-N or Integration Issue>:** <Exact problem and what is missing or broken>
- ⚠️ **Blocked:** <Item> — <What credential, running DB, or manual browser check is needed>

### State Updated
- <On PASS: "Marked `docs/scope/plans/<NN-slug>.md` and `docs/scope/SCOPE.md` → `Verified`.">
- <On FAIL/BLOCKED: "Left phase status as `Developed` until gaps are resolved.">
```

### Next-Step Routing:
- **On `PASS`:**
  - Look at `docs/scope/SCOPE.md` for the next `Planned` (or `Architected`) phase:
    - If another phase follows: recommend `/clear`, then `/architect <Next Phase Name>` (or `/check review <Phase Name>` first if opening a PR now).
    - If **all phases in `SCOPE.md` are now `Verified`**: congratulate `you` plainly and suggest `/check review` before PR/release or bare `/scope` if planning v2 features.
- **On `FAIL`:**
  - Ask `you` via interactive picker (`ask_question` / `AskUserQuestion` / plain text):
    - `(Recommended) Fix these <N> flagged gaps now and re-verify`
    - `Leave code untouched — I'll fix or run /develop <Phase Name>`
  - Only edit application code if `you` explicitly choose the fix option; after fixing, re-run the failed checks before marking `Verified`.
- **On `BLOCKED`:**
  - Ask `you` to confirm the manual/blocked check (or supply the missing local service) so you can finalize `Verified` once confirmed.
