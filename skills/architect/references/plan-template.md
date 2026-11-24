# Phase Plan Template (`docs/scope/plans/<NN-slug>.md`)

Filename convention: `docs/scope/plans/<NN-kebab-slug>.md`
- `NN`: two-digit zero-padded phase number matching `docs/scope/SCOPE.md` (`01`, `02`, ...).
- `kebab-slug`: lowercase 2–5 word slug without leading articles (e.g., `01-core-bookmark-loop.md`, `02-tag-filtering-and-export.md`).

---

## Calibrating Plan Verbosity to Project Mode

Never force a one-size-fits-all spec length. Keep the section headings consistent so `/develop` and `/check` always know where to read, while scaling depth to `SCOPE.md`'s **Project Mode**:

| Section | Casual / Hobby | Prototype / MVP | Production / Commercial |
|---|---|---|---|
| **Summary & Locked Stack** | 2–3 lines | 3–4 lines + key trade-off | Summary + brief Context & Options trade-off |
| **Requirements (`AC-1..N`)** | 3–5 plain bullets | 4–7 checkable ACs | Complete happy-path, validation, authz & failure ACs |
| **Technical Design** | File map + simple data/route sketch | Entities, endpoints/screens, key states & value sources | Full schema + constraints/indexes, state transitions, API table, Value Sourcing table, invariants, authz/security, env vars |
| **Build Plan** | 3–6 ordered tasks | 4–8 ordered tasks mapped to ACs | Ordered tasks mapped to ACs & Build Approach |
| **Verification Checklist** | Build/run check + happy-path checks | Build/typecheck + AC checks + wiring checks | Build/typecheck/lint/tests + full AC, integration, authz & edge-case checks |

---

## Canonical Markdown Template

```markdown
# <NN>. <Phase / Feature Name>

- **Date:** YYYY-MM-DD
- **Phase:** <NN> — <Phase Name>
- **Project Mode:** <Casual / Hobby | Prototype / MVP | Production / Commercial>
- **Build Approach:** <Tracer Bullet | Skateboard | Facade | Journey>
- **Status:** Architected
- **Stack & Libraries:** <Confirmed frameworks, DB/storage, UI/styling, validation/testing libraries for this phase>
- **Convention Skills:** <Optional: installed repo/agent convention skills to follow during /develop, e.g. `express-backend-architecture`, `frontend-architecture`, or omit line if none>

## Summary
<2 to 4 plain sentences stating what this phase builds, the chosen approach, and the main technical trade-off.>

<!-- Include "Options & Rationale" primarily for Prototype / MVP (brief) and Production / Commercial (2-3 options with pros/cons), or whenever a non-obvious architectural trade-off was weighed. Omit in Casual / Hobby if straightforward. -->
## Rationale & Trade-Offs
- **Chosen direction:** <Why this stack/pattern fits the Project Mode and constraints>
- **Runner-up considered:** <Alternative and why it was skipped for now>
- **Trade-off accepted:** <What this choice intentionally keeps simple or defers>

## Requirements & Acceptance Criteria
- **AC-1:** <Concrete, observable behavior>
- **AC-2:** <Concrete, observable behavior or state>
- **AC-3:** <Validation, persistence, or failure/edge behavior suited to Project Mode>

## Technical Design

### Files & Module Layout
- `path/to/file.ext` — <1-line responsibility (new or modified)>
- `path/to/other.ext` — <1-line responsibility>

### Data Model / State Shape
<!-- Omit if stateless UI/CLI with no data shape. Include fields, types, nullability, relationships, and (for Production) unique constraints & indexes. -->
<Entities / tables / state stores / local file schemas>

### Interface Surface (API / CLI / UI Screens)
<!-- Include what applies: HTTP endpoints (Method, Path, Input, Output, Auth, Errors), CLI flags/subcommands, or UI screens/components + loading/empty/error states. -->
<Concise table or structured bullets>

### Value Sourcing & Key Invariants
<!-- Ensure every computed or displayed value required by AC-1..N has an explicit source (request input, DB column, env/config, or derived formula) so /develop never guesses. -->
- <Value / Rule 1>: sourced from `<where>` · invariant: `<rule>`
- **Environment / Config** *(omit if none)*: `ENV_VAR_NAME` (<purpose>)

<!-- Mandatory in Production / Commercial whenever user input, auth, multi-tenancy, or external I/O exists; brief or omitted in Casual / Hobby. -->
### Security, Validation & Edge Cases
- **Auth & Ownership:** <Who can read/mutate what>
- **Validation & Failure Handling:** <Boundary validation, idempotency, empty/error states>

## Build Plan
<!-- Ordered implementation tasks for /develop, sequenced by Build Approach. /develop ticks these [x] as each task lands and compiles. NO implementation code blocks here—specify contracts and responsibilities only. -->
- [ ] 1. <Task 1> *(satisfies AC-1)*
- [ ] 2. <Task 2> *(satisfies AC-1, AC-2)*
- [ ] 3. <Task 3> *(satisfies AC-3)*

## Implementation Notes
<!-- Maintained by /develop: records minor unavoidable implementation tweaks or discoveries made during coding. Starts as "None yet." -->
None yet.

## Verification Checklist
<!-- Audited and ticked [x] ONLY by /check verify (never ticked by /develop). Must be concrete and testable. -->
### Build & Static Checks
- [ ] <Typecheck / build / lint / test command(s) pass cleanly>

### System Integration & Wiring
- [ ] <Routes, imports, navigation, env config, and data wiring connected end to end with zero orphaned files or dead handlers>

### Functional & Acceptance Checks
- [ ] **AC-1:** <Exact action/request/UI check -> expected observable output>
- [ ] **AC-2:** <Exact action/request/UI check -> expected observable output>
- [ ] **AC-3:** <Exact edge/validation/persistence check -> expected observable output>
```
