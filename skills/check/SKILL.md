---
name: check
description: Audits and verifies implemented work before marking a phase complete or merging. `/check verify <Phase>` proves implementation against docs/scope/plans/<NN-slug>.md, system integration, and build/test commands (respecting Project Mode) before marking SCOPE.md Verified. `/check review` runs a senior diff review and writes findings to docs/reviews/. Do NOT use for planning (/architect) or building new features (/develop).
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

# Check

The quality and integration gate after `/develop` and before merge. Two distinct modes—usually `verify` right after `/develop`, and `review` before opening a PR:

- **`/check verify <Phase / Feature Name>`** *(Plan, Integration & Runtime Verification)*:
  Audits the real implementation against `docs/scope/plans/<NN-slug>.md`'s Verification Checklist, checks end-to-end system integration (imports, routes, payloads, env vars, zero orphaned code or dead handlers), runs build/typecheck/lint/test commands, and exercises runnable surfaces. Respects `SCOPE.md`'s **Project Mode**. Marks the plan and `SCOPE.md` **`Verified`** *only* when every required check passes.
- **`/check review [<Phase / branch / uncommitted>]`** *(Senior Code Review)*:
  Performs a skeptical, fresh-eyes Staff Engineer review of the git diff (ideally in a fresh subagent on a contrasting model when supported), calibrated to `SCOPE.md`'s **Project Mode**, and writes severity-ranked findings (`Blocker`, `Major`, `Minor`, `Nit`) to `docs/reviews/<YYYY-MM-DD>-<slug>.md`.

## Output Style & Core Invariants

1. **Direct, evidence-backed honesty:** Talk to `you` plainly. Never claim a check passed without concrete evidence (command output, HTTP/CLI response, or verified `file:line` wiring). Reading code and assuming "this should work" when a build or runtime check was skipped is never a `PASS`.
2. **Project Mode calibration:** Always read `docs/scope/SCOPE.md` first and judge against its **Project Mode**:
   - **Casual / Hobby:** Verify planned features work, wiring is connected with zero dead handlers, and build/typecheck succeeds. Never fail a Hobby build for missing enterprise security hardening, rate limiters, or exhaustive test suites that were not in the plan.
   - **Prototype / MVP:** Verify all `AC-1..N`, core input validation, empty/loading/error states, clean integration, and passing build/typecheck/(tests if configured).
   - **Production / Commercial:** Hold the full production bar—every `AC-1..N`, auth/ownership enforcement, boundary validation, live migrations, edge cases, zero dead code, and all build/typecheck/lint/test checks.
3. **Audit first, never stealth-fix:** Both `verify` and `review` are **read-only on application code** during the audit. If gaps or bugs are found, report exact `file:line` locations first and **ask `you` before editing any code**.

---

## Step 0: Route the Mode (Before Reading Mode Guides)

Inspect the arguments passed to `/check`:

1. **Starts with `verify` (or `run`)** → Read [Verify Mode Guide](references/verify-guide.md) in full and execute it for the named phase (or the active `Developed` phase in `docs/scope/SCOPE.md` if no phase name followed `verify`).
2. **Starts with `review`** → Read [Review Mode Guide](references/review-guide.md) in full and execute it with any steering provided (e.g., `uncommitted`, branch name, or phase name).
3. **No mode word given** (bare `/check`, or `/check <Phase Name>` without `verify`/`review`):
   - Keep `<Phase Name>` (if provided) in mind as the target, and ask `you` which mode to run via your runtime's interactive picker (`ask_question`, `AskUserQuestion`, `question`, `request_user_input`) or plain text:
     - `(Recommended) verify` — Prove the phase works against its plan, check wiring & build, and mark `Verified` on pass.
     - `review` — Run a senior code review on the git diff and write findings to `docs/reviews/`.
     - `both` — Run `verify` first, then run `review`.
   - Wait for `your` pick, then load only the selected guide.

---

## Quick Reference: Artifact Ownership by Mode

| Artifact | `/check verify` | `/check review` |
|---|---|---|
| Application source code | Read-only during audit (asks before fixing gaps) | Read-only (never edits app code) |
| `docs/scope/plans/<NN-slug>.md` | Ticks `## Verification Checklist` & sets `**Status:** Verified` on full PASS | Read-only context |
| `docs/scope/SCOPE.md` | Ticks `Verify phase` & sets phase status to `Verified` on full PASS | Ticks optional `Pre-PR code review` box if present |
| `docs/reviews/<YYYY-MM-DD>-<slug>.md` | Not touched | Writes severity-ranked review report |

---

## References

- [Verify Mode Guide](references/verify-guide.md) — Complete 4-layer verification workflow (plan conformance, system integration audit, build/test commands, runtime exercise, evidence gate, and `SCOPE.md` sign-off).
- [Review Mode Guide](references/review-guide.md) — Fresh-model / subagent code review workflow, Project Mode severity calibration, and `docs/reviews/` report template.
