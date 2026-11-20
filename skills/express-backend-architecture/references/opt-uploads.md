# Optional Module: Multer & Cloudinary File Uploads

Lazy-load this reference **ONLY** if image or file uploads are enabled. It provides in-memory multipart upload handling with Multer and streaming upload/deletion with the Cloudinary v2 SDK.

---

## 1. Dependencies & Environment Variables

### Package Installation
```bash
npm install multer cloudinary
npm install -D @types/multer
```

### Append to `.env.example`
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 2. Multer In-Memory Middleware

### `src/middlewares/upload.middleware.ts`
```typescript
import multer from "multer";
import { ApiError } from "../utils/apiError.util.js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(ApiError.badRequest(`Unsupported file format "${file.mimetype}". Allowed: JPG, PNG, WEBP.`));
    }
  },
});
```

---

## 3. Cloudinary Utility

### `src/utils/cloudinary.util.ts`
```typescript
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

/**
 * Streams an in-memory buffer to Cloudinary
 */
export const uploadImage = (
  fileBuffer: Buffer,
  folder = "uploads",
): Promise<CloudinaryUploadResult> => {
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

/**
 * Removes an image asset by public ID
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.warn(`Failed to destroy Cloudinary asset "${publicId}":`, error);
  }
};
```

---

## 4. Usage Pattern in Route & Controller

### Route Attachment
```typescript
import { Router } from "express";
import { upload } from "../middlewares/upload.middleware.js";
import { createItemWithImage } from "../controllers/item.controller.js";

const router = Router();

// Single file upload
router.post("/", upload.single("image"), createItemWithImage);

// Or multiple files upload:
// router.post("/", upload.array("images", 5), createItemWithImages);

export default router;
```

### Controller Handling
```typescript
import { type Request, type Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.util.js";
import { ApiError } from "../utils/apiError.util.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.util.js";

export const createItemWithImage = asyncHandler(async (req: Request, res: Response) => {
  let imageData: { url: string; publicId: string } | undefined = undefined;

  if (req.file) {
    imageData = await uploadImage(req.file.buffer, "items");
  }

  // Persist imageUrl / publicId to your model
  // e.g., const item = await Item.create({ ...req.body, image: imageData?.url, imagePublicId: imageData?.publicId });

  res.status(201).json({
    success: true,
    message: "Item created with image",
    data: imageData,
  });
});
```
