# Optional Module: Redis Client, Caching & Locking

Lazy-load this reference **ONLY** if Redis caching or distributed locking is enabled. It provides a non-blocking Redis connection manager, cache-aside read/write helpers, and graceful disconnection.

---

## 1. Dependencies & Environment Variables

### Package Installation
```bash
npm install redis
```

### Append to `.env.example`
```bash
REDIS_URL=redis://localhost:6379
```

---

## 2. Redis Client Utility

### `src/utils/redis.util.ts`
```typescript
import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;
let isConnected = false;

/**
 * Initializes and connects the Redis client
 */
export const connectRedis = async (): Promise<void> => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  client = createClient({ url });

  client.on("connect", () => {
    isConnected = true;
    console.log("Redis client connected");
  });

  client.on("error", (err) => {
    isConnected = false;
    console.warn("Redis connection error:", (err as Error).message);
  });

  try {
    await client.connect();
  } catch (error) {
    console.warn("Could not establish initial Redis connection. Operating in cache-bypass mode.");
  }
};

/**
 * Check if Redis is actively connected
 */
export const isRedisAvailable = (): boolean => isConnected && client !== null;

/**
 * Retrieve a JSON-deserialized value from cache
 */
export const getCached = async <T>(key: string): Promise<T | null> => {
  if (!isRedisAvailable() || !client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Set a JSON-serialized value in cache with a TTL
 */
export const setCached = async (
  key: string,
  value: unknown,
  ttlSeconds = 300,
): Promise<void> => {
  if (!isRedisAvailable() || !client) return;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to set Redis cache key "${key}":`, err);
  }
};

/**
 * Remove a cached key
 */
export const deleteCached = async (key: string): Promise<void> => {
  if (!isRedisAvailable() || !client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.warn(`Failed to delete Redis cache key "${key}":`, err);
  }
};

/**
 * Disconnect Redis on graceful shutdown
 */
export const disconnectRedis = async (): Promise<void> => {
  if (client && isConnected) {
    try {
      await client.quit();
      console.log("Redis client disconnected gracefully");
    } catch {
      // Ignore disconnect errors during process exit
    }
  }
};
```

---

## 3. Server Startup & Graceful Shutdown Integration

### In `src/server.ts`
```typescript
import connectDb from "./db/connectDb.js";
import { connectRedis, disconnectRedis } from "./utils/redis.util.js";

async function startServer(): Promise<void> {
  await connectDb();
  await connectRedis(); // Connect after database

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  const handleTermination = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down...`);
    await disconnectRedis();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", () => handleTermination("SIGINT"));
  process.on("SIGTERM", () => handleTermination("SIGTERM"));
}
```

---

## 4. Cache-Aside Controller Pattern

```typescript
import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { getCached, setCached } from "../utils/redis.util.js";
import { Item } from "../models/item.model.js";

export const getItemsWithCache = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = `items:all:${req.query.page || "1"}`;

  // 1. Try reading from cache
  const cachedData = await getCached(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      success: true,
      source: "cache",
      data: cachedData,
    });
  }

  // 2. Fall back to MongoDB query
  const items = await Item.find().limit(20).lean();

  // 3. Populate cache (TTL: 5 minutes)
  await setCached(cacheKey, items, 300);

  res.status(200).json({
    success: true,
    source: "db",
    data: items,
  });
});
```
