# Data Layer Hardening Reference

## 1. Grep Targets
`find(`, `findByIdAndUpdate(`, `$queryRaw`, `prisma.`, `db.query`, `redis.`, `ioredis`

## 2. Database Traps
- **MongoDB NoSQL Injection & Cast Crashes:** Passing raw `req.query` with `$` keys (e.g. `{"$ne": null}`) bypasses auth checks. Unchecked `id` strings passed to `findById` throw unhandled 500 `CastError`s.
- **SQL String Interpolation:** Raw SQL `$queryRawUnsafe` or concatenated input creates SQL injection. Returning unprojected user rows exposes password hashes and tokens.
- **Concurrency & Race Conditions:** Read-modify-write patterns (`doc.val += 1; await doc.save()`) corrupt balances/inventory under concurrent requests without atomic filters or transactions.
- **Unbounded Redis Memory:** Creating keys without `EX`/`PX` TTLs causes unbounded memory exhaustion. Non-atomic locks cause deadlock.

## 3. Safe Fix Patterns

### MongoDB / Mongoose Hardening
```typescript
import { Types } from 'mongoose';
if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid ID');

// Atomic concurrency-safe update with tenant ownership filter
const updated = await Account.findOneAndUpdate(
  { _id: id, userId: req.user.id, balance: { $gte: amount } },
  { $inc: { balance: -amount } },
  { new: true }
);
if (!updated) throw new ConflictException('Insufficient funds or unauthorized');
```

### Prisma / SQL Safe Projections & Transactions
```typescript
// Explicit projection + pagination cap + relation transaction
const limit = Math.min(Number(req.query.limit) || 20, 100);
const [user, posts] = await prisma.$transaction([
  prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true } // password omitted
  }),
  prisma.post.findMany({ where: { authorId: req.user.id }, take: limit })
]);
```

### Redis TTL & Atomic Locking
```typescript
// Always set TTL and domain-namespaced keys
await redis.set(`session:${userId}`, token, 'EX', 3600);

// Safe distributed lock with auto-expiry
const acquired = await redis.set(`lock:order:${orderId}`, workerId, 'NX', 'PX', 5000);
```
