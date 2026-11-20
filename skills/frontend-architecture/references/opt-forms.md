# Optional Module: React Hook Form & Zod Validation

Lazy-load this reference **ONLY** if React Hook Form and Zod are selected. It defines schema declaration, inferred typing, unstyled structural form skeletons, field registration, and inline error binding.

---

## 1. Dependencies & Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## 2. Zod Schema & Inferred Type Pattern

All schemas live in `src/schemas/` (or `src/lib/validators.ts`). Always export both the schema and the inferred TypeScript type.

### `src/schemas/auth.schema.ts`
```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
```

### `src/schemas/item.schema.ts`
```typescript
import { z } from "zod";

export const itemSchema = z.object({
  title: z.string().min(2, "Title is required (min 2 characters)").max(120),
  description: z.string().max(1000).optional(),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
});

export type ItemFormData = z.infer<typeof itemSchema>;
```

---

## 3. Unstyled Functional Form Skeleton (Zero Visual Polish)

> [!IMPORTANT]
> **Zero Visual Polish Rule:** The form skeleton must remain purely structural and functional. Wire the complete validation, submission handler, field bindings, and error indicators, but leave all colors, borders, cards, and theme styling to the developer.

### `src/components/forms/ItemForm.tsx`
```tsx
import { type FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemSchema, type ItemFormData } from "@/schemas/item.schema";

interface ItemFormProps {
  initialValues?: Partial<ItemFormData>;
  onSubmit: (data: ItemFormData) => Promise<void>;
}

export const ItemForm: FC<ItemFormProps> = ({ initialValues, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: initialValues?.title || "",
      description: initialValues?.description || "",
      status: initialValues?.status || "pending",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          type="text"
          {...register("title")}
          className="w-full border px-3 py-2 rounded text-sm"
          placeholder="Enter item title"
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          rows={3}
          className="w-full border px-3 py-2 rounded text-sm"
          placeholder="Enter item description"
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Status Select Field */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium mb-1">
          Status
        </label>
        <select
          id="status"
          {...register("status")}
          className="w-full border px-3 py-2 rounded text-sm"
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
        {errors.status && (
          <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 border rounded font-medium text-sm bg-gray-100 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Save Item"}
      </button>
    </form>
  );
};

export default ItemForm;
```
