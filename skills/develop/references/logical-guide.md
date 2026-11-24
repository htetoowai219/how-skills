# Develop: Logical Track Guide (Backend, Data, CLI & Business Logic)

Read this guide when implementing data models, APIs, server actions, CLI commands, background jobs, or domain logic.

## 1. Ground Rules

1. **Implement the plan's contract verbatim:** Field names, route paths, HTTP methods, status codes, CLI flags, state transitions, and value sources come from `docs/scope/plans/<NN-slug>.md`. Never invent shadow fields or alternate route shapes silently.
2. **Match existing repo patterns:** Before creating new files, read 2–3 neighboring modules. Reuse the project's established ORM/query client, error class, response wrapper, validation library, and config loader.
3. **Proportional rigor by Project Mode:**
   - **Casual / Hobby:** Straightforward handlers/functions, basic error messages, zero ceremonial layers (no repository-interface-factory pyramids for a 3-route app).
   - **Prototype / MVP:** Clean separation of route/interface and data/logic, schema validation on external inputs, consistent error responses, safe `.env.example` updates.
   - **Production / Commercial:** Strict input validation (fail closed), resource-level ownership/RBAC checks (prevent IDOR), list pagination, idempotency on critical writes, database constraints + indexes, structured logging, and zero leaked stack traces.

---

## 2. Implementation Sequence

Work in dependency order (adapted to the plan's **Build Approach**):

### A. Data & Persistence Layer
- Implement schemas/migrations matching the plan's Data Model (types, nullability, foreign keys, unique constraints).
- **Apply and verify when possible:** Run the project's migration/schema push tool against the local dev DB (or SQLite file) and verify clean execution. If no local DB is running and cannot be started automatically, record that under `## Implementation Notes` and in `Heads up` so `/check verify` knows.

### B. Core Domain Logic & State Rules
- Implement calculations, state transitions, and business invariants using the exact **Value Sourcing** rules in the plan.
- Reject invalid state transitions explicitly rather than silently ignoring them.

### C. Interface Surface (API Routes / Server Actions / CLI)
- Wire routes, controllers, or CLI entrypoints into the real application router/entrypoint—never leave a handler file unmounted!
- Validate request bodies, params, and query strings at the boundary.
- Enforce authentication and authorization rules defined in the plan.

### D. Configuration & Secrets Hygiene
- Read secrets and environment-specific URLs from environment variables—never hardcode credentials or personal machine paths.
- Document any newly introduced env keys in `.env.example` (if the repo uses one) without touching real `.env` secrets, and mention them in the final `Heads up` line.

### E. Remove Superseded Code
- When refactoring, replacing mock data from an earlier `Facade` phase, or migrating an endpoint: delete obsolete mocks, dead functions, unused exports, and dangling imports.
- Search across the codebase (`grep`) for removed symbol names to confirm zero broken references remain before running `typecheck` / `build`.
