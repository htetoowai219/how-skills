---
name: frontend-architecture
description: Configures boilerplate architecture, routing, API client, Zustand stores, React Hook Form + Zod, and styling setup in freshly scaffolded React (Vite) or Next.js projects, and wires unstyled structural page and form stubs. Trigger when setting up frontend project conventions, adding state/API/form boilerplate, or wiring functional page shells. Do NOT use for visual UI/UX design, custom theme styling, decorative components, backend Express/NestJS code, React Native, or generating base Vite/Next projects from scratch.
license: MIT
compatibility: Designed for Agent Skills-compatible tools (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
metadata:
  source: custom
  author: "how"
  version: "1.0.0"
allowed-tools:
  - read_file
  - run_command
  - edit_file
  - write_file
---

# Frontend Architecture (Boilerplate & Wiring Only)

Enforces our production architecture, routing structure, state management, form validation, and tooling configuration across React (Vite) and Next.js projects.

> [!CAUTION]
> **Strict Role Boundary — Wiring Only (Zero Visual Design):**
> 1. The developer scaffolds the base template manually (`npm create vite@latest` or `npx create-next-app@latest`).
> 2. This skill configures architectural boilerplate and wires functional, unstyled structural stubs.
> 3. Never design custom color palettes, marketing heroes, decorative cards, animations, or polished UI themes. Leave all visual styling and design completely to the developer.

---

## 1. Pre-Flight Detection (Run First — Read-Only)

Before reading reference files or writing code, silently inspect `package.json` and directory structure:
- **Framework Check:** Verify whether `vite` or `next` is present. If neither exists, instruct the user to scaffold the base template first and stop:
  > *"Please initialize a base template first (`npm create vite@latest` or `npx create-next-app@latest`) then run `/frontend-architecture`."*
- **Execution Mode:**
  - **Mode A — Fresh Template (First Setup):** Project lacks conventions (`react-router-dom`, Axios, Zustand, or forms not yet wired). Run **Phase 1 (Grill Gate) -> Phase 2 (Selective Setup) -> Phase 3 (Wire Skeleton & Verify)**.
  - **Mode B — Existing Project (Extend):** Conventions already exist in `package.json` and `src/`/`app/`. Skip the grill gate, detect installed packages, lazy-load ONLY the required reference file(s) (e.g. [Forms](references/opt-forms.md) when generating a form), and wire requested stubs cleanly.

---

## 2. Phase 1: Anti-Bloat Grill Gate (Mode A Only)

Output a 2-line detection summary, then ask this single numbered checklist (omitting anything already present in `package.json` or specified in the prompt):

```text
Detected: [Vite / Next.js] | Package Manager: [npm / pnpm / bun] | Installed: [e.g. react, tailwindcss]

Frontend Architecture Configuration:
1. State Management: Zustand [default] / React state only / Redux
2. API Client: Axios (Cookie withCredentials) [default] / Axios (Bearer token) / Native fetch / None
3. Forms & Validation: React Hook Form + Zod [default] / Basic controlled inputs / None
4. Styling Config (setup only, zero UI design): Tailwind + DaisyUI [default] / Tailwind + shadcn/ui / Plain Tailwind / Keep existing
5. Layout Shell: Mobile-first bare layout shell [default] / Desktop-only bare layout shell / None (blank stubs)
6. Routing & Auth Guards (Vite only): react-router-dom [default] — include protected route wrapper? (No [default] / Yes)
```

**Fast-Path Prompt:**  
> *"Reply in one line (e.g. `Zustand, Axios cookies, RHF+Zod, DaisyUI, mobile shell, protected route`) or say `defaults`."*

- **Wait for the user's response** before loading `references/opt-*.md` files or installing packages.
- Skip the grill **only** if the user already specified choices or said *"skip questions / use defaults"*.

---

## 3. Phase 2: Strict Boilerplate-Only & Lazy-Load Rules

1. **Hard Lazy-Load Rule:**
   - Load [Vite Setup](references/fw-vite.md) OR [Next.js Setup](references/fw-next.md) (never both).
   - Load `references/opt-*.md` files **strictly** for approved tools. Never read unselected reference files.
2. **Zero Visual Design Rule (Hard Boundary):**
   - Do **NOT** generate colored badges, themed cards, hero banners, gradients, decorative icons, or marketing copy.
   - Keep page and layout stubs strictly structural: semantic HTML (`<header>`, `<nav>`, `<main>`, `<form>`, `<input>`, `<button>`) with at most bare flex/grid container layout to make elements legible.
   - For forms, wire complete Zod validation, inferred types, `useForm` + `zodResolver`, `<form onSubmit={handleSubmit(onSubmit)}>`, field bindings, and raw inline errors (`{errors.field?.message}`).
3. **Zero Unwanted Extras Rule:**
   - Install **only** packages required for approved modules. Never add icon packs, animation libraries (Framer Motion), toast libraries, TanStack Query, or unrequested component primitives unless explicitly asked.
   - Never generate dummy stores, unused API clients, or unrequested pages.

---

## 4. Phase 3: Wire Requested Skeleton & Verify

1. **Install Approved Dependencies:** Run package installation for approved modules only.
2. **Configure Tooling Baseline:**
   - Setup path alias `@/` mapping to `./src/*` in `tsconfig.json` and build config.
   - Setup Axios instance in `src/lib/axios.ts` if selected.
   - Setup DaisyUI plugin or shadcn `cn()` helper if selected.
3. **Wire Requested Structural Skeleton:**
   - Scaffold ONLY the routes, pages, store stubs, and form skeletons requested in the user's prompt.
   - If user asked for auth/profile, wire `src/stores/auth.store.ts` and `src/components/auth/ProtectedRoute.tsx`.
4. **Compile Verification:** Run typecheck (`tsc --noEmit` or `npm run build`) to ensure zero errors.
5. **Print Handoff Summary:** Output a concise table of installed packages, configured boilerplate files, and created functional stubs ready for the developer to style and build out.

---

## 5. Canonical Directory Structure

```text
src/ (or app/)
├── main.tsx (or app/layout.tsx)    # Framework root mount
├── App.tsx (Vite)                  # BrowserRouter & route definitions
├── index.css (or app/globals.css)  # Tailwind v4 entry (@import "tailwindcss";)
├── pages/ (or app/<route>/)        # Routed page stubs: <Name>Page.tsx
├── components/
│   ├── layout/                     # Layout.tsx (with <Outlet /> or children)
│   ├── auth/                       # ProtectedRoute.tsx (if auth enabled)
│   └── forms/                      # Unstyled functional form components
├── stores/                         # Zustand stores: <resource>.store.ts
├── schemas/                        # Zod schemas: <resource>.schema.ts
├── lib/
│   ├── axios.ts                    # Shared Axios instance (if Axios enabled)
│   └── utils.ts                    # cn() helper (if shadcn enabled)
└── types/                          # Shared domain interfaces: <resource>.type.ts
```

---

## 6. Lazy-Load Reference Routing Table

> [!IMPORTANT]
> **Token Optimization:** Load reference files **only** when the corresponding condition is met. Never read unselected optional references.

| Condition / Tool | Reference File | What It Contains |
| :--- | :--- | :--- |
| **Vite Project Detected** | [Vite Setup](references/fw-vite.md) | `react-router-dom` v7 setup, layout `<Outlet />`, `ProtectedRoute`, `VITE_*` env, and `@/` alias. |
| **Next.js Project Detected** | [Next.js Setup](references/fw-next.md) | App Router layout wiring, `'use client'` boundaries, SSR-safe Zustand hydration, and `NEXT_PUBLIC_*` env. |
| **Axios Selected** | [Axios Client](references/opt-axios.md) | Shared Axios instance (`withCredentials`), 401 interceptor, `getApiErrorMessage` utility, and typed API service stub. |
| **Zustand Selected** | [Zustand Stores](references/opt-zustand.md) | `create<State>()(persist(...))` boilerplate, async actions, loading/error fields, and store templates. |
| **RHF + Zod Selected** | [Forms & Validation](references/opt-forms.md) | Zod schema + `z.infer`, `useForm` + `zodResolver`, unstyled structural form skeleton, and inline error bindings. |
| **DaisyUI Selected** | [DaisyUI Config](references/opt-daisyui.md) | Tailwind v4 CSS-first `@plugin "daisyui"` config and 1-line sanity check (zero UI design). |
| **shadcn/ui Selected** | [shadcn/ui Config](references/opt-shadcn.md) | `components.json`, `@/` alias, `cn()` utility, and CSS variables setup (zero component primitives). |
