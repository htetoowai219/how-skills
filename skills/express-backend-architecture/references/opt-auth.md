# Optional Module: Authentication, RBAC & User Slice

Lazy-load this reference **ONLY** if Users or Authentication is enabled. It provides JWT token verification, role-based access control, cookie/bearer hybrid transport, ambient Express type augmentation, and a full `user` resource slice.

---

## 1. Dependencies & Environment Variables

### Package Installation
```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# Optional: If Google OAuth was selected in the grill
npm install google-auth-library
```

### Append to `.env.example`
```bash
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
# Optional: If refresh tokens enabled
REFRESH_TOKEN_SECRET=super_secret_refresh_key_change_in_production
REFRESH_TOKEN_EXPIRES_IN=30d
# Optional: If Google OAuth enabled
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 2. Express Type Augmentation

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

---

## 3. Authentication Middleware

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
    return next(ApiError.unauthorized("Authentication required. Please log in."));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(ApiError.internal("JWT_SECRET is not configured on the server."));
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
      return next(ApiError.unauthorized("Access token has expired."));
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
      return next(ApiError.forbidden("Insufficient permissions to access this resource."));
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

## 4. User Domain Slice

### `src/types/user.type.ts`
```typescript
import { type Types, type Document } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser extends Document<Types.ObjectId> {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  googleId?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
}

export interface LoginUserInput {
  email: string;
  password?: string;
}
```

### `src/models/user.model.ts`
```typescript
import { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import { type IUser } from "../types/user.type.js";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: false, // Optional if user signs in via OAuth
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        return ret;
      },
    },
  },
);

// Hash password before saving if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper method
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", userSchema);
```

### `src/controllers/user.controller.ts`
```typescript
import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/apiError.util.js";
import { type RegisterUserInput, type LoginUserInput } from "../types/user.type.js";

const isProduction = process.env.NODE_ENV === "production";

function generateToken(user: { id: string; role: string; email: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw ApiError.internal("JWT_SECRET is missing.");
  return jwt.sign(user, secret, { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any });
}

function sendAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Register a new user
 * POST /api/v1/users/register
 */
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password }: RegisterUserInput = req.body;

  if (!name || !email || !password) {
    throw ApiError.badRequest("Name, email, and password are required.");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw ApiError.conflict("User with this email already exists.");
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  const token = generateToken({ id: user._id.toString(), role: user.role, email: user.email });
  sendAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: { user, token },
  });
});

/**
 * Log in an existing user
 * POST /api/v1/users/login
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginUserInput = req.body;

  if (!email || !password) {
    throw ApiError.badRequest("Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.password) {
    throw ApiError.unauthorized("Invalid credentials.");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid credentials.");
  }

  const token = generateToken({ id: user._id.toString(), role: user.role, email: user.email });
  sendAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: { user, token },
  });
});

/**
 * Get current user profile
 * GET /api/v1/users/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized();
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw ApiError.notFound("User not found.");
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Log out user
 * POST /api/v1/users/logout
 */
export const logoutUser = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
```

### `src/routes/user.route.ts`
```typescript
import { Router } from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
} from "../controllers/user.controller.js";
import { verifyAccessToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyAccessToken, getProfile);
router.post("/logout", logoutUser);

export default router;
```

### Wiring into `src/routes/index.ts`
```typescript
import { Router } from "express";
import healthRoutes from "./health.route.js";
import userRoutes from "./user.route.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/users", userRoutes);

export default router;
```
