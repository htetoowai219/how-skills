---
name: scope
description: Turns an idea brief (docs/scope/idea.md) or product description into a right-sized, living phase roadmap in docs/scope/SCOPE.md, or reconciles progress when run with no arguments. Enforces a Project Mode size gate so small builds stay lean. Do NOT use for raw brain-dump cleanup (/idea-dump), technical architecture or stack selection (/architect), or writing code (/develop).
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
  - ask_question
---

# Scope

Turns a product idea into an ordered, right-sized, living roadmap in `docs/scope/SCOPE.md` and keeps it honest as phases ship. Answers **what** to build, in **what order**, and at **what rigor level**—leaving **how** and **with what stack** to `/architect` and `/develop`.

## Output Style & Tone

Write everything this skill produces, files and chat messages alike, in plain, direct language. Talk to the reader as `you` like a trusted senior product engineer. Present every next step as a clear recommendation `you` can run or adjust, never a rigid order. Keep sentences concise and concrete.

## Inferred Modes (One Command: `/scope [arg]`)

Inspect `docs/scope/SCOPE.md` and the argument passed to `/scope` to infer the mode automatically:

1. **Plan** *(default when `docs/scope/SCOPE.md` does not exist, or when passed an idea file like `docs/scope/idea.md`)*:
   Read the idea + inspect the codebase → run the **Project Mode Gate** + up to 3 scoping questions → propose a right-sized phase roadmap in chat → confirm → write `docs/scope/SCOPE.md`.
2. **Replan / Reconcile** *(`docs/scope/SCOPE.md` exists + bare `/scope` with no argument)*:
   Open with a **"Where things stand"** orientation (git branch, ahead/behind status, phase counts by status, and active phase resume point), reconcile shipped code and `docs/scope/plans/` against `SCOPE.md`, enroll surfaced follow-ups or mark cut items `Dropped`, and queue the next action. See [Approaches & Modes](references/approaches-and-modes.md).
3. **Add** *(`docs/scope/SCOPE.md` exists + argument names a single feature or phase)*:
   Deduplicate against existing phases, confirm placement and intent briefly in chat, and append one coarse phase row + section in `docs/scope/SCOPE.md` without replanning the whole project. See [Approaches & Modes](references/approaches-and-modes.md).

---

## Core Discipline: Asks vs. Acts

- **INFER** everything already present in `docs/scope/idea.md`, `AGENTS.md`, or existing repo manifests/code. Never re-ask what is already written.
- **ASK** only the **Project Mode** and up to **3 high-impact scoping questions** (each carrying a concrete `[Default: ...]`) in a single batched turn.
- **RECOMMEND** the Project Mode, the Build Approach (`Tracer Bullet`, `Skateboard`, `Facade`, or `Journey`), and the phase order—always marking one option `(Recommended)` with a one-line why.
- **Never pick tech stacks:** Do not choose frameworks, databases, ORMs, UI libraries, or hosting providers here. Record `Deferred to /architect per phase` in `SCOPE.md` unless `you` already stated specific tools in `idea.md` or existing repo code already establishes them.

## Artifact Ownership & Shared State

- **Owns:** `docs/scope/SCOPE.md` (or `.workflow/scope/SCOPE.md` if `docs/` is a published docs site).
- **Reads:** `docs/scope/idea.md` (if present), existing repo manifests/source tree, `AGENTS.md`, and `docs/scope/plans/*.md` (during `replan`).
- **Canonical Phase Statuses** *(shared identically across `/scope`, `/architect`, `/develop`, `/check`)*:
  `Planned` → `Architected` → `In Progress` → `Developed` → `Verified` *(plus `Existing` for pre-workflow brownfield features and `Dropped` for de-scoped phases)*.
- **Surgical edits on updates:** Re-read `docs/scope/SCOPE.md` right before writing; update changed rows/sections cleanly in place without wiping history.

---

## Plan Execution Flow

### Step 1: Read Idea & Inspect Repo Context

1. **Locate the idea input:**
   - If a file path argument was passed (e.g., `/scope docs/scope/idea.md`), read it.
   - Else if `docs/scope/idea.md` exists on disk, read it automatically.
   - Else if an inline product description was given in the prompt, use it.
   - Else (no `SCOPE.md`, no `idea.md`, and no inline idea): stop and ask:
     > *"What are you building? Describe it in a few sentences, or run `/idea-dump` first if you want to sort out a messy brain dump into `docs/scope/idea.md`."*
2. **Check repository state (fast, read-only):**
   - Scan top-level manifests (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, workspace configs) and check whether source files exist (ignoring `node_modules/`, `.git/`, `dist/`, `build/`).
   - **Greenfield:** No code or manifest yet.
   - **Brownfield:** Code already exists. Read `AGENTS.md` (if present) and do a lightweight directory scan to identify already-built areas (`Existing` or partial `In Progress`) and locked stack conventions so you build on top of reality instead of re-planning what already exists.

### Step 2: Project Mode Gate + Scoping Questions (Single Turn)

Before breaking the project into phases, ask **Project Mode** plus **up to 3 high-impact scoping questions** (omit scoping questions if `idea.md` already settles everything) in **one single turn**.

Use your runtime's interactive picker (`ask_question`, `AskUserQuestion`, `question`, `request_user_input`) when available, or present clean plain-text panels with `[Default: ...]` markers:

1. **Project Mode (Mandatory Size & Rigor Gate):**
   Analyze `idea.md` / repo signals and mark the best-fitting tier `(Recommended)` with a 1-line reason tailored to this project:
   - **Casual / Hobby** — Fun, learning, or personal tool. Minimal ceremony. **Cap: 1–3 phases.**
   - **Prototype / MVP** — Fast working v1 to prove a concept. Solid core, skip heavy polish. **Cap: 2–4 phases.**
   - **Production / Commercial** — Real users or client delivery. Full validation, error handling, security, and deployment readiness. **Cap: 4–7 phases.**

2. **Build Approach** *(include in the picker if non-obvious, or state your recommended default inline)*:
   - **Tracer Bullet** — Thin end-to-end vertical thread through every layer first, then thicken. *(Default for multi-layer MVP/Production apps.)*
   - **Skateboard** — Smallest usable complete product in Phase 01, then grow capabilities.
   - **Facade** — Clickable UI shell on mock/placeholder data first, wire backend after. *(Prototype-grade UI validation.)*
   - **Journey** — Finish one complete user flow deep (states + polish) per phase before starting the next.
   See [Approaches & Modes](references/approaches-and-modes.md) for how each slices work.

3. **Up to 3 High-Impact Scoping Questions (Optional, Max 3):**
   Ask *only* unstated product boundaries that materially change phase count or scope (MVP boundary, must-have vs. deferred capability, auth/multi-user need, compliance/deployment target). Every question **must** carry an explicit `[Default: ...]` recommendation so `you` can reply "use defaults" if desired. Never ask stack/library questions here.

Wait for `your` answers before generating phases.

### Step 3: Compose Right-Sized Phases & Confirm in Chat

Using `your` chosen **Project Mode**, **Build Approach**, and scoping answers, design the phase roadmap:

- **Enforce the Phase Cap strictly:**
  - `Casual / Hobby`: **1–3 phases** (a static landing page, small script, or simple personal widget should be **1–2 phases**, never 6–10!).
  - `Prototype / MVP`: **2–4 phases**.
  - `Production / Commercial`: **4–7 phases**.
- **Merge small related tasks into cohesive phases:**
  - Never split setup, config, schema, a single component, and styling into tiny separate phases when they belong together.
  - In `Casual / Hobby` and small `Prototype / MVP` projects, fold project scaffolding + initial setup directly into **Phase 01** alongside the first working slice.
  - Reserve a dedicated **Phase 01: Foundation & Core Architecture** only when the project is complex enough (`Production / Commercial` or multi-service `Prototype / MVP`) to warrant settling shared schema/auth/scaffold before feature slices.
- **Brownfield repos:** Enroll already-shipped capabilities briefly as `Existing` for context; spend phases only on net-new or unfinished work.
- **Separate Non-Goals & Deferred:** Explicitly list `Nice-to-Haves / Later` from `idea.md` and anything excluded during scoping under **Non-Goals & Deferred** so scope creep stays visible and out of active phases.

**Present the proposed roadmap in chat first** (Project Mode, Build Approach, Non-Goals, and numbered Phase summary with `Intent` + `Done when:` per phase) and ask for confirmation:
- `(Recommended) Approve & save docs/scope/SCOPE.md`
- `Merge, split, or reorder phases`
- `Adjust scope or non-goals`

Iterate in chat if `you` ask for changes. Do **not** write `docs/scope/SCOPE.md` until `you` approve the roadmap.

### Step 4: Write `docs/scope/SCOPE.md` & Hand Off

1. Write `docs/scope/SCOPE.md` following the exact structure in [Scope Template](references/scope-template.md):
   - Project summary, **Project Mode**, **Build Approach**, **Source Idea**, and **Tech Stack** (`Deferred to /architect per phase`, or any user-stated / brownfield stack).
   - **Non-Goals & Deferred** list.
   - **At a Glance** table (`# | Phase | Status | Plan`).
   - Numbered phase sections (`### 01. <Phase Name> · Planned`, 1–2 line intent, `**Done when:**` line, and initial checkbox `- [ ] Architect plan: /architect <Phase Name>`).
2. Output the completion block:

```markdown
## /scope complete · <Project Name>

**<N> phases planned (<Project Mode>, <Build Approach> approach, <K> items deferred).**
Scope saved to `docs/scope/SCOPE.md`.
Next: run `/clear` for a fresh context window, then design Phase 01:
`/architect <Phase 01 Name>`
```

`/scope` stops here. Never auto-run `/architect` or `/develop`.

---

## References

- [Scope Template](references/scope-template.md) — Exact `docs/scope/SCOPE.md` layout, checkbox lifecycle, brownfield enrollment, and status rules.
- [Approaches & Modes](references/approaches-and-modes.md) — Slicing rules for `Tracer Bullet`, `Skateboard`, `Facade`, and `Journey`, plus `replan` and `add` workflows.
