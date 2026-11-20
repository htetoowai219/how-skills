# Vite Frontend Wiring Adapter

### 1. Inspect
- API Client: `src/lib/axios.ts`, `src/services/api.ts`, or `src/api/client.ts`
- Dev Proxy: `vite.config.ts` (`server.proxy`)
- API Calls: `src/stores/**/*.ts`, `src/api/**/*.ts`, `src/hooks/**/*.ts`
- Environment: `.env.example`, `src/vite-env.d.ts` (`VITE_API_URL`)

### 2. Grep Targets
```bash
grep -rn "VITE_API_URL\|import.meta.env" src/ .env*      # Base URL variable resolution
grep -rn "baseURL\|withCredentials" src/lib/ src/api/   # Client transport configuration
grep -rn "api\.\(get\|post\|put\|patch\|delete\)" src/  # Outgoing HTTP endpoint calls
grep -rn "proxy:" vite.config.*                         # Dev server reverse proxy rules
```

### 3. Gotchas
- **Env Variable Prefix:** Variables must start with `VITE_`. Non-prefixed keys return `undefined` client-side.
- **Proxy vs Direct CORS:** If `server.proxy` maps `/api` -> `http://localhost:5000`, client `baseURL` should be `/api`, not `http://localhost:5000`.
- **Credential Flag:** `withCredentials: true` is required for Axios to attach and receive HTTP-only cookies.
- **Trailing Slashes:** Calling `api.get("/users/")` when the backend mounts `/users` can cause 301 redirects or 404 errors.
- **Envelope Unwrapping:** Verify whether stores expect raw data or unwrapped envelopes (`res.data.data` vs `res.data`).
