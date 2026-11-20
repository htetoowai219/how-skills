# Vertical Feature Slice Reference

This reference illustrates a complete, anonymized vertical feature slice following our layered architecture: **Type -> Model -> Controller -> Route**.

---

## 1. Type Definition

### `src/types/item.type.ts`
```typescript
import { type Types, type Document } from "mongoose";

export interface IItemImage {
  url: string;
  publicId?: string;
}

export interface IItem extends Document<Types.ObjectId> {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
  images: IItemImage[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemInput {
  name: string;
  description: string;
  price: number | string;
  category: string;
  stock?: number | string;
}

export interface UpdateItemInput {
  name?: string;
  description?: string;
  price?: number | string;
  category?: string;
  stock?: number | string;
  isActive?: boolean;
}

export interface ItemFilterQuery {
  category?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
  limit?: string;
}
```

---

## 2. Mongoose Model

### `src/models/item.model.ts`
```typescript
import { Schema, model } from "mongoose";
import { type IItem } from "../types/item.type.js";

const itemSchema = new Schema<IItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String },
        },
      ],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound and text indexes for search optimization
itemSchema.index({ name: "text", description: "text" });
itemSchema.index({ category: 1, createdAt: -1 });

export const Item = model<IItem>("Item", itemSchema);
```

---

## 3. Controller Implementation

### `src/controllers/item.controller.ts`
```typescript
import { type Request, type Response } from "express";
import { Item } from "../models/item.model.js";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/apiError.util.js";
import { type ItemFilterQuery } from "../types/item.type.js";

// GET /api/v1/items
export const getItems = asyncHandler(
  async (req: Request<unknown, unknown, unknown, ItemFilterQuery>, res: Response) => {
    const { category, q, minPrice, maxPrice, page = "1", limit = "20" } = req.query;

    const filter: Record<string, unknown> = { isActive: true };

    if (category) {
      filter.category = category.toLowerCase().trim();
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = Number(maxPrice);
    }

    if (q && q.trim()) {
      // ReDoS-safe sanitized search
      const sanitized = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: sanitized, $options: "i" } },
        { description: { $regex: sanitized, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Item.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: items.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      items,
    });
  },
);

// GET /api/v1/items/:id
export const getItemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await Item.findById(id).lean();
  if (!item) {
    throw ApiError.notFound("Item not found");
  }

  res.status(200).json({
    success: true,
    item,
  });
});

// POST /api/v1/items
export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, price, category, stock } = req.body;

  if (!name || !description || price === undefined || !category) {
    throw ApiError.badRequest("Name, description, price, and category are required");
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice < 0) {
    throw ApiError.badRequest("Price must be a valid non-negative number");
  }

  const item = await Item.create({
    name: name.trim(),
    description: description.trim(),
    price: numericPrice,
    category: category.toLowerCase().trim(),
    stock: stock !== undefined ? Math.max(0, Number(stock)) : 0,
    createdBy: req.user?.id,
  });

  res.status(201).json({
    success: true,
    message: "Item created successfully",
    item,
  });
});

// PATCH /api/v1/items/:id
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const item = await Item.findById(id);
  if (!item) {
    throw ApiError.notFound("Item not found");
  }

  if (updates.name) item.name = updates.name.trim();
  if (updates.description) item.description = updates.description.trim();
  if (updates.price !== undefined) item.price = Number(updates.price);
  if (updates.category) item.category = updates.category.toLowerCase().trim();
  if (updates.stock !== undefined) item.stock = Number(updates.stock);
  if (updates.isActive !== undefined) item.isActive = Boolean(updates.isActive);

  await item.save();

  res.status(200).json({
    success: true,
    message: "Item updated successfully",
    item,
  });
});

// DELETE /api/v1/items/:id
export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await Item.findByIdAndDelete(id);
  if (!item) {
    throw ApiError.notFound("Item not found");
  }

  res.status(200).json({
    success: true,
    message: "Item deleted successfully",
  });
});
```

---

## 4. Route Definition

### `src/routes/item.route.ts`
```typescript
import { Router } from "express";
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/item.controller.js";
import {
  verifyAccessToken,
  requireRole,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", getItems);
router.get("/:id", getItemById);

// Protected routes (Admin only)
router.post("/", verifyAccessToken, requireRole("admin"), createItem);
router.patch("/:id", verifyAccessToken, requireRole("admin"), updateItem);
router.delete("/:id", verifyAccessToken, requireRole("admin"), deleteItem);

export default router;
```

---

## 5. Master Route Aggregator

### `src/routes/index.ts`
```typescript
import { Router } from "express";
import itemRoutes from "./item.route.js";
// Import other domain routes here

const router = Router();

router.use("/items", itemRoutes);

export default router;
```
