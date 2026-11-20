# Optional Module: Tailwind CSS v4 + DaisyUI v5 Configuration

Lazy-load this reference **ONLY** if Tailwind CSS with DaisyUI v5 is selected.

> [!CAUTION]
> **Strict Role Boundary — Config Only (No UI Design):** This module handles the CSS and package installation for DaisyUI v5 only. Never generate themed marketing pages, hero banners, decorative cards, or custom color palettes. All visual styling remains the responsibility of the developer.

---

## 1. Dependencies & Package Installation

```bash
# In Vite:
npm install -D @tailwindcss/vite daisyui@^5

# In Next.js:
npm install -D @tailwindcss/postcss daisyui@^5
```

---

## 2. CSS-First Plugin Setup (Tailwind v4)

In Tailwind CSS v4, plugins are registered directly inside the main CSS entry file using the modern `@plugin` directive. No legacy `tailwind.config.js` is needed.

### `src/index.css` (Vite) or `src/app/globals.css` (Next.js)
```css
@import "tailwindcss";

@plugin "daisyui" {
  themes: false; /* Disable default DaisyUI color theme overrides to maintain clean neutral baseline */
}
```

---

## 3. Vite Build Plugin Configuration

If configuring a fresh Vite project, ensure `@tailwindcss/vite` is included in `vite.config.ts`:

### `vite.config.ts`
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

---

## 4. One-Line Sanity Verification Check

To confirm DaisyUI styles are active without creating unwanted visual design, render this minimal test button:

```tsx
<button className="btn">Button</button>
```
If the button inherits DaisyUI's base utility classes upon starting the dev server, the configuration is complete.
