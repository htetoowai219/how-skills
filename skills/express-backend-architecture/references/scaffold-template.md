# Scaffold Template: Core Express Backend

This reference provides the production-grade foundational scaffolding for an Express backend conforming to our architectural conventions.

---

## 1. Directory Tree

```text
<project-root>/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── src/
    ├── server.ts                   # Bootstraps DB, starts HTTP listener, handles graceful shutdown
    ├── app.ts                      # Express app, security middleware pipeline, route mounting, error handling
    ├── db/
    │   └── connectDb.ts            # Mongoose connection with retry loop & sleep backoff
    ├── routes/
    │   └── index.ts                # Master route aggregator
    ├── controllers/
    ├── models/
    ├── middlewares/
    │   └── error.middleware.ts     # notFoundHandler & global errorHandler
    ├── utils/
    │   ├── apiError.util.ts        # Custom HTTP error class
    │   └── asyncHandler.util.ts    # Route handler wrapper
    └── types/
        └── express.d.ts            # Ambient Express typings
```

---

## 2. Configuration Files

### `package.json`
```json
{
  "name": "express-backend",
  "version": "1.0.0",
  "description": "Production Express TypeScript API",
  "private": true,
  "type": "module",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "seed": "tsx src/seed/seed.ts"
  },
  "dependencies": {
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^5.0.1",
    "helmet": "^8.0.0",
    "mongoose": "^9.0.0"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
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
JWT_SECRET=super_secret_jwt_key_change_in_production
```

---

## 3. Database Bootstrap with Exponential Retry

### `src/db/connectDb.ts`
```typescript
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const connectDb = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is missing.");
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5_000,
      });
      console.log(`Connected to Database: ${conn.connection.host}`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${message}`,
      );

      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }

      await sleep(RETRY_DELAY_MS);
    }
  }
};

export default connectDb;
```

---

## 4. Application Setup & Middlewares

### `src/app.ts`
```typescript
import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";

const app = express();

// Trust reverse proxy for HTTPS cookie security
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS Configuration
const clientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((u) => u.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (clientUrls.includes(cleanOrigin) || cleanOrigin === "http://localhost:5173") {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS policy"));
    },
    credentials: true,
  }),
);

// Body and Cookie Parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoints
const handleHealthCheck = (_req: Request, res: Response): void => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatusMap[dbState] || "unknown",
      name: mongoose.connection.name,
    },
    system: {
      environment: process.env.NODE_ENV || "development",
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
};

app.get("/health", handleHealthCheck);
app.get("/api/health", handleHealthCheck);

// Mount API routes
app.use("/api/v1", routes);

// Error Handling Pipeline
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

---

## 5. Entry Point & Graceful Shutdown

### `src/server.ts`
```typescript
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDb from "./db/connectDb.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

async function startServer(): Promise<void> {
  await connectDb();

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });

  const handleShutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received. Closing HTTP server & database connection...`);
    server.close(async () => {
      try {
        await mongoose.disconnect();
        console.log("Database disconnected. Server shut down cleanly.");
        process.exit(0);
      } catch (err) {
        console.error("Error during graceful shutdown:", err);
        process.exit(1);
      }
    });
  };

  process.on("SIGINT", () => void handleShutdown("SIGINT"));
  process.on("SIGTERM", () => void handleShutdown("SIGTERM"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
```
