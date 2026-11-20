# Personal Agent Skills Catalog

A personal Agent Skills repository 100% compliant with the open [agentskills.io](https://agentskills.io) specification and the `npx skills` CLI installer (`vercel-labs/skills`).

This repository houses both custom agent skills and cherry-picked, MIT-licensed third-party skills (such as skills from JavaScript Mastery).

---

## 🚀 Installation & Usage

Skills from this repository can be installed into any Agent Skills-compatible environment (Claude Code, Cursor, Codex, Gemini CLI, OpenCode, etc.) using `npx skills`.

### 1. Interactive Installation

Install skills interactively from your local clone or directly from GitHub:

```bash
# From local repository clone
npx skills add /path/to/this-repo

# From GitHub repository (HTTPS)
npx skills add https://github.com/<user>/<repo>.git

# From GitHub repository (SSH)
npx skills add git@github.com:<user>/<repo>.git
```

The interactive picker will display all available skills found in `skills/`.

### 2. Non-Interactive / Scripted Installation

Specify individual skills, target agent environments, and bypass prompts:

```bash
# Install a specific skill for a specific agent (e.g., claude-code)
npx skills add /path/to/this-repo --skill <skill-name> --agent claude-code -y

# Install globally across all supported agents
npx skills add /path/to/this-repo --skill <skill-name> -g -y
```

### 3. Updating Installed Skills

Keep skills updated in your current project or globally:

```bash
# Update skills in current project workspace
npx skills update

# Update globally installed skills
npx skills update -g
```

---

## 🛠 Authoring & Maintaining Skills

This repository uses pure Node.js ESM utility scripts with **zero external npm dependencies**.

### Workflow

1. **Scaffold a new skill**:
   ```bash
   # Default category: how-skills
   npm run new -- <skill-name>

   # Or specify category explicitly
   npm run new -- <skill-name> --group jsm-skills
   ```
   This copies `templates/skill-template/` into `skills/<skill-name>/`, configures spec-compliant frontmatter, and registers the skill in `.claude-plugin/marketplace.json`.

2. **Author instructions & progressive disclosure**:
   - Edit `skills/<skill-name>/SKILL.md`.
   - Ensure the description clearly states **what** the skill does and **when** to trigger it.
   - Keep `SKILL.md` under 500 lines. Place detailed checklists, schemas, and deep dives in `skills/<skill-name>/references/`.

3. **Validate skills**:
   ```bash
   npm run validate
   ```
   Runs the spec linter checking folder naming, YAML frontmatter, line count limits, relative file references, and cross-skill references.

4. **Synchronize catalog index**:
   ```bash
   npm run sync-readme
   ```
   Automatically updates the catalog table below.

5. **List installed skills**:
   ```bash
   npm run list
   ```

See [AGENTS.md](AGENTS.md) for detailed authoring conventions.

---

## 📚 Skill Catalog

<!-- SKILLS_TABLE_START -->
### jsm-skills

*Curated workflow skills vendored from JavaScript Mastery*

| Skill | Description |
|---|---|
| [`architect`](skills/architect/SKILL.md) | Run /architect when choosing between approaches, designing a feature or page, picking a tech stack, or when implementation workflows say a decision is owed, anytime a load bearing technical decision is unmade. Asks deep questions, recommends an answer, and writes a build spec to docs/specs/. Owns all spec files. |
| [`audit`](skills/audit/SKILL.md) | Run /audit on a greenfield project, an existing codebase with missing docs, or one area (/audit src/auth) to bootstrap the project's AI context, the AGENTS.md files every later skill reads. Writes tool agnostic AGENTS.md plus thin CLAUDE.md pointers, adding only what is missing; never overwrites curated content. |
| [`check`](skills/check/SKILL.md) | Confirm a change before merge. `/check verify` drives the real app to prove behavior against the spec (every acceptance criterion met, every surface built). `/check review` runs a senior code review on a fresh model, one that did not write the code. Verify after implementation, review before a PR. Writes to docs/reviews/, never edits code. |
| [`debug`](skills/debug/SKILL.md) | Run /debug to find and fix a bug's root cause: a test failing for an unclear reason, /check verify finding a failure, or behavior being wrong. Runs a reproduce, localize, hypothesize, test, fix, verify loop, makes the minimal fix, and adds a regression test. No features, no extra refactors. |
| [`sync`](skills/sync/SKILL.md) | Run /sync as the last step after a change is complete, around merge, to keep durable knowledge current. Updates root and nested AGENTS.md, reconciles the scope from repo evidence, and flags specs the change made stale. Surgical edits only: it adds lines, and rewrites single lines it owns. Never a whole section, never curated prose. |

### how-skills

*Personal development skills and codebase conventions*

| Skill | Description |
|---|---|
| [`express-backend-architecture`](skills/express-backend-architecture/SKILL.md) | Scaffolds, extends, and refactors modular Express.js TypeScript backends conforming to our production conventions (Mongoose, layered separation, asyncHandler, ApiError, clean response envelopes, and token-safe modular lazy-loading). Trigger when scaffolding a new Express backend from scratch, adding vertical CRUD resource bundles, or integrating optional modules (JWT auth/RBAC, Multer/Cloudinary uploads, Redis caching, Docker). Do NOT use for frontend code, NestJS apps, Next.js API routes, or non-Express scripts. |
| [`express-to-nest`](skills/express-to-nest/SKILL.md) | Migrate an Express.js TypeScript backend to a modular NestJS application with 100% API contract fidelity, matching Mongoose schemas, Cloudinary/Multer handling, JWT cookies, and security configurations. |
| [`frontend-architecture`](skills/frontend-architecture/SKILL.md) | Configures boilerplate architecture, routing, API client, Zustand stores, React Hook Form + Zod, and styling setup in freshly scaffolded React (Vite) or Next.js projects, and wires unstyled structural page and form stubs. Trigger when setting up frontend project conventions, adding state/API/form boilerplate, or wiring functional page shells. Do NOT use for visual UI/UX design, custom theme styling, decorative components, backend Express/NestJS code, React Native, or generating base Vite/Next projects from scratch. |
| [`readme-writer`](skills/readme-writer/SKILL.md) | Generates or refactors clean, prototype-first README.md files in an authentic human developer voice through codebase inspection and a structured two-round interactive grill. Use when writing a new README from scratch, overhauling an existing inconsistent README, or updating documentation after major architecture, Docker, or configuration changes. Do NOT use for authoring internal docs/ deep dives, API references, changelogs, PR summaries, or AGENTS.md files. |
| [`wire`](skills/wire/SKILL.md) | Wires an existing frontend and backend (routes, payloads, CORS/proxy, auth transport, env). Trigger when connecting apps or fixing API integration issues. Do NOT use for initial scaffolding from scratch or UI styling. |
<!-- SKILLS_TABLE_END -->

---

## 📄 License & Attribution

- Custom skills in this repository are released under the [MIT License](LICENSE).
- Vendored third-party skills (e.g., JavaScript Mastery) retain their original licenses and attributions. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for details.
