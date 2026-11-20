# NestJS Hardening Reference

## 1. Grep Targets
`useGlobalPipes`, `ValidationPipe`, `APP_GUARD`, `@UseGuards`, `@Public`, `enableCors`, `useGlobalInterceptors`, `ClassSerializerInterceptor`, `ThrottlerGuard`

## 2. Framework Traps
- **Mass Assignment:** `ValidationPipe` without `whitelist: true` and `forbidNonWhitelisted: true` allows arbitrary payload injection into controllers.
- **Undecorated DTO Properties:** Properties in DTO classes without `class-validator` decorators are stripped (with `whitelist: true`) or unvalidated, bypassing type guarantees.
- **Sensitive Data Leaks:** Forgetting global `ClassSerializerInterceptor` or `@Exclude()` on entity/DTO properties leaks `passwordHash`, salt, and internal tokens in responses.
- **Guard Execution Order:** If `RolesGuard` is declared before `AuthGuard` or relies on `req.user` when `AuthGuard` hasn't run, authorization fails open or throws 500.
- **Unsafe ExceptionFilter:** Custom exception filters exposing raw `exception.stack` or raw DB driver errors leak internal paths and schemas in production.
- **Unthrottled Auth:** Login, signup, and password-reset endpoints lacking `@Throttle()` allow credential stuffing and brute-force attacks.

## 3. Safe Fix Patterns

### Strict ValidationPipe & ClassSerializer (main.ts)
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
  }),
);
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

### Global Guard Order & Route Throttling
```typescript
// app.module.ts: AuthGuard must execute before RolesGuard
providers: [
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
];

// auth.controller.ts: Stricter limit on sensitive endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('login')
login(@Body() dto: LoginDto) { return this.authService.login(dto); }
```
