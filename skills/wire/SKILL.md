---
name: wire
description: Wires an existing frontend and backend (routes, payloads, CORS/proxy, auth transport, env). Trigger when connecting apps or fixing API integration issues. Do NOT use for initial scaffolding from scratch or UI styling.
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

# Wire (Frontend & Backend Integration)

Connects an existing frontend and backend by auditing and aligning route paths, HTTP verbs, payload shapes, response envelopes, CORS/proxy rules, auth transports, and environment configs with minimal token consumption.

---

## 1. Targeted Discovery Gate (Cheap Read-Only First)

1. Find candidates by scanning root + 1–2 levels deep (ignore `node_modules`, `dist`, `.next`, `build`, `.git`, `venv`, `target`).
2. Read **only** top-level manifest/config filenames (`package.json`, `vite.config.*`, `next.config.*`, `go.mod`, `pyproject.toml`, `Cargo.toml`) to determine frontend and backend directories and stacks.
3. **Hard Stop Rule:** If either frontend OR backend is missing, **STOP immediately**. Do not edit files or scaffold stubs. State what was found and prompt via interactive question tool to either specify custom paths or abort.

---

## 2. Interactive Grill (Native Picker First, Minimal Questions)

Print a 2-line detection summary:
```text
FE: <frontend-path> (<detected-stack>) | BE: <backend-path> (<detected-stack>)
Ready to audit integration contracts.
```

**Interactive Tool First:** Call runtime question tool (`ask_question`, `question`, `AskUserQuestion`, `request_user_input`). Fall back to text checklist only if no tool exists. Ask only ambiguous/necessary atomic questions (`<= 16` char headers, recommended first):

- `Folder Paths` *(only if multiple candidates exist)*: `(Recommended) Use detected folders` / `Specify custom paths`
- `Transport`: `(Recommended) Direct CORS` / `Dev Proxy or Rewrites`
- `Auth Flow` *(only if auth present)*: `(Recommended) httpOnly Cookies` / `Bearer Token` / `Public (None)`
- `Conflict Rule`: `(Recommended) Backend truth` / `Frontend truth` / `Report first (no writes)`

Wait for answers before loading adapters or reading source code.

---

## 3. Lazy Adapter Load (Zero-Adapter Fallback)

Load **strictly** 1 matching `be-*.md` and 1 matching `fe-*.md` from the Routing Table below. Never load unused adapters.  
*Unknown language/framework (Go, FastAPI, Rust, Vue, etc.):* Skip adapters and conduct the audit using generic HTTP/REST contracts.

---

## 4. Token-Safe Inspection Rules (Strict File Allowlist)

**Use `glob` and `grep` before reading files.** Read only essential lines.
- **Allowed reads:** Server entrypoint (`server.ts`/`main.ts`/`app.ts`), CORS/cookie middleware, route/controller files, request DTOs/Zod schemas, error/response wrappers, frontend API client (`axios.ts`/`api.ts`), stores/hooks calling the API, and `.env.example`.
- **Forbidden reads:** Presentational UI components/JSX markup, CSS/Tailwind files, unit/e2e tests, DB seeds, migrations, and lockfiles.

---

## 5. 5-Point Wiring Audit

Apply modifications strictly according to the selected `Conflict Rule`. Never overwrite real secrets in `.env`; edit `.env.example` and list missing local `.env` keys in the final report.

1. **Ports & Base URL:** Ensure backend port and global prefixes (`/api`, `/api/v1`) align with frontend `baseURL` and `.env.example`.
2. **CORS / Proxy:** Validate exact origin match (never `origin: "*"` with credentials) and allowed headers/methods, OR verify dev proxy/rewrite forwarding.
3. **Auth Transport:** If cookie-based, verify `cookieParser()`, `credentials: true` on CORS, `withCredentials: true` on frontend client, and dev-safe `SameSite`/`Secure` flags. If Bearer-based, verify header interceptor and 401 handling.
4. **Endpoint & Verb Parity:** Match `METHOD /full/path`, route params (`:id`), and query strings between backend handlers and frontend API calls. Never delete unused backend routes; flag them only.
5. **Payload & Envelope Parity:** Align JSON/multipart keys, form schemas vs backend DTOs/validators, response envelope unwrapping (e.g. `res.data.data` vs `res.data`), and error formats (`string` vs array).

---

## 6. Verify & Exception-Only Report

1. Run native typecheck/build commands on both sides (`npm run typecheck`, `tsc --noEmit`, `go vet ./...`).
2. Output a concise exception-only report:
   - **Status line:** `Verified N endpoints (X matched, Y fixed, Z missing). Typechecks: FE pass, BE pass.`
   - **Changes / Exceptions Table** *(include ONLY fixed, mismatched, or missing endpoints; omit already-matched rows)*:
     | FE Call | Method & Path | BE Handler | Action Taken / Status |
     |---|---|---|---|
     | `useAuthStore.login` | `POST /api/v1/auth/login` | `auth.controller.ts:login` | Fixed: aligned payload key `userName` -> `email` |
   - **Config & Local `.env` Updates Needed:** Bullet list of new keys to set in local `.env` files (if any).

---

## 7. Adapter Routing Table

> [!IMPORTANT]
> **Token Optimization:** Load ONLY the active backend and frontend adapter. Never load unneeded reference files.

| Stack Component | Reference File | Purpose |
|---|---|---|
| **Express Backend** | [Express Adapter](references/be-express.md) | Mount prefixes, CORS credentials, cookie-parser, and Multer fields. |
| **NestJS Backend** | [NestJS Adapter](references/be-nestjs.md) | Global prefix, CORS, ValidationPipe whitelisting, and array errors. |
| **Vite Frontend** | [Vite Adapter](references/fe-vite.md) | `VITE_*` env, Axios `withCredentials`, and `vite.config` dev proxy. |
| **Next.js Frontend** | [Next.js Adapter](references/fe-next.md) | `NEXT_PUBLIC_*` env, SSR cookie forwarding, and `rewrites()` config. |
