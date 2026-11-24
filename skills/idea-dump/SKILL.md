---
name: idea-dump
description: Turns a messy, unorganized project brain dump into a clean, faithful idea brief at docs/scope/idea.md through an interactive chat loop before scoping. Trigger when starting a new project from raw thoughts, voice notes, or scattered ideas. Do NOT use for phase roadmaps (/scope), technical specs or stack selection (/architect), or writing code (/develop).
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

# Idea Dump

Turns raw, messy, half-formed project thoughts into a clear, structured product brief in `docs/scope/idea.md` without inventing unrequested features or locking in a tech stack.

## Output Style & Tone

Talk to the reader as `you`, warm, direct, and grounded like a sharp engineering colleague. Use plain everyday words and short sentences. Avoid corporate filler, hype adjectives, and AI clichés. Keep your organization faithful to what `you` actually said: clarity without inflation.

## What This Skill Owns

- **Owns:** `docs/scope/idea.md` (or `.workflow/scope/idea.md` only if `docs/` is an active documentation site such as VitePress, Docusaurus, MkDocs, Starlight, or Nextra).
- **Never writes:** `docs/scope/SCOPE.md` (`/scope`), `docs/scope/plans/*` (`/architect`), or application code (`/develop`).

## Hard Fidelity Rules (Zero Bloat, Zero Tech Stack)

1. **Never invent features:** Organize only what `you` expressed or directly implied. Do not sneak in authentication, admin panels, analytics, notifications, billing, dark mode, or team collaboration unless `you` mentioned them.
2. **Never pick a tech stack:** Do not choose or suggest frameworks, databases, ORMs, UI kits, or hosting providers. That belongs to `/architect`. If `you` explicitly stated a constraint in the dump (for example, "must run offline as a CLI" or "using my existing Postgres DB"), record it verbatim under **Stated Constraints** without adding extra tools.
3. **Preserve intent & vibe:** If `you` described a small weekend toy or personal script, keep it feeling like a small weekend tool—never rewrite it to sound like a VC-backed SaaS platform.
4. **Chat first, file second:** Never write `docs/scope/idea.md` on the first turn. Present the structured draft in chat, iterate until `you` confirm it stays true to what `you` want, and only then save to disk.

---

## Execution

### Step 0: Intake & Existing File Check

1. Check if `docs/scope/idea.md` already exists on disk:
   - **Exists + new dump provided:** Read the existing file so you can merge or refine without losing prior context, and note that an existing `idea.md` was found.
   - **Exists + no input provided:** Read `docs/scope/idea.md`, show a 3-line summary of what is currently captured, and ask whether to refine it or replace it with a fresh brain dump.
   - **Does not exist + no input provided:** Stop and ask warmly before doing anything else:
     > *"What are you thinking of building? Drop your raw brain dump, bullet list, or messy notes here—half-baked thoughts and tangents are welcome."*
     Wait for the answer.

### Step 1: Organize Faithfully in Chat

Read the raw dump carefully. Sort what `you` said—and nothing extra—into this exact chat structure:

- **One-Liner:** One plain sentence stating what the project is and who it is for.
- **Problem / Purpose:** 2–4 short sentences on why this exists, what itch it scratches, or what job it does.
- **Core Must-Haves:** Bullet list of the essential capabilities `you` described as the heart of the idea.
- **Nice-to-Haves / Later:** Bullet list of stretch ideas, "maybe later" thoughts, or secondary polish mentioned in the dump (write `None mentioned yet` if the dump was purely core).
- **Stated Constraints** *(include only if `you` explicitly stated constraints such as platform, deadline, offline use, or an already-chosen tool)*: Verbatim constraints from the dump.
- **Open Questions (Max 3, omit if clear):** Ask **1 to 3** brief questions *only* if something in the dump is genuinely contradictory or too vague to tell what the product does. If the dump is already clear, omit this section completely—never manufacture filler questions.

### Step 2: Confirm & Iterate Gate

Right after showing the organized summary in chat (and any Open Questions), ask for confirmation using your runtime's interactive question tool (`ask_question`, `AskUserQuestion`, `question`, `request_user_input`), or plain text options if no picker exists:

- **Header:** `Idea Check`
- **Question:** *"Does this stay true to what you want to build?"*
- **Options:**
  1. `(Recommended) Yes, save to docs/scope/idea.md` — Captures my idea accurately; write the file. *(If Open Questions were asked, include an option to answer them inline or accept sensible defaults.)*
  2. `Tweak Core vs. Later split` — Move items between Must-Haves and Nice-to-Haves, or cut something.
  3. `Add or clarify details` — Let me add missing thoughts or answer the open questions first.

If `you` request tweaks, answer open questions, or add new thoughts:
- Update the organized draft in chat (folding resolved Open Questions into the relevant sections and dropping answered questions).
- Present the updated draft and confirmation gate again until `you` confirm saving.

### Step 3: Write `docs/scope/idea.md` & Hand Off

Once confirmed:
1. Format the finalized brief cleanly using [Idea Template](references/idea-template.md) and write it to `docs/scope/idea.md`.
2. Verify the file was written on disk.
3. Output the concise completion block:

```markdown
## /idea-dump complete · <Project Name or One-Line Topic>

Saved clean idea brief to `docs/scope/idea.md` (<N> core must-haves, <M> nice-to-haves).
Next: run `/clear` if this chat got long (your idea is safely on disk), then run:
`/scope docs/scope/idea.md`
```

`/idea-dump` stops here. Do not automatically start `/scope`.

---

## References

- [Idea Template](references/idea-template.md) — Canonical markdown structure and writing rules for `docs/scope/idea.md`.
