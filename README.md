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
│   ├── architect/          # Curated workflow skill
│   │   └── SKILL.md        # Entry point capped under 500 lines
│   └── readme-writer/      # Personal convention skill with references/
│       ├── SKILL.md
│       └── references/     # Progressive disclosure docs and templates
└── templates/              # Base scaffold for new skills
```

### Engineering Trade-Offs

- **Flat Skill Directory:** All skills reside directly in `skills/` without subfolder nesting. Category metadata lives exclusively in `.claude-plugin/marketplace.json` to keep directory paths predictable across different agent runtimes.
- **Progressive Disclosure:** `SKILL.md` is strictly limited to 500 lines to preserve agent context windows during activation. Deep checklists, schemas, and templates are offloaded to `references/` and loaded only when relevant.
- **Zero-Dependency Tooling:** Scaffolding, validation, and catalog indexing run on Node.js standard modules (`node:fs`, `node:path`, `node:url`), eliminating dependency maintenance and supply-chain drift.

## Skill Development Workflow

The repository includes scripts to scaffold, test, and index skills.

### 1. Scaffold a New Skill
```bash
# Default group: how-skills
npm run new -- <skill-name>

# Or specify a target group explicitly
npm run new -- <skill-name> --group jsm-skills
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
### jsm-skills

*Curated workflow skills vendored from JavaScript Mastery*

| Skill | Description |
|---|---|
| [`architect`](skills/architect/SKILL.md) | Run /architect when choosing between approaches, designing a feature or page, picking a tech stack, or when implementation workflows say a decision is owed, anytime a load bearing technical decision is unmade. Asks deep questions, recommends an answer, and writes a build spec to docs/specs/. Owns all spec files. |
| [`audit`](skills/audit/SKILL.md) | Run /audit on a greenfield project, an existing codebase with missing docs, or one area (/audit src/auth) to bootstrap the project's AI context, the AGENTS.md files every later skill reads. Writes tool agnostic AGENTS.md plus thin CLAUDE.md pointers, adding only what is missing; never overwrites curated content. |
| [`check`](skills/check/SKILL.md) | Confirm a change before merge. `/check verify` drives the real app to prove behavior against the spec (every acceptance criterion met, every surface built). `/check review` runs a senior code review on a fresh model, one that did not write the code. Verify after implementation, review before a PR. Writes to docs/reviews/, never edits code. |
| [`debug`](skills/debug/SKILL.md) | Run /debug to find and fix a bug's root cause: a test failing for an unclear reason, /check verify finding a failure, or behavior being wrong. Runs a reproduce, localize, hypothesize, test, fix, verify loop, makes the minimal fix, and adds a regression test. No features, no extra refactors. |
| [`develop`](skills/develop/SKILL.md) | Run /develop to build a feature, UI or backend, from an approved design, a page, component, API, service, or data slice. If something load bearing is undecided and no spec records it, it stops and routes you to /architect; otherwise it reads the spec plus AGENTS.md, builds, and advances the scope. |
| [`document`](skills/document/SKILL.md) | Run /document `pr` \| `changelog` \| `release-note` \| `postmortem` (or let it ask) to write the human facing prose about a change. Drafts from the real commits and diff, writing to the right place. Does not write code, tests, or specs. |
| [`scope`](skills/scope/SKILL.md) | Run /scope to turn a product idea into a living, coarse scope in docs/scope/ and keep it current: plan a new product, plan the next slice, enroll one named feature, or run with no argument to reconcile after shipping and queue what is next. Seeds WHAT to build; /architect designs, /develop builds. |
| [`sync`](skills/sync/SKILL.md) | Run /sync as the last step after a change is complete, around merge, to keep durable knowledge current. Updates root and nested AGENTS.md, reconciles the scope from repo evidence, and flags specs the change made stale. Surgical edits only: it adds lines, and rewrites single lines it owns. Never a whole section, never curated prose. |
| [`test`](skills/test/SKILL.md) | Run /test to write a test suite for code you just built or changed, after implementing a feature, route, or fix. Targets uncommitted changes automatically, reads test preferences.json for your framework (asks and saves it if absent), and picks the right strategy per file: happy path, edge cases, error states, accessibility. |

### how-skills

*Personal development skills and codebase conventions*

| Skill | Description |
|---|---|
| [`backend-hardening`](skills/backend-hardening/SKILL.md) | Audits backend APIs for security, IDOR/RBAC, mass assignment, data leaks, injection, uploads, rate limits, and DB indexes. Do NOT use for frontend UI, CSS, or scaffolding new features. |
| [`de-slop`](skills/de-slop/SKILL.md) | Removes AI-generated noise (narration comments, dead code/imports, debug logs, weak type casts, redundant wrappers) strictly within changed files. Do NOT use for feature refactors, bug fixes, or formatting-only Prettier runs. |
| [`dockerize`](skills/dockerize/SKILL.md) | Generates multi-stage Dockerfiles, .dockerignore, Compose with healthchecks, non-root users, and zero-localhost container networking. Do NOT use for Kubernetes/Helm, CI pipelines, or app business logic. |
| [`express-backend-architecture`](skills/express-backend-architecture/SKILL.md) | Scaffolds, extends, and refactors modular Express.js TypeScript backends conforming to our production conventions (Mongoose, layered separation, asyncHandler, ApiError, clean response envelopes, and token-safe modular lazy-loading). Trigger when scaffolding a new Express backend from scratch, adding vertical CRUD resource bundles, or integrating optional modules (JWT auth/RBAC, Multer/Cloudinary uploads, Redis caching, Docker). Do NOT use for frontend code, NestJS apps, Next.js API routes, or non-Express scripts. |
| [`express-to-nest`](skills/express-to-nest/SKILL.md) | Migrate an Express.js TypeScript backend to a modular NestJS application with 100% API contract fidelity, matching Mongoose schemas, Cloudinary/Multer handling, JWT cookies, and security configurations. |
| [`frontend-architecture`](skills/frontend-architecture/SKILL.md) | Configures boilerplate architecture, routing, API client, Zustand stores, React Hook Form + Zod, and styling setup in freshly scaffolded React (Vite) or Next.js projects, and wires unstyled structural page and form stubs. Trigger when setting up frontend project conventions, adding state/API/form boilerplate, or wiring functional page shells. Do NOT use for visual UI/UX design, custom theme styling, decorative components, backend Express/NestJS code, React Native, or generating base Vite/Next projects from scratch. |
| [`readme-writer`](skills/readme-writer/SKILL.md) | Generates or refactors clean, prototype-first README.md files in an authentic human developer voice through codebase inspection and a structured two-round interactive grill. Use when writing a new README from scratch, overhauling an existing inconsistent README, or updating documentation after major architecture, Docker, or configuration changes. Do NOT use for authoring internal docs/ deep dives, API references, changelogs, PR summaries, or AGENTS.md files. |
| [`wire`](skills/wire/SKILL.md) | Wires an existing frontend and backend (routes, payloads, CORS/proxy, auth transport, env). Trigger when connecting apps or fixing API integration issues. Do NOT use for initial scaffolding from scratch or UI styling. |
<!-- SKILLS_TABLE_END -->

## License & Attribution

- Custom skills in this repository are released under the [MIT License](package.json).
- Vendored third-party skills retain their original licenses and attributions. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for details.
