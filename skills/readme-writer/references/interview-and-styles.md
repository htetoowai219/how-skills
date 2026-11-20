# Interview Script, Formatting Options & Style Specifications

This guide governs the two-round interactive grill between the agent and the user. It defines what to audit silently before speaking, how to ask formatting choices in Round 1, how to interview for substance in Round 2 based on the selected style, and how to push back against vague or marketing copy.

---

## 1. Pre-Interview Rules: What NOT to Ask

Never ask the user for information already visible in repository files:
- **Language, runtime & package manager:** Detected from `package.json`, `pnpm-lock.yaml`, `bun.lockb`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `requirements.txt`, `Gemfile`, etc.
- **Commands & Scripts:** Detected from `package.json` `"scripts"`, `Makefile`, `Taskfile.yml`, `justfile`.
- **Ports & Environment Variables:** Detected from `.env.example`, `.env.sample`, `docker-compose.yml`, or config modules.
- **Docker Services & Images:** Detected from `Dockerfile` and `docker-compose.yml`.
- **Existing Images & Screenshots:** Detected by scanning `assets/`, `public/`, `docs/images/`, `.github/`, `screenshots/`.
- **License:** Detected from `LICENSE`, `LICENSE.md`, or package manifests.

---

## 2. Round 1 — Style, Structure & Visual Formatting Grill

Before presenting Round 1, print a concise 3-line disk summary:
```text
Inspected repository:
• Detected: [Archetype & Tech, e.g. Node.js + Express + TypeScript, Docker Compose (Postgres, Redis)]
• Existing assets: [e.g. Logo found at assets/logo.svg, no screenshots found]
• Configuration: [e.g. 6 required env vars in .env.example, Prisma migration script found]
```

Then present the 6 Round 1 questions with your recommended default for each:

1. **README Style** *(Recommended: [infer from repo size and structure])*:
   - `Casual` — Relaxed hobby/personal tool tone; quick setup, optional short backstory (~80–140 lines).
   - `Technical` — Hackathon/portfolio showcase; spotlights engineering decisions, architecture, and trade-offs (~120–200 lines).
   - `Detailed` — Production/team system; full architecture overview, split configuration, deployment, and operational runbook (~160–260 lines).
2. **Emojis in Section Headings & Lists** *(Recommended: None)*:
   - `None` — Pure text headers, clean and restrained (default).
   - `Headings only` — Exactly one tasteful emoji at the start of each `## ` section heading.
   - `Headings + features` — Heading emojis plus leading icon bullets on Key Features.
3. **Hero Layout & Visuals** *(Recommended: Centered)*:
   - Alignment: `Centered` (centered title, subtitle, badges, and logo) vs. `Left-aligned`.
   - Visuals: Use detected image, provide an external image/demo GIF URL, or use text-only?
   - Quick Links: Any live demo URL, video walkthrough, or documentation link to feature in the hero?
4. **Badges** *(Recommended: Minimal flat-square)*:
   - `Minimal flat-square` — 3 to 4 neutral, verified badges (license, runtime version, CI status if present).
   - `Standard shields` — Colored shields.io badges.
   - `None` — No badges.
5. **Secondary Details Strategy** *(Recommended: Collapsible `<details>`)*:
   - `Collapsible <details>` — Fold long env tables, project layout trees, or alternate run commands.
   - `Link to docs/` — Keep README ultra-lean and link out to files in `docs/`.
   - `Inline` — Show all content directly without folding.
6. **Conditional Setup Preference** *(Only ask if relevant)*:
   - *If Docker Compose exists:* Make Docker the primary Quick Start step, or keep local dev primary and put Docker in its own `## Docker Setup` section? *(Recommended: Local dev primary unless full-stack compose is present)*
   - *If an existing README exists:* Full rewrite from scratch (preserving live URLs & credits), or preserve specific custom sections? *(Recommended: Full rewrite preserving verified live links)*

**Fast-Path Prompt:** End Round 1 with:  
> *"Reply with your choices (e.g., `Technical, Headings only, defaults for 3-6`) or reply `defaults` to accept all recommendations."*

---

## 3. Round 2 — Style-Specific Content Grill

After the user locks in their style and formatting in Round 1, ask 3 to 5 targeted substance questions from the corresponding bank below. Skip any question already answered in previous turns.

### Style A: `Casual` (Hobby / Personal Tool)
*Tone: Relaxed, authentic first-person developer voice ("I built this because...", "Tested on Linux; macOS should work too").*

1. **Origin Backstory (Optional):** Do you want a short `## Why I Built This` section (2–3 sentences)? If yes, what specific frustration, missing tool, or curiosity prompted it?
2. **Daily Driver Usage:** How do you personally use this tool day-to-day, or what is the single most useful command/workflow someone should try first?
3. **Known Quirks & Rough Edges:** Are there known quirks, platform assumptions, or unfinished corners someone cloning the repo should be aware of?
4. **Exclusions:** Anything specific you want explicitly omitted so the README stays lightweight and informal?

**Casual Section Plan:**  
`Hero -> Quick Start -> Why I Built This (optional) -> What It Does (3–5 bullets) -> Configuration (if env exists) -> Docker (only if present) -> Common Commands -> License`

---

### Style B: `Technical` (Hackathon / Serious Portfolio Showcase)
*Tone: Engineer-to-engineer; precise, direct, zero buzzwords. Explains not just what the app does, but why it was engineered that way.*

1. **Primary Spotlight:** Should the extra technical depth highlight the **problem being solved**, the **internal architecture/implementation**, or an even balance of both?
2. **Hardest Engineering Pieces:** What were the 1 to 3 trickiest technical challenges or deliberate decisions worth explaining (e.g., locking/concurrency, cache invalidation, state sync, database indexing, background queues, rate limits)?
3. **Reviewer Fast-Path:** Is there a live demo URL, video walkthrough, or pre-seeded test account (e.g., `admin@example.com / password123`) reviewers should use immediately after booting?
4. **Deliberate Trade-Offs:** Were there intentional architectural trade-offs or scope cuts (e.g., "In-memory stores used over distributed cache for single-node simplicity") that show conscious design?
5. **Roadmap (Optional):** Want a concise 3-item `## Next Up` list, or keep it strictly to what is currently implemented?

**Technical Section Plan:**  
`Hero (with quick links) -> Quick Start (with seed/demo login) -> Key Features -> How It Works / Engineering Notes -> Docker Setup (conditional) -> Configuration (conditional) -> Tech Stack & Layout -> Common Commands -> Roadmap (optional) -> License`

---

### Style C: `Detailed` (Commercial / Team / Production System)
*Tone: Authoritative, neutral technical documentation. Unambiguous prerequisites, port mappings, and operational clarity.*

1. **Primary Target Audience:** Who is the first reader—engineers onboarding to develop locally, DevOps deploying the service, or external client reviewers?
2. **External Dependencies & Third-Party Setup:** What external accounts or credentials are required before the app fully runs (OAuth applications, webhooks, Stripe keys, S3 buckets, SMTP)?
3. **Architecture & Boundaries:** Are there distinct background workers, queues, multi-tenant boundaries, or microservice integrations that need a short component table or ASCII data flow?
4. **Deployment & Environment Targets:** What is the target runtime deployment (Docker Compose, Kubernetes, AWS/GCP, PaaS) and are there critical env differences (dev vs. staging vs. prod)?
5. **Operational Gotchas & Runbooks:** Any database migration rules, port collisions, backup procedures, or security gotchas an engineer needs on day one?

**Detailed Section Plan:**  
`Hero -> Quick Start -> Architecture Overview -> Docker & Deployment -> Configuration (Required vs. Optional split) -> Tech Stack & Project Structure -> Development, Testing & Commands -> Operational Notes / Troubleshooting -> License`

---

## 4. Pushback & Anti-Fluff Rules

1. **The Vague Answer Pushback:** If the user responds with an abstract or marketing-style answer (e.g., *"It makes data processing faster and more reliable"*), do not write buzzwords into the README. Push back once politely with a concrete prompt:  
   > *"To make that compelling to technical readers: faster than what, and how? (e.g., batch SQL queries instead of N+1 fetches, or streaming worker threads?)"*
2. **One-Round Pushback Limit:** If the user remains brief or declines deeper detail, accept their answer immediately. Never trap the user in multiple clarification turns.
3. **The Skip/Defaults Fast-Path:** If the user inputs *"skip questions"*, *"use defaults"*, or *"just generate it"*, skip Round 2 immediately and draft using sensible defaults:
   - Style: inferred from codebase archetype.
   - Emojis: `None`.
   - Hero: `Centered`.
   - Badges: `Minimal flat-square`.
   - Details: `<details>` for secondary tables.
