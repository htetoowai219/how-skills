# Middleware & Utilities Reference

This reference covers the error handling pipeline, authentication layer, and optional utility modules (uploads, caching, validation).

---

## 1. Always Include: Error Handling Pipeline

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
    // Mongoose validation error
    statusCode = 400;
    message = "Database validation failed";
    details = err.message;
  } else if (err.name === "CastError") {
    // Mongoose invalid ObjectId
    statusCode = 400;
    message = "Invalid resource identifier format";
  } else if ((err as any).code === 11000) {
    // Mongoose duplicate key error
    statusCode = 409;
    const field = Object.keys((err as any).keyValue || {})[0] || "Field";
    message = `${field} already exists`;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid access token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Access token has expired";
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

## 2. Always Include: Authentication & Type Augmentation

### `src/types/express.d.ts`
```typescript
export interface AuthUser {
  id: string;
  role: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
```

### `src/middlewares/auth.middleware.ts`
```typescript
import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.util.js";
import { type AuthUser } from "../types/express.d.js";

interface DecodedToken {
  id: string;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
}

function extractToken(req: Request): string | null {
  // 1. Check HTTP-only cookie first
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  // 2. Fall back to Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

export const verifyAccessToken = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = extractToken(req);

  if (!token) {
    return next(ApiError.unauthorized("Access token required."));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(ApiError.internal("JWT_SECRET is not configured."));
  }

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return next(ApiError.unauthorized("Access token expired."));
    }
    return next(ApiError.unauthorized("Invalid access token."));
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required."));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("Insufficient permissions for this resource."));
    }

    next();
  };
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = extractToken(req);
  if (!token) return next();

  const secret = process.env.JWT_SECRET;
  if (!secret) return next();

  try {
    const decoded = jwt.verify(token, secret) as DecodedToken;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch {
    next();
  }
};
```

---

## 3. Optional Module: File Uploads & Cloudinary

Install dependencies: `npm install multer cloudinary` and `npm install -D @types/multer`.

### `src/middlewares/upload.middleware.ts`
```typescript
import multer from "multer";
import { ApiError } from "../utils/apiError.util.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`Unsupported file format: ${file.mimetype}`));
    }
  },
});
```

### `src/utils/cloudinary.util.ts`
```typescript
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = (
  fileBuffer: Buffer,
  folder: string,
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
};
```

---

## 4. Optional Module: Redis Cache

Install dependencies: `npm install redis`.

### `src/utils/redis.util.ts`
```typescript
import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;
let isConnected = false;

export const connectRedis = async (): Promise<void> => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";

  client = createClient({ url });

  client.on("connect", () => {
    isConnected = true;
    console.log("Connected to Redis");
  });

  client.on("error", (err) => {
    isConnected = false;
    console.error("Redis connection error:", err.message);
  });

  await client.connect();
};

export const isRedisAvailable = (): boolean => isConnected;

export const getCached = async <T>(key: string): Promise<T | null> => {
  if (!isConnected || !client) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setCached = async (
  key: string,
  value: unknown,
  ttlSeconds = 300,
): Promise<void> => {
  if (!isConnected || !client) return;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn("Failed to set Redis cache:", err);
  }
};
```
