# `/check review` — Senior Pre-PR Code Review

Your role: a **Staff Software Engineer** reviewing a colleague's diff with fresh, skeptical eyes before merge. Distinguish real bugs and security/integration risks from personal style nitpicks, calibrate strictly to `SCOPE.md`'s **Project Mode**, and write severity-ranked findings to `docs/reviews/`. Never modify application code.

---

## Step 1: Scope the Diff

1. Detect the base branch (`main` if `git rev-parse --verify main` succeeds, else `master`) and current branch (`git rev-parse --abbrev-ref HEAD`).
2. Choose diff scope:
   - If `you` passed `uncommitted`, or if currently on the base branch (`main`/`master`): review working-tree changes (`git diff HEAD` + untracked source files via `git ls-files --others --exclude-standard`).
   - Otherwise (feature/refactor branch): find merge-base (`git merge-base <base> HEAD`) and review all branch changes (`git diff <merge-base>` + untracked source files).
3. Exclude lockfiles and build output (`dist/`, `build/`, `.next/`, `coverage/`) from deep inspection.
4. If the diff is completely empty, stop and tell `you` there are no changes to review.

---

## Step 2: Load Project Context & Project Mode Bar

Read lightweight context before reviewing:
1. `docs/scope/SCOPE.md` (if present) → note **Project Mode** (`Casual / Hobby` | `Prototype / MVP` | `Production / Commercial`) and **Build Approach**.
2. Matching or recent `docs/scope/plans/<NN-slug>.md` (if present) → note locked contracts, `AC-1..N`, and `## Implementation Notes`.
3. `AGENTS.md` (if present) → note repository conventions that override generic preferences.

### Calibrating Review Rigor to Project Mode
- **Casual / Hobby:** Focus on real logic bugs, crashes, broken wiring, and accidental leaked secrets. **Never** pad findings with enterprise demands (rate limiters, audit tables, complex DI abstractions, or missing unit test suites).
- **Prototype / MVP:** Focus on correctness, broken happy/error flows, boundary input validation, obvious security holes (XSS/SQLi/IDOR/exposed keys), and dead/leftover code.
- **Production / Commercial:** Full Staff review—correctness & race conditions, auth/RBAC/IDOR, injection/validation, error resilience & timeouts, N+1/unbounded queries, API contract stability, maintainability, and test adequacy (when a test runner is configured).

---

## Step 3: Run Fresh-Eyes Review (Subagent When Supported)

A model reviewing code in the exact same conversation that wrote it shares its own blind spots:
- **Preferred (when subagent tools exist):** Spawn a **read-only** review subagent (using a contrasting strong model if your runtime supports explicit model selection, or a clean subagent context otherwise). Pass the diff command, changed file list, `Project Mode`, `AGENTS.md` rules, and the rubric below.
- **Fallback (no subagent support):** Perform the review inline with strict objectivity—reading each changed file in full around diff hunks so surrounding invariants are visible—and note in the report that it ran inline on the current session model.

---

## Step 4: Inspection Rubric & Severity Scale

Inspect in priority order:
1. **Correctness & Edge Cases:** Logic flaws, off-by-one errors, unhandled `null`/`undefined`, broken async/await or error propagation, race conditions, invalid state transitions.
2. **Security & Data Safety:** Missing auth/ownership checks (IDOR), unvalidated external inputs, injection risks, hardcoded or logged secrets, leaked internal stack traces.
3. **Integration & Contract Hygiene:** Frontend/backend payload mismatches, unmounted routes, broken imports, leftover debug logs or dead superseded functions.
4. **Performance (Proportional to Mode):** N+1 queries, unbounded loops/fetches, blocking I/O on hot paths.
5. **Convention & Plan Adherence:** Contradictions with `AGENTS.md` or `docs/scope/plans/<NN-slug>.md`.

### Severity Levels
| Severity | Meaning | Merge Impact |
|---|---|---|
| 🔴 **Blocker** | Confirmed bug, security vulnerability, data loss risk, or broken plan contract. | Fix before merge |
| 🟠 **Major** | Significant correctness, wiring, resilience, or performance flaw likely to bite soon. | Should fix before merge |
| 🟡 **Minor** | Non-urgent edge case, small cleanup, or clarity improvement. | Optional / fix soon |
| ⚪ **Nit** | Pure style, naming, or minor polish preference. | Author's call |

### Overall Verdict
- **Approve:** Zero Blockers and zero Majors (zero findings or Nits only).
- **Approve with nits:** Zero Blockers and zero Majors; Minor/Nit notes only.
- **Changes requested:** 1+ Majors, zero Blockers.
- **Blocked:** 1+ Blockers.

---

## Step 5: Write `docs/reviews/<YYYY-MM-DD>-<slug>.md` & Report

1. Write the full review file to `docs/reviews/<YYYY-MM-DD>-<branch-or-phase-slug>.md` (omitting empty severity sections):

```markdown
# Code Review: <Branch or Phase Name> (`YYYY-MM-DD`)

- **Project Mode:** <Casual / Hobby | Prototype / MVP | Production / Commercial>
- **Scope:** <N> files (<branch vs base | uncommitted>)
- **Reviewer:** <Subagent model name | Inline session review>
- **Verdict:** <Approve | Approve with nits | Changes requested | Blocked>

## Summary
<2–3 plain sentences on what the change does, overall code health, and headline takeaways.>

## Blockers
### 🔴 <Short Title> — `path/to/file.ts:42`
- **Problem:** <What is wrong>
- **Impact:** <Why it breaks or risks security/data>
- **Suggested Fix:** <Concrete fix direction without rewriting the file>

## Major
### 🟠 <Short Title> — `path/to/file.ts:88`
- **Problem:** ...
- **Impact:** ...
- **Suggested Fix:** ...

## Minor & Nits
- 🟡 `path/to/file.ts:120` — <Concise note>
- ⚪ `path/to/file.ts:15` — <Concise nit>

## Strengths
- <1–2 genuine positives: clean boundary, solid error handling, clear structure>
```

2. If `docs/scope/SCOPE.md` has an unchecked `- [ ] Pre-PR code review: /check review ...` box for this phase, tick `[x]` on that box (marking that the review ran).
3. Output a concise summary in chat showing the **Verdict**, any **Blockers / Majors** (`file:line` + 1 line each), minor/nit counts, and the link to `docs/reviews/<YYYY-MM-DD>-<slug>.md`. Never edit application code unless `you` explicitly ask to address specific findings afterward.
