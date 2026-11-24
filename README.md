<div align="center">
  <h1>personal-agent-skills</h1>
  <p>Agent skills catalog adhering to the open agentskills.io specification, installable via npx skills.</p>
  <p>
    <a href="https://github.com/htetoowai219/how-skills"><img src="https://img.shields.io/badge/spec-agentskills.io-blue?style=flat-square" alt="Specification" /></a>
    <img src="https://img.shields.io/badge/node-%3E%3D18-informational?style=flat-square" alt="Node" />
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  </p>
</div>

## Quick Start

### Prerequisites
- Node.js 18+
- Git

### Installation

Install any skill directly into an active project or agent environment (Claude Code, Cursor, Codex, Gemini CLI, OpenCode):

```bash
# Install interactively from GitHub
npx skills@latest add htetoowai219/how-skills
```

Use arrow keys in the interactive terminal picker to select skills.

<details>
<summary>Non-interactive and global install commands</summary>

```bash
# Install a specific skill for a specific agent (e.g. claude-code)
npx skills add https://github.com/htetoowai219/how-skills.git --skill <skill-name> --agent claude-code -y

# Install globally across all supported agents
npx skills add https://github.com/htetoowai219/how-skills.git --skill <skill-name> -g -y

# Update skills in the current workspace
npx skills update

# Update globally installed skills
npx skills update -g
```
</details>

## Architecture & Design

Engineering workflows often fragment across disparate tool-specific prompts and configurations. This repository unifies coding conventions and repeatable workflows into modular skill directories conforming to the open `agentskills.io` standard.

```text
how-agent-skills/
├── .claude-plugin/
│   └── marketplace.json    # Category groupings for the npx skills picker
├── scripts/                # Native Node.js ESM tooling (zero npm dependencies)
│   ├── new-skill.mjs       # Scaffolds skills and updates marketplace manifest
│   ├── validate-skills.mjs # Validates frontmatter, links, line limits, and categories
│   └── sync-readme.mjs     # Generates and updates the catalog table below
├── skills/                 # Flat skill folders (never nested)
│   ├── architect/          # Project workflow skill with references/
│   │   ├── SKILL.md        # Entry point capped under 500 lines
│   │   └── references/
│   └── readme-writer/      # Personal convention skill with references/
│       ├── SKILL.md
│       └── references/     # Progressive disclosure docs and templates
└── templates/              # Base scaffold for new skills
```

### 5-Skill Project Workflow (`workflow-skills`)

The workflow skills guide a project from raw thoughts to verified code through a single shared state directory (`docs/scope/`), scaling ceremony to match a **Project Mode** gate (`Casual / Hobby` 1–3 phases · `Prototype / MVP` 2–4 phases · `Production / Commercial` 4–7 phases):

```text
/idea-dump ──> /scope ──> /architect ──> /develop ──> /check (verify & review)
```

- **`idea-dump`** → Organizes messy brain dumps faithfully in chat without inventing features or picking stacks, then writes `docs/scope/idea.md`.
- **`scope`** → Applies the Project Mode size gate, merges small tasks into cohesive phases, confirms the roadmap in chat, and writes `docs/scope/SCOPE.md`.
- **`architect`** → Checks stack choices per phase, resolves design trade-offs (strictly plan-only, zero code), confirms in chat, and writes `docs/scope/plans/<NN-slug>.md`.
- **`develop`** → Implements strictly from `docs/scope/plans/<NN-slug>.md` at Project Mode rigor, runs build/typecheck checks, and marks the phase `Developed`.
- **`check`** → `/check verify` audits plan conformance, system integration, and runtime/build commands before marking `SCOPE.md` `Verified`; `/check review` runs a senior diff review into `docs/reviews/`.

### Engineering Trade-Offs

- **Flat Skill Directory:** All skills reside directly in `skills/` without subfolder nesting. Category metadata lives exclusively in `.claude-plugin/marketplace.json` to keep directory paths predictable across different agent runtimes.
- **Progressive Disclosure:** `SKILL.md` is strictly limited to 500 lines to preserve agent context windows during activation. Deep checklists, schemas, and templates are offloaded to `references/` and loaded only when relevant.
- **Zero-Dependency Tooling:** Scaffolding, validation, and catalog indexing run on Node.js standard modules (`node:fs`, `node:path`, `node:url`), eliminating dependency maintenance and supply-chain drift.

## Skill Development Workflow

The repository includes scripts to scaffold, test, and index skills.

### 1. Scaffold a New Skill
```bash
# Default group: engineering-skills
npm run new -- <skill-name>

# Or specify a target group explicitly
npm run new -- <skill-name> --group workflow-skills
```
This copies `templates/skill-template/` into `skills/<skill-name>/`, sets up standard frontmatter, and registers the folder in `.claude-plugin/marketplace.json`.

### 2. Validate Specification Compliance
```bash
npm run validate
```
The test runner validates:
- Directory naming (`^[a-z0-9]+(?:-[a-z0-9]+)*$`).
- YAML frontmatter completeness (`name`, `description`, `license`, `metadata`).
- File length constraints (`SKILL.md` <= 500 lines).
- Relative reference integrity (links to `references/` resolve on disk).
- Category synchronization across `.claude-plugin/marketplace.json`.

<details>
<summary>Catalog synchronization and listing</summary>

```bash
# Sync the catalog table below from disk frontmatter
npm run sync-readme

# List all categorized skills in the terminal
npm run list
```
</details>

## Skill Catalog

<!-- SKILLS_TABLE_START -->
### workflow-skills

*End-to-end project workflow skills (idea-dump, scope, architect, develop, check)*

| Skill | Description |
|---|---|
| [`architect`](skills/architect/SKILL.md) | Designs a phase or feature before coding—checking stack choices, resolving technical trade-offs calibrated to Project Mode, confirming the design in chat, and writing an actionable plan to docs/scope/plans/<NN-slug>.md. Strictly plan-only (writes zero app code). Do NOT use for raw brain dumps (/idea-dump), high-level phase roadmaps (/scope), or implementing code (/develop). |
| [`check`](skills/check/SKILL.md) | Audits and verifies implemented work before marking a phase complete or merging. `/check verify <Phase>` proves implementation against docs/scope/plans/<NN-slug>.md, system integration, and build/test commands (respecting Project Mode) before marking SCOPE.md Verified. `/check review` runs a senior diff review and writes findings to docs/reviews/. Do NOT use for planning (/architect) or building new features (/develop). |
| [`develop`](skills/develop/SKILL.md) | Implements a planned phase or feature strictly from its approved plan in docs/scope/plans/<NN-slug>.md, keeping code complexity proportional to Project Mode, running build/typecheck sanity checks, and updating status to Developed. Hard-stops if no plan doc exists. Do NOT use for scoping (/scope), architecture planning (/architect), or final verification sign-off (/check). |
| [`idea-dump`](skills/idea-dump/SKILL.md) | Turns a messy, unorganized project brain dump into a clean, faithful idea brief at docs/scope/idea.md through an interactive chat loop before scoping. Trigger when starting a new project from raw thoughts, voice notes, or scattered ideas. Do NOT use for phase roadmaps (/scope), technical specs or stack selection (/architect), or writing code (/develop). |
| [`scope`](skills/scope/SKILL.md) | Turns an idea brief (docs/scope/idea.md) or product description into a right-sized, living phase roadmap in docs/scope/SCOPE.md, or reconciles progress when run with no arguments. Enforces a Project Mode size gate so small builds stay lean. Do NOT use for raw brain-dump cleanup (/idea-dump), technical architecture or stack selection (/architect), or writing code (/develop). |

### architecture-skills

*Stack scaffolding, migration, and codebase architecture conventions*

| Skill | Description |
|---|---|
| [`express-backend-architecture`](skills/express-backend-architecture/SKILL.md) | Scaffolds, extends, and refactors modular Express.js TypeScript backends conforming to our production conventions (Mongoose, layered separation, asyncHandler, ApiError, clean response envelopes, and token-safe modular lazy-loading). Trigger when scaffolding a new Express backend from scratch, adding vertical CRUD resource bundles, or integrating optional modules (JWT auth/RBAC, Multer/Cloudinary uploads, Redis caching, Docker). Do NOT use for frontend code, NestJS apps, Next.js API routes, or non-Express scripts. |
| [`express-to-nest`](skills/express-to-nest/SKILL.md) | Migrate an Express.js TypeScript backend to a modular NestJS application with 100% API contract fidelity, matching Mongoose schemas, Cloudinary/Multer handling, JWT cookies, and security configurations. |
| [`frontend-architecture`](skills/frontend-architecture/SKILL.md) | Configures boilerplate architecture, routing, API client, Zustand stores, React Hook Form + Zod, and styling setup in freshly scaffolded React (Vite) or Next.js projects, and wires unstyled structural page and form stubs. Trigger when setting up frontend project conventions, adding state/API/form boilerplate, or wiring functional page shells. Do NOT use for visual UI/UX design, custom theme styling, decorative components, backend Express/NestJS code, React Native, or generating base Vite/Next projects from scratch. |

### engineering-skills

*Focused engineering utilities for security hardening, wiring, Docker, hygiene, docs, and issue resolution*

| Skill | Description |
|---|---|
| [`backend-hardening`](skills/backend-hardening/SKILL.md) | Audits backend APIs for security, IDOR/RBAC, mass assignment, data leaks, injection, uploads, rate limits, and DB indexes. Do NOT use for frontend UI, CSS, or scaffolding new features. |
| [`de-slop`](skills/de-slop/SKILL.md) | Removes AI-generated noise (narration comments, dead code/imports, debug logs, weak type casts, redundant wrappers) strictly within changed files. Do NOT use for feature refactors, bug fixes, or formatting-only Prettier runs. |
| [`dockerize`](skills/dockerize/SKILL.md) | Generates multi-stage Dockerfiles, .dockerignore, Compose with healthchecks, non-root users, and zero-localhost container networking. Do NOT use for Kubernetes/Helm, CI pipelines, or app business logic. |
| [`fix-issue`](skills/fix-issue/SKILL.md) | Resolves GitHub issues end-to-end: fetches context, inspects codebase, resolves ambiguity via interactive gate, implements fix on a dedicated branch, verifies locally, and opens a PR upon explicit approval. Do NOT use for untracked repos, direct default branch commits, or unapproved PR creation. |
| [`readme-writer`](skills/readme-writer/SKILL.md) | Generates or refactors clean, prototype-first README.md files in an authentic human developer voice through codebase inspection and a structured two-round interactive grill. Use when writing a new README from scratch, overhauling an existing inconsistent README, or updating documentation after major architecture, Docker, or configuration changes. Do NOT use for authoring internal docs/ deep dives, API references, changelogs, PR summaries, or AGENTS.md files. |
| [`wire`](skills/wire/SKILL.md) | Wires an existing frontend and backend (routes, payloads, CORS/proxy, auth transport, env). Trigger when connecting apps or fixing API integration issues. Do NOT use for initial scaffolding from scratch or UI styling. |
<!-- SKILLS_TABLE_END -->

## License & Attribution

- All skills in this repository are released under the [MIT License](package.json).
- The `scope`, `architect`, `develop`, and `check` workflow skills are inspired by and adapted from [JavaScript Mastery's MIT-licensed skills](https://github.com/jsmastery-pro/skills).
