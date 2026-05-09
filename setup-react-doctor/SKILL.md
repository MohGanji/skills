---
name: setup-react-doctor
description: One-time setup skill that adds React performance and pattern analysis via pre-commit hook and CI. Detects React usage, configures react-doctor checks for component anti-patterns, unnecessary re-renders, and performance issues. Use when user wants automated React quality enforcement.
---

# Setup React Doctor

One-time guided setup. Adds react-doctor analysis at both CI and pre-commit hook level. Defaults to setting up both -- confirms with user before proceeding.

## Workflow

### Step 1 -- Detect project setup

- [ ] Confirm the project uses React (check for `react` in `package.json` dependencies)
- [ ] Identify component directories (e.g. `src/components/`, `app/`, `pages/`)
- [ ] Check for existing ESLint React rules or other React linting
- [ ] Check if `.github/workflows/` already exists

Present findings to user for confirmation before proceeding.

### Step 2 -- Ask user preferences

Use `AskUserQuestion` for each:

1. **Where to enforce** -- default is both, confirm with user:
   - **Both CI and pre-commit hook** (recommended)
   - **CI only** -- GitHub Actions workflow
   - **Pre-commit hook only** -- local enforcement
2. **Scope** -- what to analyze:
   - **Changed files only** (recommended for pre-commit) -- fast, focused
   - **Full project scan** (recommended for CI) -- comprehensive
3. **CI enforcement mode** (if CI selected):
   - **Fail the check** (recommended) -- PR cannot merge
   - **Warn only** -- post a comment but don't block

### Step 3 -- Generate files

- [ ] If CI selected: generate `.github/workflows/react-doctor.yml`
- [ ] If pre-commit hook selected: write hook script to `.git/hooks/pre-commit` (or append to existing) and make it executable
- [ ] Hook should only run react-doctor on staged `.tsx`/`.jsx` files

### Step 4 -- Verify

- [ ] Read back generated files and sanity-check them
- [ ] Show the user what was generated for review
- [ ] Run react-doctor on a sample component as a smoke test

## Key rules

- Skip setup entirely if the project doesn't use React -- inform user and exit
- Never overwrite existing workflow files or hooks without asking
- Idempotent -- running again detects existing setup and skips
