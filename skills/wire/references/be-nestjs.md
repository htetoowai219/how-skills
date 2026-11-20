# NestJS Backend Wiring Adapter

### 1. Inspect
- Bootstrap: `src/main.ts` (`setGlobalPrefix`, `enableCors`, `ValidationPipe`)
- Controllers: `src/**/*.controller.ts` (route prefixes, HTTP decorators, param types)
- DTOs: `src/**/*.dto.ts` (`class-validator` rules, payload shapes)
- Environment: `.env.example` (`PORT`, `CLIENT_URL`, `JWT_SECRET`)

### 2. Grep Targets
```bash
grep -rn "setGlobalPrefix\|enableVersioning" src/main.ts  # Base path and API versioning
grep -rn "enableCors" src/main.ts                        # CORS origin and credentials
grep -rn "@Controller(" src/                             # Controller route prefixes
grep -rn "@\(Get\|Post\|Put\|Patch\|Delete\)(" src/      # Route verbs and endpoints
grep -rn "ValidationPipe" src/main.ts src/               # Whitelist/payload stripping
```

### 3. Gotchas
- **Global Prefix:** `setGlobalPrefix("api/v1")` + `@Controller("users")` resolves to `/api/v1/users`.
- **Strict DTO Whitelisting:** `whitelist: true, forbidNonWhitelisted: true` causes 400 errors if frontend sends extra unmapped fields.
- **Array Error Messages:** NestJS `ValidationPipe` returns `{ message: string[], error: string, statusCode: 400 }`. Frontend error handling must accommodate string arrays.
- **Cookie Parser:** Reading `req.cookies` requires registering `cookie-parser` in `src/main.ts`.
- **Param Types:** `@Param("id", ParseIntPipe)` fails with 400 if frontend passes string IDs; `@Param("id", ParseUUIDPipe)` requires valid UUID.
