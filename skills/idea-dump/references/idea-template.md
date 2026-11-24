# Idea Brief Template (`docs/scope/idea.md`)

Use this exact markdown shape when saving `docs/scope/idea.md` after confirmation in chat.

```markdown
# Idea: <Short Working Title>

**Date:** YYYY-MM-DD

## One-Liner
<One plain, concrete sentence describing what this project is and who uses it.>

## Problem / Purpose
<2 to 4 short sentences explaining why this project exists, what problem or annoyance it solves, or what goal/learning outcome it serves.>

## Core Must-Haves
- <Essential capability 1 — phrased as what a user can do or what the tool does>
- <Essential capability 2>
- <Essential capability N>

## Nice-to-Haves / Later
- <Stretch capability or secondary polish mentioned for later>
<!-- If none were mentioned, write: "- None specified yet." -->

## Stated Constraints
<!-- Include this section ONLY if the user explicitly stated constraints in their dump (e.g. "desktop CLI", "mobile browser friendly", "must work offline", "weekend build", or an explicitly named stack requirement). Omit this entire section if none were stated. -->
- <Explicit constraint stated by the user>

## Open Notes
<!-- Include ONLY if the user chose to leave an open question unresolved for /scope or /architect. Omit this entire section once all questions are resolved. -->
- <Unresolved question to settle during scoping or architecture>
```

## Writing Guardrails for `idea.md`

- **Keep every bullet behavioral, not architectural:** Write *"Save bookmarks with tags and filter by tag"* rather than *"PostgreSQL `bookmarks` and `tags` join table with REST endpoints"*.
- **No silent feature creep:** Every bullet in `Core Must-Haves` and `Nice-to-Haves / Later` must trace back to something the user actually said or confirmed during the chat loop.
- **Keep it scannable:** The entire `idea.md` should typically be 25–60 lines so `/scope` and `/architect` can read it cheaply on every phase.
