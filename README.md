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
   npm run new -- <skill-name>
   ```
   This copies `templates/skill-template/` into `skills/<skill-name>/` and configures the spec-compliant frontmatter.

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
| Skill | Description | Source |
|---|---|---|
| _(No skills installed yet)_ | _Use `npm run new -- <skill-name>` to create your first skill._ | — |
<!-- SKILLS_TABLE_END -->

---

## 📄 License & Attribution

- Custom skills in this repository are released under the [MIT License](LICENSE).
- Vendored third-party skills (e.g., JavaScript Mastery) retain their original licenses and attributions. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for details.
