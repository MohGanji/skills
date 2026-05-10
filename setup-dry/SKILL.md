---
name: setup-dry
description: One-time setup skill that adds structural duplication detection via pre-commit hook and CI. Configures DRY violation checks using AST fingerprinting and Jaccard similarity. Use when user wants automated duplicate code detection.
---

# Setup DRY

One-time guided setup. Adds DRY violation detection at both CI and pre-commit hook level. Defaults to setting up both -- confirms with user before proceeding.

## Workflow

### Step 1 -- Detect project setup

- [ ] Identify primary language(s) from file extensions and config files
- [ ] Identify source directories (e.g. `src/`, `lib/`, `app/`)
- [ ] Check for existing duplication detection tools (e.g. jscpd, PMD CPD)
- [ ] Check if `.github/workflows/` already exists

Present findings to user for confirmation before proceeding.

If detection is ambiguous, use `AskUserQuestion` to clarify:
- If language can't be determined: ask what language(s) the project uses
- If no clear source directories: ask which directories contain production code (vs. config, scripts, etc.)
- If existing duplication tools found: ask if they want to replace or run alongside

### Step 2 -- Ask user preferences

Use `AskUserQuestion` for each:

1. **Where to enforce** -- default is both, confirm with user:
   - **Both CI and pre-commit hook** (recommended)
   - **CI only** -- GitHub Actions workflow
   - **Pre-commit hook only** -- local enforcement
2. **Similarity threshold** -- minimum Jaccard similarity to flag as duplicate
   - Suggest **0.8** (80% structural similarity)
   - User can raise/lower
3. **Minimum block size** -- smallest code block to consider
   - Suggest **5 lines** -- ignore trivially small matches
   - User can adjust
4. **CI enforcement mode** (if CI selected):
   - **Fail the check** (recommended) -- PR cannot merge on new duplicates
   - **Warn only** -- post a comment but don't block

### Step 3 -- Generate files

- [ ] If CI selected: generate `.github/workflows/dry-check.yml`
- [ ] If pre-commit hook selected: write hook script to `.git/hooks/pre-commit` (or append to existing) and make it executable
- [ ] Hook should run DRY analysis on staged files against the existing codebase

### Step 4 -- Verify

- [ ] Read back generated files and sanity-check them
- [ ] Show the user what was generated for review
- [ ] Run a sample DRY check as a smoke test

## Key rules

- Never overwrite existing workflow files or hooks without asking
- Idempotent -- running again detects existing setup and skips
