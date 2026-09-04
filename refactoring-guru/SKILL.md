---
name: refactoring-guru
description: Refactoring review using refactoring.guru's methodology — sweep changed code against the full code-smell catalog, prescribe treatments from the refactoring catalog, and suggest a design pattern only when justified. Use when asked for a refactoring review, to find code smells, to hunt technical debt in a PR/MR or local changes, or when another skill needs the smell→treatment vocabulary.
---

# Refactoring Guru

Review code the way refactoring.guru teaches: find **smells**, prescribe **treatments**, respect **timing**. This skill reports and recommends — it never edits code.

The methodology is language-agnostic. Read the catalogs' OO vocabulary as concepts: "class" means class, module, component, or struct-with-functions; "method" means method or function; "switch" means any repeated conditional dispatch (if/else chains, pattern matches, type-code lookups); "inheritance" includes any is-a reuse mechanism.

## Modes

Decide the mode first:

- **PR mode** — invoked against a merge request: deliver findings on the MR — one prioritized summary comment plus inline comments at the smelly lines (`gh pr review --comment` / `glab mr note`, plus inline discussions; mechanics in `docs/agents/issue-tracker.md` when the repo has one). Review the MR's diff.
- **Local mode** — invoked in a working copy with no MR named: review the current branch's changes (uncommitted work plus commits not on the default branch) and deliver findings in your response. The calling agent or user decides what to change.

## Grounding

Clean code is obvious to other programmers, contains no duplication, has a minimal number of classes and moving parts, and passes all tests. Everything short of that is **technical debt**: a loan against future velocity that charges interest on every change until repaid. Your findings are the debt statement; the treatments are the repayment plan.

Every treatment you prescribe must be **behavior-preserving**, executable as a series of small steps that each leave the program working and the tests green, and never mixed with new functionality. Reject any suggestion of your own that fails this bar — that's a rewrite proposal, not a refactoring, and should be labeled as such if genuinely warranted.

## Process

### 1. Scope

Read the in-scope diff, then trace outward: the enclosing functions/classes of every hunk, their callers, and their siblings. Several smells (Divergent Change, Shotgun Surgery, Duplicate Code, Parallel Inheritance Hierarchies) are invisible inside a diff and only appear in the surrounding structure. Done when you can describe what each change does in the code's own domain terms.

### 2. Smell sweep

Test the changed code against **every smell in [SMELLS.md](SMELLS.md)** — all five categories, all 23 smells. For each smell either record findings (with `file:line` evidence matching the smell's signs) or rule it out. The sweep is complete only when every catalog entry has been explicitly considered; do not stop at the first few hits.

Apply each smell's **Ignore when** clause before recording — a DTO at a serialization boundary is not a Data Class finding; a dispatch table inside a factory is not a Switch Statements finding.

### 3. Prescribe treatment

For each confirmed smell, select its treatment from [REFACTORINGS.md](REFACTORINGS.md), starting from the smell's own treatment list in SMELLS.md. A treatment is one technique or a named combination, written as concrete ordered steps against the actual code (real names, real files) — precise enough that an agent with no context could execute it. Combinations are normal: a Long Method with temp variables blocking extraction is *Replace Temp with Query → Extract Method*.

### 4. Design-pattern side-eye

Consult [PATTERNS.md](PATTERNS.md) only when a treatment naturally lands on one — several refactorings are doorways to patterns (Replace Conditional with Polymorphism → State/Strategy; Replace Constructor with Factory Method → Factory Method; Introduce Null Object → Null Object; Form Template Method → Template Method; Duplicate Observed Data → Observer).

The justification bar is strict, in this order:

1. The problem matches the pattern's **Apply when** clause as it exists in the code today — not as it might grow.
2. None of the pattern's **Avoid when** clauses hold.
3. A plain refactoring wouldn't cure the smell just as well with less structure.

A pattern that fails any test is over-engineering — flag *that* if someone already applied it speculatively. When a pattern passes all three, say so explicitly in the finding: name the pattern, the applicability clause it satisfies, and the simpler alternative it beats.

### 5. Timing judgment

Filter and rank findings by refactoring.guru's timing rules — when repayment is worth it:

- **Rule of three**: first time, just do it; second time, wince and duplicate; third time, refactor. A second occurrence is a note, not a demand.
- **Best moments**: when adding a feature through this code, when fixing a bug hiding in it, and during code review — which is exactly now, and the last chance before the code ships.
- **Not now**: code that works, never changes, and isn't in this change's blast radius — leave it a note, not a blocker. Broken code needs fixing, not refactoring.

Rank what survives by debt interest: how much every future change through this code will pay. A smell in a hot path everyone edits outranks a worse smell in a frozen corner.

### 6. Deliver

Per finding: **smell** (catalog name + `file:line`), **evidence** (which signs, in this code), **treatment** (technique(s) + ordered steps), **payoff** (what future changes get cheaper), and — only when step 4 fired — the justified pattern. Prioritize by rank from step 5; a few high-conviction findings beat an exhaustive nit list. If the sweep finds nothing worth reporting, say so plainly — clean diffs exist.

## Attribution

Catalogs adapted from refactoring.guru (Alexander Shvets) — smells and techniques trace to Fowler's *Refactoring*; patterns to the Gang of Four.
