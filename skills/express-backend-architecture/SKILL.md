---
name: express-backend-architecture
description: Scaffolds, extends, and refactors modular Express.js TypeScript backends conforming to our production conventions (Mongoose, layered separation, asyncHandler, ApiError, and clean response envelopes). Trigger when bootstrapping a new Express backend, adding vertical resource slices (routes, controllers, models, types), or standardizing middleware and error handling. Do NOT use for frontend code, NestJS apps, Next.js API routes, or standalone Python/Go services.
license: MIT
compatibility: Designed for Agent Skills-compatible tools (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
metadata:
  source: custom
allowed-tools:
  - read_file
  - run_command
  - edit_file
  - write_file
---

# Express Backend Architecture

Enforces our production architecture, naming grammar, layer responsibilities, and error handling contracts for Express.js TypeScript APIs.

---

## 1. When to Load Which Reference

Keep this operational document compact. Offload deep code examples to `references/`:

| Objective / Task | Reference File to Read | What It Contains |
| :--- | :--- | :--- |
| **Scaffolding a new backend from scratch** | [Scaffold Template](references/scaffold-template.md) | `package.json`, `tsconfig.json`, `server.ts`, `app.ts`, `connectDb.ts`, and health check endpoints. |
| **Adding or modifying a feature/resource** | [Vertical Feature Slice](references/feature-slice.md) | Complete slice: `*.type.ts`, `*.model.ts`, `*.controller.ts`, and `*.route.ts`. |
| **Configuring auth, error handling, or utilities** | [Middleware & Utils](references/middleware-and-utils.md) | `ApiError`, `asyncHandler`, global error handler, JWT auth middleware, `express.d.ts`, and optional Cloudinary/Redis modules. |

---

## 2. Canonical Directory Structure & Naming Table

```text
src/
├── server.ts                       # Entry point: DB connection, HTTP listen, graceful shutdown
├── app.ts                          # App configuration: Helmet, CORS, parsers, routes, error handlers
├── db/
│   └── connectDb.ts                # Mongoose connection with exponential backoff & retry loop
├── routes/
│   ├── <resource>.route.ts         # Resource endpoints & middleware chaining
│   └── index.ts                    # Master route aggregator mounted at /api/v1
├── controllers/
│   └── <resource>.controller.ts    # Request handlers wrapped with asyncHandler
├── models/
│   └── <resource>.model.ts         # Mongoose schema, TypeScript interface, indexes
├── middlewares/
│   ├── auth.middleware.ts          # verifyAccessToken, requireRole, optionalAuth
│   ├── error.middleware.ts         # notFoundHandler & global errorHandler
│   ├── upload.middleware.ts        # [Optional] Multer memory storage & MIME validation
│   └── validate.middleware.ts      # [Optional] Zod request schema validation
├── utils/
│   ├── apiError.util.ts            # Custom HTTP error class with static status factories
│   ├── asyncHandler.util.ts        # Promise rejection forwarder to next()
│   ├── cloudinary.util.ts          # [Optional] Cloudinary upload/delete streams
│   └── redis.util.ts               # [Optional] Redis client with isRedisAvailable()
└── types/
    ├── express.d.ts                # Express.Request user augmentation
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

## 3. Core Architectural Rules

1. **Pure ESM with TypeScript**: Use `"type": "module"`, target `ES2022` or `NodeNext`. Use explicit `.js` extensions for local module imports in NodeNext.
2. **Plural Folder Names**: Directories under `src/` must be plural (`controllers/`, `models/`, `routes/`, `middlewares/`, `utils/`, `types/`).
3. **Split Bootstrap**: `app.ts` creates and configures the Express application; `server.ts` imports `app`, waits for `await connectDb()`, starts listening, and registers graceful termination handlers.
4. **Zero Inline Route Logic**: Route files declare endpoint paths and chain middlewares only. Handlers belong strictly in controllers.
5. **Centralized Error Propagation**: Never write redundant `try/catch` blocks in controllers. Wrap handlers with `asyncHandler(...)` and throw `ApiError.badRequest()`, `ApiError.notFound()`, etc.
6. **Consistent JSON Envelopes**:
   - Success: `res.status(200).json({ success: true, ...data })`
   - Created: `res.status(201).json({ success: true, message: "...", item })`
   - Error: `res.status(code).json({ success: false, message: "...", details? })`
7. **Hybrid Auth Transport**: Authentication middleware checks `req.cookies.token` first, falling back to `Authorization: Bearer <token>`. Decoded user data attaches to `req.user` typed via `src/types/express.d.ts`.
8. **Mongoose Discipline**:
   - Always pass `{ timestamps: true }` in schema options.
   - Use `lean()` on read-only queries for maximum throughput.
   - Sanitize search regex strings to avoid Catastrophic Backtracking (ReDoS).
9. **Resilient Database Connection**: `connectDb.ts` must implement an exponential retry loop (`MAX_ATTEMPTS = 10`, `RETRY_DELAY_MS = 3000`) before throwing a fatal exit.
10. **Module Isolation**: Optional integrations (Cloudinary, Redis, Zod, Mailer) must remain modular and only be introduced when the project explicitly requires them.

---

## 4. Workflow: Scaffolding a New Backend

1. **Read Scaffold Template**: Consult [Scaffold Template](references/scaffold-template.md).
2. **Initialize Configuration**:
   - Create `package.json` with ESM `"type": "module"` and `scripts` (`dev: "tsx watch src/server.ts"`, `build: "tsc"`).
   - Configure `tsconfig.json` with `NodeNext` or `ES2022`.
   - Setup `.env.example` and `.gitignore`.
3. **Establish Core Infrastructure**:
   - Implement `src/db/connectDb.ts` with connection retry loop.
   - Implement `src/utils/apiError.util.ts` and `src/utils/asyncHandler.util.ts`.
   - Implement `src/middlewares/error.middleware.ts` (`notFoundHandler`, `errorHandler`).
   - Implement `src/app.ts` with security headers, CORS, parsers, and `/health` check.
   - Implement `src/server.ts` with graceful shutdown hooks.
4. **Mount Route Aggregator**: Create `src/routes/index.ts` mounted at `/api/v1` in `app.ts`.

---

## 5. Workflow: Adding a New Resource / Feature Slice

1. **Read Feature Slice Reference**: Consult [Vertical Feature Slice](references/feature-slice.md).
2. **Define Types (`src/types/<resource>.type.ts`)**: Declare Mongoose document interface, DTOs, and query param types.
3. **Define Model (`src/models/<resource>.model.ts`)**: Define schema with validation, indexes, and `{ timestamps: true }`.
4. **Implement Controller (`src/controllers/<resource>.controller.ts`)**:
   - Wrap each export with `asyncHandler`.
   - Extract `req.params`, `req.query`, or `req.body`.
   - Execute model operations.
   - Throw `ApiError` on invalid state or missing entities.
   - Return standardized response envelope.
5. **Define Routes (`src/routes/<resource>.route.ts`)**:
   - Map HTTP verbs (`get`, `post`, `patch`, `delete`).
   - Attach guards (`verifyAccessToken`, `requireRole('admin')`).
6. **Register in Aggregator (`src/routes/index.ts`)**:
   - Mount router at `router.use("/<plural-resource>", resourceRoutes)`.

---

## 6. Strict Do-Nots & Anti-Patterns

- **DO NOT** execute database queries or inline request handling inside `src/routes/`.
- **DO NOT** use CommonJS `require()` or `module.exports`; write strict ESM.
- **DO NOT** catch errors in controllers only to return custom 500 status codes; let unhandled errors bubble to `errorHandler`.
- **DO NOT** create singular folder names like `src/model/` or `src/controller/`; use plural names.
- **DO NOT** dump untyped objects into `req.user`; declare properties in `src/types/express.d.ts`.
- **DO NOT** hardcode secrets or connection URLs; always read from validated `process.env`.
- **DO NOT** install heavyweight ORMs, DI containers, or repository patterns; adhere to our lean controller-model architecture.
