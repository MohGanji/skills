---
name: dry
description: Find structural duplicate code (DRY violations) across a Python or JS/TS codebase using normalized AST fingerprinting, report candidates with similarity scores, and refactor them after user approval. Use when user mentions DRY, duplicate code, copy-paste code, structural duplication, or says "dry".
---

# DRY — Don't Repeat Yourself

## What it detects

Two functions can look different in naming and literal values yet share identical *structure*. This skill finds those structural duplicates by normalising each function's AST — replacing variable names with `:symbol`, literals with `:literal`, and preserving only the skeleton (control flow, collection shapes, call patterns). It then compares every pair of functions via **Jaccard similarity** over their fingerprint sets.

A score of `1.0` means two functions are structurally identical despite different names and values. The default threshold of `0.82` catches candidates close enough to warrant review.

**Supported languages**: Python, JavaScript, TypeScript (including JSX/TSX).

## Workflow

### Phase 1 — Scan

- [ ] Detect project language(s) from file extensions
- [ ] Run `python3 scripts/dry_check.py <src> -f json --base-dir <project_root>`
- [ ] Parse JSON output; sort by worst similarity score

### Phase 2 — Review

For each candidate pair above the threshold:

- [ ] Read both functions side by side
- [ ] Classify the duplication:
  - **Exact structural clone** (score ~1.0): identical shape, only names differ
  - **Near clone** (score 0.90–0.99): one has a small extra branch or binding
  - **Fuzzy match** (score 0.82–0.89): shared core with divergent details
- [ ] Determine if the duplication is **accidental** (coincidence, leave alone) or **essential** (same concept expressed twice, should unify)
- [ ] For essential duplicates, propose a refactoring:
  - Extract shared logic into a common function with parameters for the differing parts
  - Use higher-order functions or strategy pattern when behaviour varies
  - For near-clones, identify the delta and parameterise it

### Phase 3 — Report

Present a table to the user:

```
| # | Score | Left | Right | Classification | Proposed action |
```

Include totals: functions scanned, duplicate pairs found, score distribution.
Ask user to confirm which pairs to refactor (all, subset, or skip).

### Phase 4 — Refactor

After user confirms:

- [ ] Extract common function (one pair at a time, commit-ready)
- [ ] Replace both call sites with the new unified function
- [ ] Run existing tests to confirm nothing broke
- [ ] Re-run `dry_check.py` to verify the pair no longer appears
- [ ] Present before/after comparison

## .dryignore

The script respects a `.dryignore` file in the project root (same directory as `--base-dir`). Syntax is gitignore-like:

```
# Ignore generated code
generated/
*.gen.ts

# Ignore test fixtures
__fixtures__/
*_fixture.py

# But keep this one
!__fixtures__/important_fixture.py
```

Blank lines and `#` comments are ignored. `!` negates a previous match.

## Key rules

- Never refactor without running tests to confirm nothing broke
- Keep refactoring minimal — only unify what's genuinely duplicated
- If two functions score high but serve intentionally different domains, flag but don't force unification — some duplication is acceptable when coupling would be worse
- Accidental similarity (e.g. two simple CRUD handlers) is not a DRY violation — use judgement
- Default thresholds are conservative; lower `--threshold` for broader sweeps, raise it for precision
- The script auto-skips `node_modules`, `.git`, `__pycache__`, `venv`, `dist`, `build`, and similar directories

## Script

The bundled `scripts/dry_check.py` handles: Python AST parsing (via stdlib `ast`), JS/TS token-based structural parsing, normalisation, fingerprinting, Jaccard similarity, `.dryignore` filtering, and text/JSON output. Zero external dependencies. See [REFERENCE.md](REFERENCE.md) for algorithm details and CLI usage.
