# Next.js App Router Framework Setup

Lazy-load this reference **ONLY** for Next.js App Router projects. It defines layout structure, `'use client'` boundary discipline, SSR-safe Zustand hydration, and client/server environment variable access.

---

## 1. App Router Directory Structure

```text
src/ (or root)
├── app/
│   ├── layout.tsx             # Root layout with HTML/body, fonts, and global metadata
│   ├── page.tsx               # Root home page (Server component by default)
│   ├── globals.css            # Tailwind v4 entrypoint
│   └── <route>/
│       ├── page.tsx           # Route page (marked 'use client' if stateful)
│       └── layout.tsx         # Optional route-specific nested layout
├── components/                # Structural UI components
├── stores/                    # Zustand stores with hydration safety
├── lib/                       # API clients and utilities
└── schemas/                   # Zod validation schemas
```

---

## 2. Root Layout & Metadata

### `src/app/layout.tsx`
```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Name",
  description: "Next.js application boilerplate",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <header className="border-b px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-lg">App Name</div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/">Home</a>
            <a href="/profile">Profile</a>
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 max-w-6xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t px-4 py-3 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} App Name.
        </footer>
      </body>
    </html>
  );
}
```

---

## 3. Server vs. Client Boundary Rules

1. **Server Components by Default:** Page stubs that simply display static content, pass props, or fetch data via server-side logic must remain Server Components (do NOT add `'use client'`).
2. **Marking Client Boundaries:** Add `'use client'` strictly at the top of files that:
   - Use React state or effects (`useState`, `useEffect`, `useCallback`).
   - Read or write to Zustand stores (`useAuthStore()`).
   - Bind forms with React Hook Form (`useForm()`).
   - Listen to browser DOM events (`onClick`, `onChange`, `onSubmit`).

---

## 4. SSR-Safe Zustand Hydration Pattern

When using Zustand stores with `persist` middleware in Next.js, reading persisted state directly during server rendering causes hydration mismatch errors (`Text content does not match server-rendered HTML`).

Use this clean custom hook to ensure safe client hydration:

### `src/hooks/useHydratedStore.ts`
```typescript
"use client";

import { useEffect, useState } from "react";

export function useHydratedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
): F | undefined {
  const result = store(callback) as F;
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated ? result : undefined;
}
```

### Usage in a Client Component:
```tsx
"use client";

import { useAuthStore } from "@/stores/auth.store";
import { useHydratedStore } from "@/hooks/useHydratedStore";

export default function UserGreeting() {
  const user = useHydratedStore(useAuthStore, (state) => state.user);

  if (!user) {
    return <div>Welcome, Guest!</div>;
  }

  return <div>Welcome back, {user.name}!</div>;
}
```

---

## 5. Environment Variables

Client-accessible variables in Next.js must be prefixed with `NEXT_PUBLIC_`.

### `.env.example`
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

Access in client and server code via:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
```
