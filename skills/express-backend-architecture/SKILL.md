---
name: express-backend-architecture
description: Scaffolds, extends, and refactors modular Express.js TypeScript backends conforming to our production conventions (Mongoose, layered separation, asyncHandler, ApiError, clean response envelopes, and token-safe modular lazy-loading). Trigger when scaffolding a new Express backend from scratch, adding vertical CRUD resource bundles, or integrating optional modules (JWT auth/RBAC, Multer/Cloudinary uploads, Redis caching, Docker). Do NOT use for frontend code, NestJS apps, Next.js API routes, or non-Express scripts.
license: MIT
compatibility: Designed for Agent Skills-compatible tools (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
metadata:
  source: custom
  author: "how"
  version: "2.0.0"
allowed-tools:
  - read_file
  - run_command
  - edit_file
  - write_file
---

# Express Backend Architecture

Production-grade Express.js TypeScript architecture enforcing strict ESM (`"type": "module"`), NodeNext resolution, clean layered separation, resilient database connections, centralized error propagation, and token-safe modular lazy-loading.

---

## 1. Mode Detection (Run First — Read-Only)

Before reading reference files or writing code, inspect the working directory to determine the execution mode:

- **Mode A — New Backend Scaffold:**
  - Neither root nor `server/` contains an Express application (`package.json` missing or lacks `express`).
  - Follow the 3 sequential phases: **Phase 1 (Interactive Grill) -> Phase 2 (Selective Load & Scaffold) -> Phase 3 (Post-Scaffold Resource Offer)**.
- **Mode B — Existing Express Backend (Extend):**
  - An Express application already exists on disk. **Skip the full scaffold grill**.
  - **Adding a CRUD resource:** Read ONLY [CRUD Vertical Slice](references/crud-slice.md), match the existing repo's import extensions (`.js`) and conventions, and generate the requested bundle.
  - **Bolting on an optional module:** Read ONLY the specific matching reference file ([Auth](references/opt-auth.md), [Uploads](references/opt-uploads.md), [Redis](references/opt-redis.md), or [Docker](references/opt-docker.md)) and integrate it cleanly without touching unrelated files.

---

## 2. Phase 1: Interactive Scaffold Grill (Mode A Only)

Before reading any `references/opt-*.md` files or scaffolding code, present this single, structured checklist so the user can lock in requirements in one response:

```text
Express Backend Scaffold Configuration:
1. Target Path & Package Manager: Scaffold at repo root or inside server/? (npm [default] / pnpm / bun)
2. Project Scope: Basic CRUD API only, or full application backend? (Full app backend [default])
3. Users & Authentication:
   • Basic JWT [default — scaffolds user model/controller/route + auth middleware]
   • JWT Access + Refresh tokens
   • Add Google OAuth / RBAC roles (specify roles if needed, e.g. admin, user)
   • None (no user files or auth middleware)
4. Image / File Uploads: Need Multer + Cloudinary? (No [default] / Yes)
5. Redis: Need Redis client for caching or locking? (No [default] / Yes)
6. Docker Setup: None [default] / Infra-only Compose (MongoDB + Redis) / Full Docker Compose (API + DB/Redis)
```

**Fast-Path Prompt:**  
> *"Reply with your picks (e.g. `server/, Basic JWT, no uploads, Redis, infra-only docker`) or reply `minimal` for root + basic CRUD with no optional modules."*

- **Wait for the user's response** before loading optional references or generating files.
- Skip the grill **only** if the user already specified all requirements in their prompt or explicitly said *"skip questions / use defaults"*.

---

## 3. Phase 2: Token-Safe Lazy Loading & Clean Base Scaffold

1. **Strict Lazy-Loading:** Read [Core Scaffold](references/core-scaffold.md) first. Read `references/opt-*.md` files **strictly** for modules the user selected `Yes` to. **NEVER load unselected optional references.**
2. **Domain-Free Baseline Rule:**
   - When Auth is enabled, scaffold **only** the `user` bundle (`model/user.model.ts`, `controllers/user.controller.ts`, `routes/user.route.ts`, plus auth middleware/types) alongside core bootstrap files and `/api/v1/health`.
   - When Auth is `None`, scaffold **only** core bootstrap files, DB connection, error handler, health check, and an empty master router.
   - **Strictly Forbidden:** Never scaffold `item`, `product`, `movie`, `booking`, or leftover domain models from reference repos during the initial base scaffold.
3. **Dependency & Environment Hygiene:**
   - Include npm dependencies **only** for selected modules (e.g., do NOT install `multer`, `cloudinary`, or `redis` if unselected).
   - Generate `.env.example` with keys matching only active modules.

---

## 4. Phase 3: Post-Scaffold Resource Offer (Mode A Mandatory Step)

After completing the base scaffold and verifying clean compilation (`npm run build` or `npm run typecheck`), summarize the generated structure and conclude with this exact prompt:

> *"Base scaffold is ready. Would you like me to generate any extra CRUD resource bundles (model + controller + route + validation, wired into your main router)? If yes, list the resource names and any rough fields or auth rules (e.g., `task: title, status, dueDate [auth]` or `category: name [admin only]`)."*

When the user provides resource names, read [CRUD Vertical Slice](references/crud-slice.md) (if not already loaded) and generate each resource following our layered conventions.

---

## 5. Canonical Directory Structure & Naming Grammar

```text
src/
├── server.ts                       # Entry point: DB connection, HTTP listen, graceful shutdown
├── app.ts                          # App configuration: Helmet, CORS, parsers, routes, error handlers
├── db/
│   └── connectDb.ts                # Mongoose connection with retry loop & sleep backoff
├── routes/
│   ├── <resource>.route.ts         # Resource endpoints & middleware chaining
│   └── index.ts                    # Master route aggregator mounted at /api/v1
├── controllers/
│   └── <resource>.controller.ts    # Request handlers wrapped with asyncHandler
├── models/
│   └── <resource>.model.ts         # Mongoose schema, TypeScript interface, indexes
├── middlewares/
│   ├── auth.middleware.ts          # [Optional] verifyAccessToken, requireRole, optionalAuth
│   ├── error.middleware.ts         # notFoundHandler & global errorHandler
│   └── upload.middleware.ts        # [Optional] Multer memory storage & MIME validation
├── utils/
│   ├── apiError.util.ts            # Custom HTTP error class with static status factories
│   ├── asyncHandler.util.ts        # Promise rejection forwarder to next()
│   ├── cloudinary.util.ts          # [Optional] Cloudinary upload/delete streams
│   └── redis.util.ts               # [Optional] Redis client with connection state check
└── types/
    ├── express.d.ts                # [Optional] Express.Request user augmentation
    └── <resource>.type.ts          # Domain interfaces & DTOs
```

### Layer Naming & Export Grammar
| Layer | Folder | File Suffix | Export Style | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Server** | `src/` | `server.ts` | Entry point | `connectDb()`, `app.listen()`, `SIGINT`/`SIGTERM` traps |
| **App** | `src/` | `app.ts` | Default (`export default app`) | Security headers, CORS, body parsers, route mounting |
| **Routes** | `src/routes/` | `<resource>.route.ts` | Default (`export default router`) | HTTP verb routing, middleware chaining |
| **Controllers** | `src/controllers/` | `<resource>.controller.ts` | Named (`export const get...`) | HTTP status codes, param extraction, JSON responses |
| **Models** | `src/models/` | `<resource>.model.ts` | Named (`export const Model = ...`) | Mongoose schema, validation, indexes, timestamps |
| **Middlewares** | `src/middlewares/` | `<name>.middleware.ts` | Named (`export const verify...`) | Interception, auth checks, error formatting |
| **Utils** | `src/utils/` | `<name>.util.ts` | Named (`export const ...`) | Stateless helpers, external SDK clients |
| **Types** | `src/types/` | `<resource>.type.ts` | Named (`export interface ...`) | Interface definitions, DTOs, ambient declarations |
| **Database** | `src/db/` | `connectDb.ts` | Default (`export default connectDb`) | Mongoose retry loop with sleep backoff |

---

## 6. Core Architectural Rules

1. **Pure ESM with TypeScript:** Use `"type": "module"` in `package.json`, target `ES2022`, and `moduleResolution: "NodeNext"`. Local relative imports inside `src/` must include explicit `.js` extensions.
2. **Plural Folder Names:** Subdirectories under `src/` must be plural (`controllers/`, `models/`, `routes/`, `middlewares/`, `utils/`, `types/`).
3. **Split Bootstrap:** `app.ts` configures middleware and route pipelines. `server.ts` handles database connection, server listening, and graceful termination.
4. **Zero Inline Route Logic:** Routes define endpoint verbs and middleware chains only. Business logic belongs in controllers.
5. **Centralized Error Propagation:** Never write redundant `try/catch` in controllers. Wrap handlers in `asyncHandler(...)` and throw `ApiError` instances (`ApiError.badRequest()`, `ApiError.notFound()`).
6. **Consistent JSON Envelopes:**
   - Success: `res.status(200).json({ success: true, data: ... })`
   - Created: `res.status(201).json({ success: true, message: "...", data: ... })`
   - Error: `res.status(code).json({ success: false, message: "...", details? })`
7. **Hybrid Auth Transport:** Auth middleware checks HTTP-only `req.cookies.token` first, then falls back to `Authorization: Bearer <token>`. Decoded user attaches to `req.user` typed via `src/types/express.d.ts`.
8. **Mongoose Discipline:** Always specify `{ timestamps: true }`, index queried fields, and use `.lean()` on read-only queries for optimal throughput.
9. **Resilient Database Connection:** `connectDb.ts` implements a 10-attempt retry loop with exponential/sleep backoff before fatal termination.
10. **Module Isolation:** Unselected modules must not leave unused dependencies in `package.json` or orphaned keys in `.env.example`.

---

## 7. Lazy-Load Reference Routing Table

> [!IMPORTANT]
> **Token Optimization:** Load reference files **only** when the corresponding condition is met. Never read unselected optional references.

| Condition / Task | Reference File | Contents |
| :--- | :--- | :--- |
| **New backend scaffold (always)** | [Core Scaffold](references/core-scaffold.md) | Baseline tree, `package.json`, `tsconfig.json`, `server.ts`, `app.ts`, `connectDb.ts`, `error.middleware.ts`, `apiError.util.ts`, `asyncHandler.util.ts`, and `/api/v1/health`. |
| **Adding domain CRUD resource** | [CRUD Vertical Slice](references/crud-slice.md) | End-to-end slice template (`type.ts`, `model.ts`, `controller.ts`, `route.ts`, pagination, sorting, router mount). |
| **Users / Auth selected** | [Auth & User Slice](references/opt-auth.md) | JWT auth middleware, RBAC `requireRole`, `express.d.ts`, and full `user` model/controller/route slice. |
| **File uploads selected** | [Multer & Cloudinary](references/opt-uploads.md) | In-memory Multer middleware, Cloudinary v2 streaming upload/delete helpers, and controller integration. |
| **Redis selected** | [Redis Caching](references/opt-redis.md) | Redis connection client, `getCached`, `setCached`, cache-aside pattern, and graceful shutdown hook. |
| **Docker selected** | [Docker & Compose](references/opt-docker.md) | Production multi-stage `Dockerfile`, `.dockerignore`, Infra-only Compose, and Full-Stack Compose. |

---

## 8. Strict Do-Nots & Anti-Patterns

- **DO NOT** execute database queries or inline handlers inside `src/routes/`.
- **DO NOT** use CommonJS `require()` or `module.exports`; write strict ESM.
- **DO NOT** catch errors in controllers to return ad-hoc 500 status codes; let errors bubble to `errorHandler`.
- **DO NOT** create singular directories like `src/model/` or `src/controller/`; use plural names.
- **DO NOT** inject untyped fields onto `req.user`; declare properties in `src/types/express.d.ts`.
- **DO NOT** hardcode credentials or URLs; always read from `process.env`.
- **DO NOT** scaffold leftover business entities (`movie`, `booking`, `product`) during a new project bootstrap.
