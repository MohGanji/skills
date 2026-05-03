---
name: setup-crap-check-github-actions
description: One-time setup skill that adds a GitHub Actions workflow to measure CRAP scores on PRs and branches. Detects repo language and test framework, asks user about triggers and thresholds, generates the workflow YAML and bundles the CRAP calculator script. Use when user wants to add CRAP checks to CI, set up CRAP GitHub Actions, or enforce CRAP thresholds on pull requests.
---

# Setup CRAP Check -- GitHub Actions

One-time guided setup. Adds a CI workflow that calculates CRAP scores and enforces a threshold.

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

1. **Trigger events** -- when should the CRAP check run?
   - `pull_request` targeting main/master (recommended default)
   - `push` to main/master
   - `schedule` (e.g. weekly)
   - `workflow_dispatch` (manual)
   - User can pick multiple
2. **CRAP threshold** -- max acceptable score per function
   - Suggest **30** (the standard threshold from the CRAP paper)
   - User can raise/lower
3. **Enforcement mode** -- what happens when threshold is exceeded?
   - **Fail the check** (recommended) -- PR cannot merge
   - **Warn only** -- post a comment but don't block

### Step 3 -- Generate files

- [ ] Run `python3 scripts/generate_workflow.py` with the collected parameters to produce the workflow YAML
- [ ] Write output to `.github/workflows/crap-check.yml`
- [ ] Copy `crap_score.py` from the `cut-the-crap` skill into the repo at `scripts/crap_score.py`
- [ ] If `.gitignore` doesn't already ignore coverage artifacts, suggest additions (e.g. `coverage/`, `*.info`, `coverage.json`)

### Step 4 -- Verify

- [ ] Read back the generated workflow YAML and sanity-check it
- [ ] Confirm test + coverage commands match the detected framework
- [ ] Show the user the full generated workflow for review
- [ ] Suggest a dry-run: `act` locally or push a test branch

## Key rules

- Never overwrite an existing workflow file without asking
- Always confirm detected test/coverage commands with user before generating
- The `crap_score.py` committed to the repo must be self-contained (no external deps beyond Python stdlib)
- If the project uses a monorepo or multiple languages, generate separate jobs per language

## Script

The bundled `scripts/generate_workflow.py` produces the workflow YAML deterministically. See [REFERENCE.md](REFERENCE.md) for per-language CI snippets and coverage tool details.
