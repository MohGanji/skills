---
name: bootstrap-agentic-repo
description: One-time meta skill that sets up a repository with all agent skills and walks through interactive setup. Installs internal skills from mohganji/skills, external skills from their source repos, and offers setup skills based on the detected stack. Use when user says "bootstrap", "set up this repo for agents", or "install all skills".
---

# Bootstrap Agentic Repo

One-time setup that turns any repo into a fully-equipped agentic workspace. Installs skills, runs setup wizards, and verifies the result.

## Phase 1 -- Assess

- [ ] Detect primary language(s) from file extensions and config files
- [ ] Detect frameworks (React, Next.js, Django, Rails, etc.)
- [ ] Check for existing CI setup (`.github/workflows/`, `.gitlab-ci.yml`, etc.)
- [ ] Check for existing skills (`ls ~/.claude/skills/` or `.skills/`)
- [ ] Check for existing `CLAUDE.md` and note what's already configured
- [ ] Present findings to user and ask them to confirm or correct

If detection is ambiguous or the repo is barebones (no config files, no clear framework), use `AskUserQuestion` to ask:
- What language(s) does this project use?
- What framework(s) if any?
- What test framework and runner?
- What CI platform (GitHub Actions, GitLab CI, none)?

Never guess -- always confirm with the user when uncertain.

## Phase 2 -- Install skills

Install the internal skills repo and each external skill source:

```bash
# Internal skills (this repo)
npx skills@latest add mohganji/skills

# External skill sources
npx skills@latest add mattpocock/skills
npx skills@latest add browser-use/browser-harness
npx skills@latest add remotion-dev/remotion
```

Only install stack-specific external skills if the stack was detected or confirmed in Phase 1:

```bash
# Only if project uses React
npx skills@latest add millionco/react-doctor
```

- [ ] Run each install command
- [ ] Report any failures and continue with remaining installs
- [ ] List all successfully installed skills
- [ ] Ask user if they want a `remotion-videos/` directory created in the repo root for Remotion projects. If yes, create it with a `.gitkeep`.

## Phase 3 -- Run setup skills

Based on the stack detected in Phase 1, interactively offer one-time setup skills. Each setup skill owns its own CLAUDE.md section -- bootstrap does not write CLAUDE.md directly.

Use `AskUserQuestion` to let the user pick which setup skills to run:

1. **setup-caveman** -- Set caveman as default communication style
2. **setup-crap-check** -- Add CRAP score enforcement via CI and pre-commit hook
3. **setup-dry** -- Add DRY violation detection via CI and pre-commit hook
4. **setup-react-doctor** -- Add React performance analysis via CI and pre-commit hook (if project uses React)
5. **setup-matt-pocock-skills** -- Configure issue tracker, triage labels, domain docs (from mattpocock/skills)

Run each selected setup skill in order. Wait for each to complete before offering the next.

## Phase 4 -- Verify and summarize

- [ ] List all installed skills with `ls ~/.claude/skills/*/SKILL.md`
- [ ] Show what was configured by setup skills (CLAUDE.md sections, CI workflows, etc.)
- [ ] Suggest next steps:
  - Try a skill: `/cut-the-crap`, `/tdd`, `/caveman`
  - Read the skills README for the full catalog
  - Run `/write-a-skill` to create custom skills for this project

## Key rules

- Never modify CLAUDE.md directly -- defer to setup skills
- Always show the user what will be installed before running installs
- If a skill is already installed, skip it and note that it's current
- If an install fails, continue with the rest and report failures at the end
- This skill is idempotent -- running it again skips already-installed skills
