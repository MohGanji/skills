---
name: priority-score
description: >
  Score feature priorities using Geoff Ralston's (b*d)/c formula — Breadth,
  Depth, and Cost on 1-5 scales yielding a 1-100 priority score. Use when
  user wants to prioritize features, decide what to build next, rank a backlog,
  compare initiatives, or mentions "priority score".
---

# Priority Score

Rank features, tasks, or initiatives using Geoff Ralston's **(Breadth x Depth) / Cost** formula, scaled to **1 - 100**. Cuts through opinion-driven prioritization by forcing each variable through a concrete litmus test.

Formula: `score = max(1, round(4 * b * d / c))`

| Score | Band | Emoji | Action |
|-------|------|-------|--------|
| 1 - 4 | Skip | ⚪ | Backlog or kill it |
| 5 - 12 | Low | 🔵 | Only if nothing better exists |
| 13 - 24 | Moderate | 🟡 | Schedule in a future sprint |
| 25 - 49 | High | 🟠 | Current or next sprint |
| 50 - 100 | Do it now | 🔴 | Stop what you're doing |

## Modes

- **Autonomous (default):** Score all three variables yourself using the litmus tests below and the context available. Output the one-liner immediately. No user interaction unless you hit uncertainty (see below).
- **Collaborative:** Walk through each variable with the user one at a time. Enter this mode when:
  - The user explicitly asks to collaborate, discuss, or decide on the variables
  - You lack sufficient context to confidently answer a litmus test (e.g. no info on user base size, no way to gauge cost)
  - Two adjacent levels seem equally valid and the difference would change the band

When entering collaborative mode, explain *which* variable you're uncertain about and why, then use `AskUserQuestion` for that variable only. Return to autonomous for the rest.

## Input spectrums

Each level has a **litmus test** — a yes/no question that pins the score and removes ambiguity.

### Breadth (b) — reach across current users + validated TAM

Score based on current users **or** TAM expansion — whichever is higher. TAM claims require evidence (waitlist, inbound requests, competitor data, LOIs). "We think the market is big" without evidence stays at b=1.

| b | Label | Current users | OR TAM expansion (with evidence) |
|---|-------|--------------|----------------------------------|
| 1 | Niche | <5%, named accounts | No TAM signal |
| 2 | Narrow | 5-20%, one segment | A few inbound requests from non-users |
| 3 | Moderate | 20-50%, multiple segments | Validated demand: waitlist, competitor proof |
| 4 | Broad | 50-80%, most weekly actives | Large reachable TAM segment via existing channels |
| 5 | Universal | >80%, all users incl. new signups | Unlocks dominant share of TAM |

### Depth (d) — observable user behavior, not your guess

| d | Label | Litmus test |
|---|-------|------------|
| 1 | Cosmetic | If you shipped it silently, would anyone open a ticket or mention it? (No) |
| 2 | Convenience | Do affected users have a workaround they tolerate without complaining? (Yes) |
| 3 | Meaningful | Do users bring this up unprompted in feedback calls or surveys? (Yes) |
| 4 | Critical | Is it a top-10 feature request? Have sales deals stalled or required workarounds because of it? (Yes) |
| 5 | Existential | Have users churned explicitly citing this gap, or is a new market segment blocked without it? (Yes) |

### Cost (c) — scope of the engineering work

| c | Label | Litmus test |
|---|-------|------------|
| 1 | Trivial | Can one person ship it today — config change, copy fix, flag flip? (Yes) |
| 2 | Small | One person, 1-3 days, isolated to one component, standard PR? (Yes) |
| 3 | Medium | Needs a design discussion, touches 3+ files across 2+ modules, may need QA beyond unit tests? (Yes) |
| 4 | Large | Requires cross-team coordination, a migration plan, or staging env testing? (Yes) |
| 5 | Massive | Would you create a project plan with milestones and track it weekly? (Yes) |

## Workflow

### Autonomous (default)

1. Read the feature/task/goal from context.
2. Score each variable using the litmus tests. For each, identify which litmus test applies.
3. If confident on all three, compute and output the one-liner directly:
   ```
   <emoji> Priority Score: <score>(<band>) - <archetype>: <brief why>
   ```
4. If scoring multiple features, output a ranked list of one-liners.

### Collaborative (on uncertainty or user request)

1. Present the spectrum tables so the user sees the litmus tests.
2. For each uncertain variable, explain the uncertainty and use `AskUserQuestion`.
3. Score confident variables autonomously — only ask about the ones you can't pin.
4. Compute and output the one-liner.

### Showing your work

When outputting the one-liner, always follow it with a brief breakdown so the user can challenge the score:
```
<emoji> Priority Score: <score>(<band>) - <archetype>: <brief why>
    b=<b>(<label>) d=<d>(<label>) c=<c>(<label>)
```

## Key rules

- **Early-stage caveat**: pre-PMF, Depth > Breadth. 100 devoted users beat 1000 lukewarm ones. Call this out when presenting results.
- This is a **thinking tool**, not a replacement for judgment.
- When uncertain about a variable, ask — don't guess. A wrong score is worse than a slow score.

See [REFERENCE.md](REFERENCE.md) for archetypes, worked examples, and band analysis.
