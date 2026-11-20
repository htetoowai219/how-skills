# Express Backend Wiring Adapter

### 1. Inspect
- Entrypoint & Middleware: `src/app.ts`, `src/server.ts`, or `src/index.ts`
- Routes & Controllers: `src/routes/**/*.ts`, `src/controllers/**/*.ts`
- Error & Auth: `src/middlewares/error.middleware.ts`, `src/middlewares/auth.middleware.ts`
- Environment: `.env.example` (`PORT`, `CLIENT_URL`, `JWT_SECRET`)

### 2. Grep Targets
```bash
grep -rn "app.use(" src/app.ts src/server.ts        # Route mount prefixes & middleware
grep -rn "cors(" src/                               # CORS origin & credentials config
grep -rn "cookie" src/                              # Cookie parser & cookie setters
grep -rn "router\.\(get\|post\|put\|patch\|delete\)" src/routes/  # Endpoints & verbs
grep -rn "upload\.\(single\|array\)" src/routes/    # Multer multipart field names
```

### 3. Gotchas
- **CORS Credentials:** `credentials: true` strictly forbids `origin: "*"`. Must match client origin exactly.
- **Compounding Prefixes:** `app.use("/api/v1", router)` + `router.use("/items", itemRouter)` = `/api/v1/items`.
- **Response Envelope:** If controllers wrap responses in `{ success: true, data }`, frontend Axios calls resolve to `res.data.data`.
- **Parser Ordering:** `express.json()` and `cookieParser()` must be registered before mounting routers.
- **Multipart Fields:** Multer field name in route (`upload.single("image")`) must match frontend `FormData.append("image", file)`.
