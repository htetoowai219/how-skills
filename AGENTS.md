# Agent Instructions: Authoring & Maintaining Skills

This repository is a personal Agent Skills catalog adhering strictly to the open [agentskills.io](https://agentskills.io) specification and compatible with `npx skills` (`vercel-labs/skills`).

All AI agents authoring, modifying, or vendoring skills in this repository MUST comply with the guidelines below.

---

## 1. Specification & Portable Frontmatter

Every skill must reside in its own folder under `skills/<skill-name>/` with a root `SKILL.md` file. Keep all skill directories flat inside `skills/` (never nest skill folders).

Frontmatter must start and end with `---` and support the portable standard fields:

```yaml
---
name: my-skill-name
description: Concise, third-person description of what the skill does and when to trigger it.
license: MIT
compatibility: Designed for Agent Skills-compatible tools (Claude Code, Cursor, Codex, Gemini CLI, OpenCode)
metadata:
  source: custom # or "jsmastery-pro/skills"
  author: "Author Name"
  version: "1.0.0"
allowed-tools:
  - read_file
  - run_command
---
```

### Frontmatter Field Requirements
- **`name`** (required):
  - Must match the directory name `skills/<skill-name>` exactly.
  - 1–64 characters.
  - Regex: `^[a-z0-9]+(?:-[a-z0-9]+)*$` (lowercase alphanumeric, single hyphens only; no leading, trailing, or double hyphens).
- **`description`** (required):
  - Must be written in **third person**.
  - Must state **what** the skill does and **when** to activate it.
  - Include explicit negative boundaries ("Do NOT use for...") when relevant to prevent incorrect activations.
  - Non-empty, maximum 1,024 characters.
- **Optional standard fields**:
  - `license`: e.g., `MIT` or `Apache-2.0`.
  - `compatibility`: tool compatibility note.
  - `metadata`: key-value map (`source`, `author`, `version`, etc.).
  - `allowed-tools`: list of tool names the skill interacts with.

---

## 2. Categorization & Marketplace Manifest (`.claude-plugin/marketplace.json`)

The `.claude-plugin/marketplace.json` file is the **single source of truth** for skill categories and enables collapsible groups in the `npx skills` interactive picker:

- **`jsm-skills`**: Curated workflow skills vendored from JavaScript Mastery.
- **`how-skills`**: Personal development skills and codebase conventions.

### Category Management Rules
- Keep skill directories flat inside `skills/` (do NOT move folders into subdirectories).
- Every folder in `skills/` must appear in exactly one plugin group in `.claude-plugin/marketplace.json` as `"./<skill-name>"`.
- Entries in each plugin's `skills` array must be sorted alphabetically.
- Whenever a skill is created, renamed, or deleted, update `.claude-plugin/marketplace.json` accordingly.
- `npm run new -- <name>` automatically registers new skills into `how-skills` (or specify `--group <plugin-name>`).

---

## 3. Progressive Disclosure & Line Limits

- **Keep `SKILL.md` under 500 lines**:
  - `SKILL.md` acts as the primary operational entry point.
  - Verbose documentation, large code samples, schemas, checklists, and templates must be offloaded into the `references/` subfolder (e.g. `references/checklist.md`, `references/api-schema.json`).
  - Always link reference files using relative paths from the skill folder (e.g., `[Checklist](references/checklist.md)`).
- **Relative Reference Integrity**:
  - All referenced relative links and backticked paths inside `SKILL.md` must resolve to existing files within that skill directory.

---

## 4. Generalization & Zero Secrets

- **No hardcoded secrets**: Never embed API keys, personal access tokens, passwords, private URLs, or credentials.
- **No personal paths**: Never hardcode local machine paths (e.g., `/home/username/`, `C:\Users\...`).
- **No single-project assumptions**: Skills must remain reusable across different workspaces and tech stacks unless the skill is intentionally framework-specific.

---

## 5. Cross-Skill References & Dependencies

- When referencing another skill via slash command (e.g. `/architect`, `/audit`), verify whether that skill exists in `skills/`.
- If a skill depends on another skill that is not installed, note it as an optional handoff or document prerequisite steps.

---

## 6. Workflow for Adding or Editing Skills

1. **Scaffold a new skill**:
   ```bash
   # Default to how-skills category
   npm run new -- <skill-name>

   # Or specify category explicitly
   npm run new -- <skill-name> --group jsm-skills
   ```
2. **Author `SKILL.md` & references**:
   - Fill in instructions, triggers, negative conditions, and workflow steps.
   - Place extended reference files in `skills/<skill-name>/references/`.
3. **Validate**:
   ```bash
   npm run validate
   ```
   Ensures zero hard errors for both `SKILL.md` rules and `.claude-plugin/marketplace.json` completeness.
4. **Update Catalog**:
   ```bash
   npm run sync-readme
   ```
   Updates the grouped catalog tables in `README.md`.
