# Vite + React Framework Setup

Lazy-load this reference **ONLY** for Vite-based React projects. It defines `react-router-dom` v7 routing, path aliases, environment variable configuration, a bare layout shell, and an authentication guard wrapper.

---

## 1. Dependencies & Package Installation

```bash
# Core routing
npm install react-router-dom

# If path resolution is needed in vite.config.ts
npm install -D @types/node
```

---

## 2. Path Alias Configuration (`@/` -> `./src/*`)

### `tsconfig.json` (or `tsconfig.app.json`)
Ensure the compiler options map `@/*` to the source directory:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `vite.config.ts`
Map the path alias in Vite using `path.resolve`:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
```

---

## 3. Environment Variables & Typing

Vite exposes environment variables on `import.meta.env` with the `VITE_` prefix.

### `.env.example`
```bash
VITE_API_URL=http://localhost:5000/api/v1
```

### `src/vite-env.d.ts`
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 4. App Routing Skeleton

### `src/App.tsx`
```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Page Stubs
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import ProfilePage from "@/pages/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages with Standard Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated / Guarded Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 5. Structural Layout Shell (Zero Visual Polish)

Keep layouts purely structural—semantic elements and minimal flex layout to keep footer pinned. Zero color themes, decorative cards, or marketing styling.

### `src/components/layout/Layout.tsx`
```tsx
import { type FC } from "react";
import { Outlet, Link } from "react-router-dom";

const Layout: FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-lg">
          <Link to="/">App Name</Link>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/">Home</Link>
          <Link to="/profile">Profile</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>

      <main className="flex-1 px-4 py-6 max-w-6xl w-full mx-auto">
        <Outlet />
      </main>

      <footer className="border-t px-4 py-3 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} App Name. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
```

---

## 6. Authentication Route Guard

Use when authentication is enabled to guard protected routes against unauthenticated access.

### `src/components/auth/ProtectedRoute.tsx`
```tsx
import { type FC } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";

const ProtectedRoute: FC = () => {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
```
