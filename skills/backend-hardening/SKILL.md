---
name: backend-hardening
description: Audits backend APIs for security, IDOR/RBAC, mass assignment, data leaks, injection, uploads, rate limits, and DB indexes. Do NOT use for frontend UI, CSS, or scaffolding new features.
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

# Backend Hardening Audit

Audits backend codebases for critical security vulnerabilities, broken authorization, mass assignment, data leaks, and concurrency bugs with zero fluff and strict token economy.

---

## 1. Targeted Backend Discovery & Strict File Allowlist

Locate backend directories by checking manifests (`package.json`, `go.mod`, `pyproject.toml`, `Cargo.toml`) 1–2 levels deep.
- **Stop Gate:** If no backend manifests or server entrypoints exist, stop immediately: *"No backend codebase detected."*
- **Token-Safe Inspection Rules (Enforce Strictly):**
  - Always `glob` and `grep` before reading files.
  - **Allowed reads:** Bootstrap entrypoints (`main.ts`, `app.ts`, `index.ts`), auth & RBAC middleware/guards, route/controller files, DTOs/validators, DB schemas/models, upload utils, global error handlers, and `.env.example`.
  - **Forbidden reads:** Frontend folders (`client/`, `web/`, `frontend/`), UI/CSS/assets, test suites, seed scripts, docs, and lockfiles.

---

## 2. Interactive Grill (Native Picker First, 1 Compact Batch)

Print a 2-line detection summary:
```text
Backend: <path> (<framework>) | Data/Storage: <DB/Redis/Uploads detected>
Ready to harden backend.
```

**Interactive Tool First:** Call runtime question tool (`ask_question` in Antigravity, `question` in OpenCode, `AskUserQuestion` in Claude Code, `request_user_input` in Codex; plain text fallback ONLY if unavailable).

Ask ONLY relevant atomic questions (`<= 16` char headers, 2–3 options, recommended first):
1. `Backend dir` *(ask ONLY if multiple backends exist or non-standard path)*
2. `Audit Mode`:
   - `Audit + Safe Fixes (Recommended)` — Report all findings; auto-apply low-risk fixes (security headers, body limits, safe projections, missing indexes, validation flags) and leave breaking/auth-design changes for approval.
   - `Report Only` — Read-only audit; edit zero files.
3. `Target Env`:
   - `Public / Production (Recommended)` — Full strictness (rate limits, headers, cookie flags, error redaction).
   - `Internal / Demo / Hackathon` — Prioritize critical/high exploits (IDOR, mass assignment, leaked secrets/hashes, broken auth) without noisy ops overhead.
4. `Audit Scope`:
   - `Full Backend (Recommended)` — Audit all backend routes/models/auth.
   - `Changed Files Only` — Restrict strictly to `git diff` backend files.
   - `Specific Module` — Audit one resource/feature the user names.

Wait for answers before loading adapters or inspecting source files.

---

## 3. Lazy-Load Adapter Rule (Zero-Adapter Fallback)

- Load ONLY 1 matching framework adapter (`references/express.md` OR `references/nestjs.md`) + `references/data-layer.md` (ONLY if DB or Redis is detected). NEVER load unused adapters.
- **Zero-Adapter Fallback:** For unlisted stacks (Go, FastAPI, Rust), apply the 8-point checklist directly against their routers, handlers, middleware, and queries.

---

## 4. The 8-Point Backend Hardening Checklist

Verify issues directly in actual files. Report ONLY verified bugs with exact `file:line` locations (never generic textbook advice):

1. **Auth & Secret Hygiene:** Hardcoded fallback secrets (e.g. `process.env.JWT_SECRET || "secret"`), missing boot-time env validation, missing JWT expiry or algorithm pinning, weak cookie flags (`httpOnly: false`, missing `secure` in prod or `sameSite`), unrevoked/unrotated refresh tokens.
2. **Authorization, RBAC & IDOR (Highest Priority):** Authenticated routes checking login without verifying **ownership or tenant/role scope** (e.g., `GET/PATCH/DELETE /:id` querying purely by `:id` without scoping to `req.user.id`, `ownerId`, or hierarchy checks). Admin/staff endpoints lacking explicit role guards.
3. **Input Validation & Mass Assignment:** Raw `req.body` passed directly to `.create()`, `.update()`, or `.findByIdAndUpdate()` (allowing privilege escalation via `role`, `isAdmin`, `status`, `ownerId`). Missing schema validation, unvalidated `:id` params (raw 500 CastErrors), or unstripped unknown fields.
4. **Data & Error Leakage:** Returning whole DB entities containing `password`, `passwordHash`, `refreshToken`, OTPs, or internal metadata instead of explicit projections/DTOs. Exposing stack traces, SQL/Mongo errors, or file paths in production error responses.
5. **Injection & File Upload Hardening:** Unsanitized query objects vulnerable to NoSQL operator injection (`$ne`, `$gt`, `$where`), unsafe dynamic regex (ReDoS), or string-interpolated raw SQL. On uploads: missing file size caps, missing MIME/extension allowlists, trusting client filenames (path traversal), or leaking temp files.
6. **DoS, Pagination & Abuse Controls:** Unbounded queries (`.find()` without `limit` or uncapped `?limit=999999`—enforce ceiling like `Math.min(limit, 100)`). Missing request body limits, missing rate limiting on auth/sensitive endpoints, or missing `trust proxy` behind reverse proxies.
7. **Database & Concurrency Integrity:** Missing indexes on frequently queried foreign keys, lookup fields, or unique constraints. Read-modify-write races on critical state (balances, inventory, bookings) lacking atomic updates, unique constraints, transactions, or locks.
8. **Transport & Header Hardening:** Missing security headers (`helmet` or equivalent), permissive CORS (`origin: '*'` with `credentials: true` or reflecting arbitrary `Origin`), or secrets committed to repository.

---

## 5. Safe Auto-Fix Boundary & Verification

- In `Audit + Safe Fixes` mode, apply ONLY safe, non-breaking fixes:
  - Remove fallback secrets with fail-fast startup checks.
  - Add security headers (`helmet`) and strict body limits (`limit: '10kb'`).
  - Cap unbounded pagination (`Math.min(limit, 100)`).
  - Strip sensitive fields (`passwordHash`) from queries and DTOs.
  - Enable DTO whitelisting flags (`whitelist: true, forbidNonWhitelisted: true`).
  - Add missing obvious indexes on schema lookup fields.
- **NEVER** silently alter API response schemas or guess ambiguous RBAC rules—mark them under `Needs Decision`.
- If files were modified, run native build/typecheck (`tsc --noEmit`, `go vet ./...`, etc.) to verify zero regressions.

---

## 6. Exception-Only Severity Report

Omit passing checks completely. Print:
- **Tally:** `Audit complete: X Critical, Y High, Z Medium (A auto-fixed, B need manual/design decision). Build check: <pass/skipped>.`
- **Table 1 — Auto-Fixed** *(omit if none)*:
  `Severity | File:Line | Issue | Fix Applied`
- **Table 2 — Action Required** *(sorted Critical -> High -> Medium)*:
  `Severity | File:Line | Exploit / Concrete Risk | Recommended Fix`

---

## 7. Lazy-Load Adapter Routing Table

> [!WARNING]
> **Token Economy:** Load ONLY active stack adapters. Never load unneeded reference files.

| Stack Component | Reference File | Purpose |
|---|---|---|
| **Express** | [Express Adapter](references/express.md) | Async handling, trust proxy, rate limiting, Multer, 4-arg error handlers. |
| **NestJS** | [NestJS Adapter](references/nestjs.md) | ValidationPipe flags, ClassSerializer, Guard ordering, Throttler. |
| **DB / Redis** | [Data Layer](references/data-layer.md) | NoSQL/SQL injection, atomic race fixes, projections, Redis TTLs. |
