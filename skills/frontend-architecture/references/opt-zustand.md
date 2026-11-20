# Optional Module: Zustand State Management

Lazy-load this reference **ONLY** if Zustand is selected. It defines our store creation pattern (`create<State>()(...)`), loading/error discipline, async action workflows, and persistence configurations.

---

## 1. Dependencies & Installation

```bash
npm install zustand
```

---

## 2. Store Naming & Directory Convention

- All stores reside in `src/stores/`.
- File naming pattern: `<resource>.store.ts` (e.g., `auth.store.ts`, `item.store.ts`).
- Hook naming pattern: `use<Resource>Store` (e.g., `useAuthStore`, `useItemStore`).

---

## 3. Base Store Pattern: Auth & Session

Demonstrates user session management, `persist` middleware with selective serialization (`partialize`), and API communication.

### `src/stores/auth.store.ts`
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api, { getApiErrorMessage } from "@/lib/axios";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  clearAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/users/login", { email, password });
          set({ user: data.data.user });
        } catch (err) {
          const message = getApiErrorMessage(err, "Login failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/users/register", { name, email, password });
          set({ user: data.data.user });
        } catch (err) {
          const message = getApiErrorMessage(err, "Registration failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post("/users/logout");
        } catch {
          // Proceed with local logout regardless of network error
        } finally {
          set({ user: null, error: null });
        }
      },

      getMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get("/users/profile");
          set({ user: data.data });
        } catch {
          set({ user: null });
        } finally {
          set({ isLoading: false });
        }
      },

      clearAuth: () => set({ user: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "app-auth-storage",
      partialize: (state) => ({ user: state.user }), // Persist only user data
    },
  ),
);
```

---

## 4. Resource Store Pattern: Domain Entity List & CRUD

Demonstrates managing collections of entities with async queries and optimistic updates.

### `src/stores/item.store.ts`
```typescript
import { create } from "zustand";
import api, { getApiErrorMessage } from "@/lib/axios";

export interface Item {
  _id: string;
  title: string;
  description?: string;
  status: string;
}

interface ItemState {
  items: Item[];
  activeItem: Item | null;
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  fetchItemById: (id: string) => Promise<void>;
  createItem: (payload: { title: string; description?: string }) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useItemStore = create<ItemState>()((set) => ({
  items: [],
  activeItem: null,
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get("/items");
      set({ items: data.data });
    } catch (err) {
      set({ error: getApiErrorMessage(err, "Failed to load items") });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchItemById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get(`/items/${id}`);
      set({ activeItem: data.data });
    } catch (err) {
      set({ error: getApiErrorMessage(err, "Failed to load item") });
    } finally {
      set({ isLoading: false });
    }
  },

  createItem: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post("/items", payload);
      set((state) => ({ items: [data.data, ...state.items] }));
    } catch (err) {
      set({ error: getApiErrorMessage(err, "Failed to create item") });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteItem: async (id: string) => {
    try {
      await api.delete(`/items/${id}`);
      set((state) => ({ items: state.items.filter((item) => item._id !== id) }));
    } catch (err) {
      set({ error: getApiErrorMessage(err, "Failed to delete item") });
    }
  },

  clearError: () => set({ error: null }),
}));
```

---

## 5. Component Usage & Selector Best Practices

Always use atomic selectors to avoid unnecessary re-renders:

```tsx
// Good: re-renders ONLY when `user` changes
const user = useAuthStore((state) => state.user);
const login = useAuthStore((state) => state.login);

// Avoid: re-renders on any store change
// const { user, login } = useAuthStore();
```
