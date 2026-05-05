---
name: cut-the-crap
description: Calculate CRAP (Change Risk Anti-Patterns) scores for functions in a codebase, identify high-risk methods, propose refactoring and test improvements, estimate new scores, and implement fixes after user approval. Use when user mentions CRAP score, code risk, wants to reduce complexity, improve testability, or says "cut the crap".
---

# Cut the CRAP

## What is CRAP?

CRAP (**C**hange **R**isk **A**nti-**P**atterns) measures how risky a function is to change. It combines two factors: **cyclomatic complexity** (how many branches/paths) and **test coverage** (how much is exercised by automated tests).

**Formula**: `CRAP(m) = comp(m)^2 * (1 - cov(m)/100)^3 + comp(m)`

**Reading the score**:
- **1** -- trivial function, well tested. No risk.
- **< 30** -- acceptable. Safe to change.
- **> 30** -- CRAPpy. Too complex for its test coverage. High risk of breaking when modified.

A function with 0% coverage only needs complexity > 5 to be CRAPpy. A function with 100% coverage can have complexity up to 30 before crossing the threshold. The metric rewards either simplifying code or testing it -- ideally both.

## Workflow

### Phase 1 -- Measure

- [ ] Detect project language(s) and test framework
- [ ] Check for existing coverage reports; if absent, run tests with coverage (see [REFERENCE.md](REFERENCE.md) for per-language commands)
- [ ] Run `python3 scripts/crap_score.py <src> -c <coverage_file> -f json --base-dir <project_root>`
- [ ] Parse JSON output; sort by worst CRAP score

### Phase 2 -- Diagnose

For each function where `crap_score > 30`:

- [ ] Read the function source
- [ ] Identify complexity drivers (nested branches, long switch/case, boolean chains)
- [ ] Identify coverage gaps (untested branches, missing edge cases)
- [ ] Propose specific actions (one or more):
  - **Reduce complexity**: extract helper, replace conditional with polymorphism, simplify boolean logic, early returns
  - **Increase coverage**: write targeted tests for uncovered branches
- [ ] Estimate new complexity + coverage after each proposed change
- [ ] Calculate projected CRAP score: `comp^2 * (1 - cov/100)^3 + comp`

### Phase 3 -- Report

Present a table to the user:

```
| Function | Current CRAP | Complexity | Coverage | Proposed CRAP | Actions |
```

Include totals: functions analysed, CRAPpy count before/after, overall improvement %.
Ask user to confirm which functions to fix (all, subset, or skip).

### Phase 4 -- Cut

After user confirms:

- [ ] Implement refactoring changes (one function at a time, commit-ready)
- [ ] Write or extend tests to cover new/changed code
- [ ] Re-run coverage + CRAP script to verify scores dropped
- [ ] Present before/after comparison

## .crapignore

The script respects a `.crapignore` file in the project root (same directory as `--base-dir`). Syntax is gitignore-like:

```
# Ignore generated code
generated/
*.gen.go

# Ignore test helpers (not production code)
testutil/
*_testutil.py

# But keep this one
!testutil/important.py
```

Blank lines and `#` comments are ignored. `!` negates a previous match. Patterns without `/` match against filenames and directory names. Patterns with `/` match against the full relative path.

## Key rules

- Never refactor without re-running tests to confirm nothing broke
- Keep refactoring minimal -- only what's needed to cut the CRAP score
- If a function is complex but 100% covered, flag it but don't force refactoring (CRAP = complexity alone at full coverage)
- If coverage tool isn't available, install it (with user permission) or fall back to complexity-only analysis with 0% coverage assumption

## Script

The bundled `scripts/crap_score.py` handles: cyclomatic complexity (AST for Python, heuristic for JS/TS/Java/Go), coverage parsing (lcov, coverage.py JSON, istanbul JSON, Cobertura XML), CRAP calculation, and `.crapignore` filtering. See [REFERENCE.md](REFERENCE.md) for details.
