# Core Scaffold Reference

This reference defines the foundational files created during every new Express TypeScript backend scaffold. All templates use strict ESM (`"type": "module"`), NodeNext module resolution, and clean layered architecture.

---

## 1. Directory Tree (Base Scaffold)

```text
<target-directory>/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── src/
    ├── server.ts                   # Process entry point: DB connect, HTTP listen, graceful shutdown
    ├── app.ts                      # Express app: security middleware, parsers, router mount, error handler
    ├── db/
    │   └── connectDb.ts            # Mongoose connection with retry loop & sleep backoff
    ├── routes/
    │   ├── index.ts                # Master route aggregator mounted at /api/v1
    │   └── health.route.ts         # Service heartbeat endpoint
    ├── controllers/
    │   └── health.controller.ts    # Health check handler
    ├── models/                     # Domain schemas (empty on base scaffold unless auth enabled)
    ├── middlewares/
    │   └── error.middleware.ts     # notFoundHandler & global errorHandler
    ├── utils/
    │   ├── apiError.util.ts        # Custom HTTP error class with status factories
    │   └── asyncHandler.util.ts    # Promise rejection forwarder
    └── types/                      # Shared types and ambient declarations
```

---

## 2. Configuration Files

### `package.json`
```json
{
  "name": "express-backend",
  "version": "1.0.0",
  "description": "Express TypeScript Backend API",
  "private": true,
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.0.1",
    "helmet": "^8.0.0",
    "mongoose": "^8.9.5"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.10",
    "tsx": "^4.19.2",
    "typescript": "^5.7.3"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### `.env.example`
```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/my_database
```

### `.gitignore`
```text
node_modules/
dist/
.env
*.log
.DS_Store
```

---

## 3. Server Entry Point & Express Application

### `src/server.ts`
```typescript
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDb from "./db/connectDb.js";

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  await connectDb();

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });

  const handleTermination = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
      console.log("HTTP server closed. Exiting process.");
      process.exit(0);
    });

    // Force shutdown after 10s timeout
    setTimeout(() => {
      console.error("Graceful shutdown timeout exceeded. Forcing exit.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => handleTermination("SIGINT"));
  process.on("SIGTERM", () => handleTermination("SIGTERM"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
```

### `src/app.ts`
```typescript
import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import masterRouter from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

const app: Application = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

// Body and cookie parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Master API routes
app.use("/api/v1", masterRouter);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

---

## 4. Database Connection

### `src/db/connectDb.ts`
```typescript
import mongoose from "mongoose";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDb = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not defined.");
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(mongoUri);
      console.log(`MongoDB connected successfully on attempt ${attempt}`);
      return;
    } catch (error) {
      console.error(
        `MongoDB connection failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        (error as Error).message,
      );

      if (attempt === MAX_ATTEMPTS) {
        console.error("Exceeded maximum MongoDB connection attempts. Exiting process.");
        process.exit(1);
      }

      await sleep(RETRY_DELAY_MS);
    }
  }
};

export default connectDb;
```

---

## 5. Core Error Handling & Utilities

### `src/utils/apiError.util.ts`
```typescript
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "You do not have permission to perform this action"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = "Resource already exists"): ApiError {
    return new ApiError(409, message);
  }

  static tooMany(message = "Too many requests, please slow down"): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, message);
  }
}
```

### `src/utils/asyncHandler.util.ts`
```typescript
import { type Request, type Response, type NextFunction } from "express";

type AsyncRouteHandler = (
  req: Request<any, any, any, any>,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRouteHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
```

### `src/middlewares/error.middleware.ts`
```typescript
import { type Request, type Response, type NextFunction } from "express";
import { ApiError } from "../utils/apiError.util.js";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let details: unknown = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === "ValidationError") {
    // Mongoose schema validation failure
    statusCode = 400;
    message = "Database validation failed";
    details = err.message;
  } else if (err.name === "CastError") {
    // Mongoose invalid ObjectId format
    statusCode = 400;
    message = "Invalid resource identifier format";
  } else if ((err as any).code === 11000) {
    // Mongoose unique index violation
    statusCode = 409;
    const field = Object.keys((err as any).keyValue || {})[0] || "Field";
    message = `${field} already exists`;
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error("Unhandled Server Error:", err);
  }

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500 ? "Internal Server Error" : message,
    ...(details ? { details } : {}),
    ...(!isProduction && statusCode === 500 ? { stack: err.stack } : {}),
  });
};
```

---

## 6. Routes & Health Check

### `src/controllers/health.controller.ts`
```typescript
import { type Request, type Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.util.js";

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.status(200).json({
    success: true,
    message: "Service is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatusMap[dbState] || "unknown",
  });
});
```

### `src/routes/health.route.ts`
```typescript
import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";

const router = Router();

router.get("/", getHealth);

export default router;
```

### `src/routes/index.ts`
```typescript
import { Router } from "express";
import healthRoutes from "./health.route.js";

const router = Router();

// Base health endpoint: /api/v1/health
router.use("/health", healthRoutes);

// Additional domain resources are mounted here:
// router.use("/users", userRoutes);

export default router;
```
