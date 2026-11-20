# CRUD Vertical Slice Pattern

This reference demonstrates the exact vertical slice structure for generating domain resources (`item`, `task`, `category`, etc.). Every resource bundle consists of 4 tightly coupled files: **Type -> Model -> Controller -> Route**, wired into `src/routes/index.ts`.

---

## 1. File Placement & Naming

For a resource named `<resource>` (singular, lowercase, e.g. `item` or `task`):
- `src/types/<resource>.type.ts`
- `src/models/<resource>.model.ts`
- `src/controllers/<resource>.controller.ts`
- `src/routes/<resource>.route.ts`

---

## 2. Type Definition

### `src/types/<resource>.type.ts`
```typescript
import { type Types, type Document } from "mongoose";

export interface I<Resource> extends Document<Types.ObjectId> {
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create<Resource>Input {
  title: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
}

export interface Update<Resource>Input {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
}

export interface <Resource>FilterQuery {
  status?: string;
  priority?: string;
  q?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

---

## 3. Mongoose Model

### `src/models/<resource>.model.ts`
```typescript
import { Schema, model } from "mongoose";
import { type I<Resource> } from "../types/<resource>.type.js";

const <resource>Schema = new Schema<I<Resource>>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [2, "Title must be at least 2 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for status filtering sorted by recency
<resource>Schema.index({ status: 1, createdAt: -1 });

export const <Resource> = model<I<Resource>>("<Resource>", <resource>Schema);
```

---

## 4. Controller Handlers

### `src/controllers/<resource>.controller.ts`
```typescript
import { type Request, type Response } from "express";
import { <Resource> } from "../models/<resource>.model.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/apiError.util.js";
import {
  type Create<Resource>Input,
  type Update<Resource>Input,
  type <Resource>FilterQuery,
} from "../types/<resource>.type.js";

/**
 * Create a new <resource>
 * POST /api/v1/<plural>
 */
export const create<Resource> = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, status, priority }: Create<Resource>Input = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    throw ApiError.badRequest("Title is required and must be non-empty.");
  }

  const newDoc = await <Resource>.create({
    title: title.trim(),
    description: description?.trim() || "",
    status: status || "pending",
    priority: priority || "medium",
    createdBy: req.user?.id || undefined,
  });

  res.status(201).json({
    success: true,
    message: "<Resource> created successfully",
    data: newDoc,
  });
});

/**
 * Get all <plural> with pagination and filtering
 * GET /api/v1/<plural>
 */
export const getAll<Plural> = asyncHandler(async (req: Request, res: Response) => {
  const {
    status,
    priority,
    q,
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
  }: <Resource>FilterQuery = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, any> = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (q) {
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: escapedQuery, $options: "i" };
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    <Resource>.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    <Resource>.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

/**
 * Get single <resource> by ID
 * GET /api/v1/<plural>/:id
 */
export const get<Resource>ById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const doc = await <Resource>.findById(id).lean();
  if (!doc) {
    throw ApiError.notFound("<Resource> not found");
  }

  res.status(200).json({
    success: true,
    data: doc,
  });
});

/**
 * Update <resource> by ID
 * PATCH /api/v1/<plural>/:id
 */
export const update<Resource> = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Update<Resource>Input = req.body;

  const updatedDoc = await <Resource>.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true },
  ).lean();

  if (!updatedDoc) {
    throw ApiError.notFound("<Resource> not found");
  }

  res.status(200).json({
    success: true,
    message: "<Resource> updated successfully",
    data: updatedDoc,
  });
});

/**
 * Delete <resource> by ID
 * DELETE /api/v1/<plural>/:id
 */
export const delete<Resource> = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedDoc = await <Resource>.findByIdAndDelete(id);
  if (!deletedDoc) {
    throw ApiError.notFound("<Resource> not found");
  }

  res.status(200).json({
    success: true,
    message: "<Resource> deleted successfully",
  });
});
```

---

## 5. Route Definition & Router Mount

### `src/routes/<resource>.route.ts`
```typescript
import { Router } from "express";
import {
  create<Resource>,
  getAll<Plural>,
  get<Resource>ById,
  update<Resource>,
  delete<Resource>,
} from "../controllers/<resource>.controller.js";

// Optional: Import auth guards if auth is enabled
// import { verifyAccessToken, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", create<Resource>);
router.get("/", getAll<Plural>);
router.get("/:id", get<Resource>ById);
router.patch("/:id", update<Resource>);
router.delete("/:id", delete<Resource>);

export default router;
```

### Wiring into `src/routes/index.ts`
```typescript
import { Router } from "express";
import healthRoutes from "./health.route.js";
import <resource>Routes from "./<resource>.route.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/<plural>", <resource>Routes);

export default router;
```
