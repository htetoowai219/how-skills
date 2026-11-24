# Develop: UI Track Guide (Screens, Components & Styling)

Read this guide when implementing web, mobile, or desktop UI components, pages, layouts, and styling.

## 1. Product Surface Bar (Calibrated to Project Mode)

Even on a small project, UI should feel intentional, cohesive, and usable—never a broken, unstyled stub stranded on a blank screen:

- **Casual / Hobby:** Clean, cohesive layout using the chosen styling setup (Tailwind, CSS custom properties, or component kit), real product copy (never lorem ipsum), responsive container widths, and basic loading/error feedback where async actions happen.
- **Prototype / MVP:** Complete screen composition (header/navigation context, clear visual hierarchy, real copy), consistent color/spacing tokens, responsive mobile + desktop layout, and distinct **loading**, **empty**, and **error** states.
- **Production / Commercial:** Full product-grade craft—strict design token discipline (light/dark parity if supported), semantic HTML/platform primitives, keyboard operability + visible focus rings, accessible labels (`aria-*` where native semantics need help), WCAG AA contrast (≥ 4.5:1 body text, ≥ 3:1 UI controls/large text), and responsive behavior down to mobile widths without horizontal overflow.

---

## 2. Design Source & Token Discipline

Follow the visual source recorded in `docs/scope/plans/<NN-slug>.md` (or existing repo conventions):

1. **Existing UI / `design.md` / Theme File:** Read existing theme/CSS variables and 2–3 existing components first. Reuse established colors, spacing, typography, border radius, and button/card primitives—never invent clashing one-off hex colors.
2. **Reference Screenshot / Figma:** Match layout hierarchy, spacing rhythm, and palette faithfully; extract reusable variables into the project's theme/CSS file rather than scattering magic values.
3. **Greenfield UI (No Existing Theme):** Define a small, cohesive set of theme tokens in the project's root stylesheet or Tailwind/theme config (canvas, surface, border, muted text, body ink, one primary accent + readable on-accent text, semantic success/error) with verified contrast before building screens.

**Asset safety:** Never invent broken local image paths (`/images/fake.png`). Check `public/` or `assets/` first; if assets do not exist yet, use clean CSS/SVG visuals or centralized swappable placeholders and note them in `Heads up`.

---

## 3. UI Build Checklist (Enforce While Coding)

- **Router & Navigation Wiring:** Every new screen/page must be registered in the router and reachable from the app's navigation or intended trigger—never leave an unreachable component file.
- **Data Binding (`Tracer Bullet` vs. `Facade`):**
  - End-to-end phases bind directly to the real API/store/actions built in this phase (matching exact payload keys and response shapes).
  - `Facade` phases bind to a single clearly marked typed mock module (e.g., `src/mocks/<feature>.mock.ts`) so wiring the backend in the next phase is a clean swap.
- **Semantic Primitives:** Use `<button>` for actions, `<a>`/router `<Link>` for navigation, proper heading hierarchy (`h1` → `h2`), and `<label>` associated with every form input (placeholder text alone is never a label).
- **Interactive States:** Ensure interactive controls have clear hover, focus-visible, disabled, and submitting/loading states so double-clicks and silent failures don't happen.
- **Self-Audit Before Reporting:** Scan your markup and styles for accidental raw unstyled elements, missing empty/error states, broken imports, or dead event handlers (`onClick={() => {}}`).
