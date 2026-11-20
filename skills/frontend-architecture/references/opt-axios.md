# Optional Module: Axios HTTP Client & API Service Layer

Lazy-load this reference **ONLY** if Axios is selected. It defines a shared Axios instance with credentials transport, 401 response handling, a standardized error message parser, and a typed API service pattern.

---

## 1. Dependencies & Environment Variables

### Package Installation
```bash
npm install axios
```

### Append to `.env.example`
```bash
# In Vite:
VITE_API_URL=http://localhost:5000/api/v1

# In Next.js:
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

## 2. Shared Axios Instance

### `src/lib/axios.ts`
```typescript
import axios, { isAxiosError } from "axios";

// Detect API base URL across Vite and Next.js environments
const getBaseUrl = (): string => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "http://localhost:5000/api/v1";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Sends HTTP-only auth cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Extracts a human-readable error message from an unknown error or Axios error.
 */
export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string; details?: unknown } | undefined;
    return data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

// Global 401 response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear client session on expired or unauthorized session
      // e.g. useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

## 3. Optional Bearer Token Request Interceptor

If your backend requires `Authorization: Bearer <token>` in addition to (or instead of) cookies:

```typescript
// Add to src/lib/axios.ts
api.interceptors.request.use(
  (config) => {
    // Read token from memory or store
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
```

---

## 4. Typed API Service Module Pattern

Place domain API endpoints in `src/lib/` or `src/api/` named `<resource>.api.ts`. Handlers return typed response data and avoid inline component `try/catch` boilerplate.

### `src/lib/items.api.ts`
```typescript
import api from "./axios";

export interface Item {
  _id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
}

export interface CreateItemPayload {
  title: string;
  description?: string;
  status?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const itemsApi = {
  async getAll(): Promise<Item[]> {
    const { data } = await api.get<ApiResponse<Item[]>>("/items");
    return data.data;
  },

  async getById(id: string): Promise<Item> {
    const { data } = await api.get<ApiResponse<Item>>(`/items/${id}`);
    return data.data;
  },

  async create(payload: CreateItemPayload): Promise<Item> {
    const { data } = await api.post<ApiResponse<Item>>("/items", payload);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/items/${id}`);
  },
};
```
