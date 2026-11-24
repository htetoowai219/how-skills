# Build Approaches & Living Scope Modes

## 1. Project Mode Calibration (Anti-Bloat Rules)

Always size phase granularity to the chosen **Project Mode**:

| Project Mode | Phase Cap | How to Group Work |
|---|---|---|
| **Casual / Hobby** | **1–3 phases** | Fold project setup, styling, and the first working feature into **Phase 01**. A static site, small CLI, or weekend tool is often **1 or 2 phases total**. Zero separate foundation/tooling phases. |
| **Prototype / MVP** | **2–4 phases** | **Phase 01** stands up the runnable core loop (scaffold + core data + primary screen/endpoint). **Phases 02–04** add the remaining must-have slices and light polish. |
| **Production / Commercial** | **4–7 phases** | **Phase 01** may establish shared foundation (scaffold, core schema, auth/tenancy) when multiple slices depend on it, followed by **Phases 02–06** vertical feature slices and a final hardening/deployment readiness phase if needed. Still merge trivial tasks—never exceed 7 phases for one roadmap pass. |

---

## 2. Build Approach Personas (How Phases Are Sliced)

The chosen **Build Approach** changes *what* goes into each phase, not just phase titles:

### Tracer Bullet *(Integration-Proving Vertical Slices)*
- **Instinct:** Prove the whole pipe connects end to end (DB → logic → API → UI) before building breadth.
- **Phase 01:** Thin, real working thread through the primary user action (real persistence, real wiring, narrow scope).
- **Later Phases:** Thicken one capability strand at a time, end to end.
- **Best for:** Full-stack `Prototype / MVP` and `Production / Commercial` apps where integration risk matters.

### Skateboard *(Smallest Usable Whole First)*
- **Instinct:** Put a tiny, genuinely usable product in real hands in Phase 01, cutting structural extras (teams, roles, custom templates) until needed.
- **Phase 01:** Complete, usable single-loop tool you could actually use today.
- **Later Phases:** Grow the product release by release (skateboard → bike → car), each phase shippable on its own.
- **Best for:** `Casual / Hobby` tools and product-validation `Prototype / MVP` builds.

### Facade *(UI-First Clickable Shell, Wired Later)*
- **Instinct:** Make the interface look, navigate, and feel real on mock/placeholder data first to validate UX before investing in backend persistence.
- **Phase 01:** Key screens, navigation, and states running cleanly on typed placeholder data (explicitly noted as mock data).
- **Later Phases:** Wire real persistence, auth, and API logic behind the validated screens.
- **Best for:** UI-heavy prototypes, landing + dashboard demos, and design-first workflows.

### Journey *(One Complete Experience Deep at a Time)*
- **Instinct:** Finish one entire user path completely—including empty, loading, error, and edge states—before opening the next user path.
- **Phase 01:** Primary user journey polished start to finish (plus minimal foundation).
- **Later Phases:** One complete secondary journey per phase.
- **Best for:** Funnel-driven apps, onboarding/checkout flows, and `Production / Commercial` UX products.

---

## 3. Replan / Reconcile Mode (Bare `/scope` When `SCOPE.md` Exists)

Running `/scope` with no arguments is the normal check-in rhythm between phases:

1. **Read state:** Read `docs/scope/SCOPE.md`, list `docs/scope/plans/*.md`, check `git status --short` and current branch (`git branch --show-current`).
2. **Print "Where Things Stand" readout first:**
   - Current git branch and clean/dirty status.
   - Phase counts by status (`Verified`, `Developed`, `Architected`, `In Progress`, `Planned`).
   - Exact resume point for any active phase (e.g., *"Phase 02 is `Developed` — ready for `/check verify <Phase 02>`"*).
3. **Spot drift honestly:**
   - Flag any plan file in `docs/scope/plans/` or shipped code area not reflected in `SCOPE.md`.
   - Check `## Implementation Notes` or follow-ups in completed plan docs for newly surfaced tasks.
4. **Confirm updates before editing `SCOPE.md`:**
   - If reconciliation updates statuses, enrolls a follow-up phase, or marks an unneeded phase `Dropped`, show the proposed diff summary in chat, confirm with `you`, apply surgical edits to `SCOPE.md`, and point to the next command (`/architect`, `/develop`, or `/check verify`).

---

## 4. Add Mode (`/scope <Feature Name>` When `SCOPE.md` Exists)

When `SCOPE.md` exists and `you` pass a single feature/phase name:

1. Read `docs/scope/SCOPE.md` and check for overlap with existing phases (`Planned` through `Verified`, or `Non-Goals & Deferred`). If it belongs inside an existing `Planned` phase, recommend folding it into that phase rather than bloating phase count.
2. Check the **Project Mode** phase cap: if adding a new phase would push a `Casual / Hobby` project past 3 phases (or `Prototype / MVP` past 4), mention it plainly and offer either merging into an existing phase or appending as a new phase anyway (`your` call).
3. Confirm the 1–2 line intent, `Done when:`, and phase number in chat, then append the row to `At a Glance` and the section under `## Phases` with `- [ ] Architect plan: /architect <Phase Name>`.
