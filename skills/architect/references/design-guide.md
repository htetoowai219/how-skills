# Architect Design Guide

## 1. Framing the Design Mode

Infer which lens applies from `SCOPE.md`, `idea.md`, and the codebase:

| Design Lens | When It Applies | Focus |
|---|---|---|
| **Foundation / Stack** | Phase 01 of a greenfield project or introducing a major new tier | Evaluate stack fit for Project Mode, directory layout, persistence choice, and core runtime scaffold. |
| **Feature** | Building net-new user-facing or API functionality | User flow, data model, interface contracts, value sourcing, UI composition/states, and build sequencing. |
| **Enhancement / Refactor** | Extending, replacing, or migrating existing code | Read existing code first; diagnose real constraints; choose fix-in-place vs. incremental strangler replacement; specify dead-code cleanup. |
| **Cross-Cutting Standard** | Unifying error handling, auth middleware, design tokens, or logging | Sample 3–5 existing files, define one canonical pattern, specify what it replaces and how to verify compliance. |

---

## 2. Project Mode Rigor Matrix

Always adapt your questioning and technical design to `SCOPE.md`'s **Project Mode**:

### Casual / Hobby
- **Goal:** Keep momentum high and complexity near zero.
- **Stack bias:** Single-command dev setup, embedded/local storage (SQLite, local files, browser storage) or simple BaaS, minimal dependencies.
- **Design bar:** Clear file map, clean data shape, happy-path + basic error state, runnable build check.
- **What to skip:** Multi-option architecture essays, distributed queues, rate-limiting infra, RBAC matrices, compliance checklists.

### Prototype / MVP
- **Goal:** Ship a solid, believable v1 core loop fast without painting yourself into a corner.
- **Stack bias:** Productive, mainstream frameworks and proven libraries `you` already know or existing repo skills support.
- **Design bar:** Explicit `AC-1..N`, coherent schema, clean API/UI contract, loading/empty/error states, boundary input validation, and end-to-end wiring checks.
- **What to skip:** Premature caching layers, multi-region concerns, microservice splits, or heavy enterprise audit trails.

### Production / Commercial
- **Goal:** Safe, maintainable, secure software ready for real users or clients.
- **Stack bias:** Strong typing, explicit migrations, proven auth/session libraries, structured error handling, environment config validation.
- **Design bar:** Complete `AC-1..N`, relational/schema constraints + indexes, explicit state transitions, **Value Sourcing** trace on every output, IDOR/ownership authorization rules, pagination on list endpoints, idempotency on critical mutations, rate limits on public endpoints, and thorough failure-mode checks.

---

## 3. Closing the Value-Sourcing Loop (Zero Hidden Guesses)

The most common spec bug is an acceptance criterion or screen/endpoint that requires a value whose **origin** was never named—forcing `/develop` to invent a guess mid-build.

Before presenting the Plan Summary in chat, run this quick trace:
1. Look at every value each endpoint, command, or UI screen must **compute, filter by, or display**.
2. Confirm its source is explicit: a request parameter, a database column, an environment/config setting, or a defined calculation from named fields.
3. If any required value has **no named source** (e.g., *"show today's streak"* with no timezone rule, or *"per-workspace items"* with no workspace resolution rule): resolve it right now—ask `you` if it is a product rule, or recommend the simplest sensible rule—and write it under **Value Sourcing & Key Invariants**.

---

## 4. Known Failure Patterns to Flag Early

If a request points toward one of these traps, surface a short `> Premise note:` with a pragmatic alternative:

- **Premature Microservices:** Splitting a small or solo project into multiple backend services multiplies auth, CORS, deployment, and debugging pain. Recommend a modular monolith first.
- **Wrong Data Store Shape:** Using schemaless key-value/document storage for tightly relational domain rules (or vice versa without reason). State the trade-off plainly.
- **Reinventing Auth in Production:** Hand-rolling password hashing, token rotation, and session security in a `Production / Commercial` app invites security bugs unless explicitly required. Recommend a proven library or established repo auth module.
- **Premature Infrastructure:** Adding Redis caches, message brokers, or complex search engines before measuring a bottleneck in `Casual / Hobby` or `Prototype / MVP` mode. Start with the primary database or in-process logic first.
- **Big-Bang Rewrite on Live Code:** Replacing a working brownfield subsystem all at once without a clean cutover + old-code deletion step. Sequence primitive → call-site migration → dead-code removal.

---

## 5. Shaping `## Build Plan` by Build Approach

Let `SCOPE.md`'s **Build Approach** visibly order `## Build Plan`:
- **Tracer Bullet:** Scaffold/schema for the thin path → minimal backend route → minimal UI wired to that real route → thicken remaining fields/states.
- **Skateboard:** Build the complete, usable narrow loop end to end so the phase leaves a shippable tool.
- **Facade:** Stand up UI components, layout, navigation, and states against a clearly marked typed mock module first; defer real backend wiring to the designated wiring phase/step.
- **Journey:** Complete every step, validation, and empty/loading/error state of this user path from entry to confirmation.
