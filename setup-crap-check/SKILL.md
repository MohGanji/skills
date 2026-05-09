---
name: setup-crap-check
description: One-time setup skill that adds CRAP score enforcement via GitHub Actions CI and pre-commit hook. Detects repo language and test framework, asks user about thresholds, generates the workflow YAML and hook script. Use when user wants to enforce CRAP score thresholds on their codebase.
---

# Setup CRAP Check

One-time guided setup. Adds CRAP score enforcement at both CI and pre-commit hook level. Defaults to setting up both -- confirms with user before proceeding.

## Workflow

### Step 1 -- Detect project setup

- [ ] Identify primary language(s) from file extensions and config files
- [ ] Identify test framework (pytest, jest, vitest, go test, maven, gradle, etc.)
- [ ] Identify existing coverage config (`.coveragerc`, `jest.config`, `nyc` in package.json, `jacoco` in pom.xml, etc.)
- [ ] Identify source directories (e.g. `src/`, `lib/`, `app/`, `.` for Go)
- [ ] Check if `.github/workflows/` already exists

Present findings to user for confirmation before proceeding.

### Step 2 -- Ask user preferences

Use `AskUserQuestion` for each:

1. **Where to enforce** -- default is both, confirm with user:
   - **Both CI and pre-commit hook** (recommended)
   - **CI only** -- GitHub Actions workflow
   - **Pre-commit hook only** -- local enforcement
2. **CRAP threshold** -- max acceptable score per function
   - Suggest **30** (the standard threshold from the CRAP paper)
   - User can raise/lower
3. **CI enforcement mode** (if CI selected) -- what happens when threshold is exceeded?
   - **Fail the check** (recommended) -- PR cannot merge
   - **Warn only** -- post a comment but don't block
4. **CI trigger events** (if CI selected):
   - `pull_request` targeting main/master (recommended default)
   - `push` to main/master
   - `schedule` (e.g. weekly)
   - `workflow_dispatch` (manual)
   - User can pick multiple

### Step 3 -- Generate files

- [ ] If CI selected: run `python3 scripts/generate_workflow.py` with the collected parameters to produce the workflow YAML
- [ ] Write output to `.github/workflows/crap-check.yml`
- [ ] Copy `crap_score.py` from the `cut-the-crap` skill into the repo at `scripts/crap_score.py`
- [ ] If pre-commit hook selected: write the hook script to `.git/hooks/pre-commit` (or append to existing) and make it executable
- [ ] If `.crapignore` doesn't exist, ask user if they want one and create it with sensible defaults for their language (e.g. `node_modules/`, `dist/`, `.venv/`, test fixtures)
- [ ] If `.gitignore` doesn't already ignore coverage artifacts, suggest additions (e.g. `coverage/`, `*.info`, `coverage.json`)

### Step 4 -- Verify

- [ ] Read back generated files and sanity-check them
- [ ] Confirm test + coverage commands match the detected framework
- [ ] Show the user what was generated for review
- [ ] Suggest a dry-run: `act` locally or push a test branch

## Key rules

- Never overwrite existing workflow files or hooks without asking
- Always confirm detected test/coverage commands with user before generating
- The `crap_score.py` committed to the repo must be self-contained (no external deps beyond Python stdlib)
- If the project uses a monorepo or multiple languages, generate separate jobs per language

## Script

The bundled `scripts/generate_workflow.py` produces the workflow YAML deterministically. See [REFERENCE.md](REFERENCE.md) for per-language CI snippets and coverage tool details.
