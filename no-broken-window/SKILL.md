---
name: no-broken-window
description: Detect, establish, and enforce codebase patterns so one violation doesn't erode the standard. Use when user discusses a rule, pattern, or convention they want uniform across the codebase, wants to unify inconsistent behavior, mentions enforcing a standard, preventing drift, or keeping things consistent, or invokes /no-broken-window.
---

# No Broken Windows

One broken window nobody repairs turns into ten. One hack nobody removes turns into the pattern.

## Quick start

User: "Some components import from `stores/` directly, some don't — I want consistency."

1. Scan codebase, report: "14 components import stores, 6 don't"
2. Propose rule: "Only container components import from `stores/`"
3. Resolve grey areas, then enforce via lint rule
4. Document in CONTEXT.md

## Workflows

### 1. Identify the pattern

- [ ] Clarify the rule in one sentence (e.g., "Leaf components never import from `stores/`")
- [ ] Find existing violations by scanning the codebase
- [ ] Present: current state (how many comply vs violate), and the exact boundary

### 2. Collaborate on the standard

- [ ] Propose the rule with concrete examples (what's allowed, what's not)
- [ ] Identify grey areas and resolve them with the user
- [ ] Write the rule as a single enforceable statement

### 3. Enforce it

Attempt enforcement in this priority order:

1. **Lint rule** (preferred) — ESLint, Biome, or similar. Catches at dev time.
2. **Pre-commit hook** — script that checks the pattern. Catches at commit time.
3. **CI check** — GitHub Action or similar. Catches at PR time.
4. **Documentation only** — if the rule can't be automated, document in CONTEXT.md or an ADR.

For each enforcement option:
- [ ] Draft the rule/script/config
- [ ] Show the user what it catches and what it allows
- [ ] Get user confirmation before applying
- [ ] Fix existing violations (or create an issue to track them)

### 4. Document

- [ ] Add the rule to `CONTEXT.md` under a "Conventions" section (create if needed)
- [ ] If the rule involved a real trade-off between alternatives, offer an ADR

## Key principles

- **One rule, one sentence.** If you can't state it in one sentence, it's too vague to enforce.
- **Automate or it will rot.** A rule without a linter is a suggestion.
- **Fix existing violations.** Clean up first or create a tracked issue — don't establish a rule the codebase already breaks in 20 places.
- **Grey areas are bugs in the rule.** If two people could reasonably disagree on whether code violates the rule, the rule needs sharpening.
