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
- [ ] Summarize findings to user before proceeding

## Phase 2 -- Install skills

Install the internal skills repo and each external skill source:

```bash
# Internal skills (this repo)
npx skills@latest add mohganji/skills

# External skill sources
npx skills@latest add mattpocock/skills
npx skills@latest add browser-use/browser-harness
npx skills@latest add millionco/react-doctor
```

- [ ] Run each install command
- [ ] Report any failures and continue with remaining installs
- [ ] List all successfully installed skills

## Phase 3 -- Run setup skills

Based on the stack detected in Phase 1, interactively offer one-time setup skills. Each setup skill owns its own CLAUDE.md section -- bootstrap does not write CLAUDE.md directly.

Use `AskUserQuestion` to let the user pick which setup skills to run:

1. **setup-caveman-default** -- Set caveman as default communication style and add git rules
2. **setup-crap-check-github-actions** -- Add CRAP score CI workflow (if repo has CI)
3. **setup-matt-pocock-skills** -- Configure issue tracker, triage labels, domain docs (from mattpocock/skills)

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
