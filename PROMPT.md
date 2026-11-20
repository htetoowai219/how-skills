# Master Prompt: Scaffold Personal Agent Skills Repository

Create a personal Agent Skills repository in the current working directory that is 100% compatible with the `agentskills.io` open specification and the `npx skills` CLI installer (`vercel-labs/skills`), designed to hold both cherry-picked third-party skills (such as JavaScript Mastery's MIT-licensed skills) and my own custom skills.

## 1. Constraints & Design Philosophy
- **Zero external npm dependencies**: Write all repository utility scripts in pure Node.js ESM (`.mjs`, Node 22+) using only built-in modules (`node:fs`, `node:path`, `node:url`).
- **Strict spec compliance**: Every skill in `skills/` must conform to the `agentskills.io` `SKILL.md` format so it works across Claude Code, Cursor, Codex, Gemini CLI, OpenCode, and any other Agent Skills-compatible tool.
- **No placeholder pollution inside `skills/`**: Do NOT put dummy or template skills inside `skills/` (because `npx skills` scans `skills/` for the interactive picker). Store starter templates inside `templates/` instead.

## 2. Target Directory Structure
Create the following files and folders:

```text
.
├── AGENTS.md                   # Repo instructions for AI agents authoring/maintaining skills
├── README.md                   # Usage guide (local + GitHub npx skills commands) & skill index
├── THIRD_PARTY_LICENSES.md     # MIT attribution file for vendored third-party skills (e.g., JSM)
├── .gitignore
├── package.json                # Private ESM package with validate/new/list npm scripts
├── scripts/
│   ├── validate-skills.mjs     # Spec, frontmatter, link, line-count, and cross-reference linter
│   ├── new-skill.mjs           # CLI helper: `npm run new -- <skill-name>`
│   └── sync-readme.mjs         # Updates the Skill Catalog table in README.md from SKILL.md files
├── templates/
│   └── skill-template/
│       ├── SKILL.md            # Spec-compliant starter template
│       └── references/
│           └── example.md
└── skills/
    └── .gitkeep                # All real skills (JSM + custom) go here
```

## 3. File Specifications

### A. `package.json`
- `"private": true`, `"type": "module"`.
- Scripts:
  - `"validate": "node scripts/validate-skills.mjs"`
  - `"new": "node scripts/new-skill.mjs"`
  - `"sync-readme": "node scripts/sync-readme.mjs"`

### B. `scripts/validate-skills.mjs`
Scan every subdirectory inside `skills/` (ignoring hidden files like `.gitkeep`) and validate:
1. **Required file**: `SKILL.md` exists at `skills/<dir>/SKILL.md`.
2. **YAML Frontmatter**: Starts and ends with `---` and parses `name`, `description`, and optional standard fields (`license`, `compatibility`, `metadata`, `allowed-tools`).
3. **`name` rules**:
   - Required, 1–64 characters.
   - Regex: `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (lowercase letters, digits, single hyphens; no leading, trailing, or double hyphens).
   - Must match the parent folder name exactly.
4. **`description` rules**:
   - Required, non-empty, maximum 1,024 characters.
5. **Progressive disclosure check (warning, not hard failure)**:
   - Warn if `SKILL.md` body exceeds 500 lines.
6. **Relative file reference check (hard error)**:
   - Scan Markdown links and backticked relative paths (e.g., `references/foo.md`, `flow/build.md`, `./checklist.md`) inside `SKILL.md` and verify that any referenced local file inside that skill folder actually exists. (Ignore URLs, repo-root project outputs like `AGENTS.md`, `docs/specs/`, or `CHANGELOG.md`.)
7. **Cross-skill handoff check (warning)**:
   - Detect slash-command skill references (e.g., `/architect`, `/test`, `/audit`) in `SKILL.md` and print a warning if the referenced skill folder does not exist in `skills/`—making it easy to spot broken handoffs in cherry-picked third-party skills.
8. Print a clean summary table (Pass / Warn / Fail) and exit with code `1` if any hard errors exist, `0` otherwise.

### C. `scripts/new-skill.mjs`
- Accepts a skill name argument: `npm run new -- my-skill-name`.
- Validates the name against `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` (max 64 chars).
- Fails cleanly if `skills/<skill-name>` already exists.
- Copies `templates/skill-template/` to `skills/<skill-name>/`, replaces `{{SKILL_NAME}}` in `SKILL.md` with the provided name, and removes placeholder comments if needed.

### D. `scripts/sync-readme.mjs`
- Reads every valid `skills/<name>/SKILL.md`, extracts `name`, `description`, and optional `metadata.source` (defaults to `custom`), and updates the table between `<!-- SKILLS_TABLE_START -->` and `<!-- SKILLS_TABLE_END -->` markers in `README.md`.

### E. `AGENTS.md`
Write concise authoring instructions for any AI agent working inside this repository:
- Follow the `agentskills.io` standard: keep frontmatter portable (`name`, `description`, optional `license`, `compatibility`, `metadata`, `allowed-tools`).
- Write `description` in third person stating both *what* the skill does and *when* to trigger it (plus explicit "Do NOT use for..." boundaries where helpful).
- Keep `SKILL.md` under 500 lines; offload verbose checklists, templates, and code examples into `references/` linked by relative paths.
- Never hardcode secrets, personal paths, or single-project business logic into a skill.
- Always run `npm run validate` and `npm run sync-readme` after adding or editing any skill.

### F. `THIRD_PARTY_LICENSES.md`
Include a clean template section ready for JavaScript Mastery's MIT license text, with fields for:
- Source repository URL (e.g., `https://github.com/jsmastery-pro/skills`)
- List of vendored skill folder names
- Full MIT License text block placeholder (`[PASTE JSM LICENSE FILE HERE]`)

### G. `README.md`
Document:
1. Interactive installation from local disk (`npx skills add ~/path/to/this-repo`) and GitHub (`npx skills add git@github.com:<user>/<repo>.git`).
2. Non-interactive preset installation example (`--skill`, `--agent`, `-y`) and global installation (`-g`).
3. Updating installed skills in a project (`npx skills update`).
4. Authoring workflow (`npm run new -- <name>`, `npm run validate`, `npm run sync-readme`).
5. A `<!-- SKILLS_TABLE_START -->` / `<!-- SKILLS_TABLE_END -->` section for the auto-generated catalog.

## 4. Verification Before Finishing
After creating all files:
1. Initialize git (`git init`) if `.git` does not already exist.
2. Run `npm run validate` and confirm it passes cleanly on the empty `skills/` folder.
3. Verify `scripts/new-skill.mjs` works by testing it on a temporary skill, running `npm run validate`, and then deleting the temporary test skill so `skills/` stays clean.