# Next.js Frontend Wiring Adapter

### 1. Inspect
- API Layer: `src/lib/api.ts`, `src/lib/axios.ts`, or `src/lib/fetch.ts`
- Rewrites: `next.config.ts` or `next.config.mjs` (`rewrites()`)
- Calls: `src/app/**/*.tsx`, `src/stores/**/*.ts`, `src/actions/**/*.ts`
- Environment: `.env.example`, `.env.local.example` (`NEXT_PUBLIC_API_URL`)

### 2. Grep Targets
```bash
grep -rn "NEXT_PUBLIC_API_URL" src/ .env*               # Public client-side API URL
grep -rn "rewrites" next.config.*                       # Reverse proxy rewrites
grep -rn "cookies()" src/app/ src/actions/              # Server-side cookie forwarding
grep -rn "api\.\(get\|post\)\|fetch(" src/              # Outgoing HTTP calls
```

### 3. Gotchas
- **Env Visibility:** `NEXT_PUBLIC_*` is required for client components (`'use client'`). Server components can read private env vars.
- **SSR Cookie Forwarding:** Server Components and Server Actions do not forward browser cookies automatically. Must forward `headers: { Cookie: cookies().toString() }`.
- **Fetch Caching:** Next.js `fetch` caches by default in older versions. Dynamic API routes need `cache: "no-store"` or `export const dynamic = "force-dynamic"`.
- **Next.js Rewrites:** Using `rewrites()` in `next.config.ts` to map `/api/:path*` to the backend eliminates cross-origin CORS issues entirely.
- **Hydration Sync:** Zustand stores reading local tokens must guard against SSR mismatch using an hydration check.
