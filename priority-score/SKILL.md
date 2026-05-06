---
name: priority-score
description: >
  Score feature priorities using Geoff Ralston's (b*d)/c formula — Breadth,
  Depth, and Cost on 1-5 scales yielding a 1-100 priority score. Use when
  user wants to prioritize features, decide what to build next, rank a backlog,
  compare initiatives, or mentions "priority score".
---

# Startup Priorities

Score features with **(Breadth x Depth) / Cost**, scaled to **1 - 100**.

Formula: `score = max(1, round(4 * b * d / c))`

| Score | Band | Emoji | Action |
|-------|------|-------|--------|
| 1 - 4 | Skip | ⚪ | Backlog or kill it |
| 5 - 12 | Low | 🔵 | Only if nothing better exists |
| 13 - 24 | Moderate | 🟡 | Schedule in a future sprint |
| 25 - 49 | High | 🟠 | Current or next sprint |
| 50 - 100 | Do it now | 🔴 | Stop what you're doing |

## Input spectrums

Present these tables before scoring. Each level has a **litmus test** — a yes/no question that pins the score and removes ambiguity.

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

1. **Present the scales** — print the three spectrum tables above before scoring begins.
2. **Collect the feature** — ask what to score, or confirm if already named.
3. **Score each variable** — for Breadth, Depth, Cost (one at a time, never batched):
   - Show the spectrum
   - Suggest a level with a one-line rationale **referencing the litmus test**
   - Use `AskUserQuestion` to let the user confirm or override
4. **Compute and present** — show the breakdown, then the standard one-liner:
   ```
   Breadth: <b> — <label>    Depth: <d> — <label>    Cost: <c> — <label>

   <emoji> Priority Score: <score>(<band>) - <archetype>: <brief why>
   ```
   Pick the closest archetype from [REFERENCE.md](REFERENCE.md). If none fits, use a short descriptive label.
5. **Compare** — after 2+ features, show a ranked list of one-liners:
   ```
   🟠 Priority Score: 40(High) - Market opener: 200 co's on waitlist need API, medium build
   🔵 Priority Score: 12(Low) - Infrastructure tax: faster loads for most users, heavy migration
   ```

## Key rules

- **Early-stage caveat**: pre-PMF, Depth > Breadth. 100 devoted users beat 1000 lukewarm ones. Call this out when presenting results.
- This is a **thinking tool**, not a replacement for judgment.
- When uncertain about a variable, suggest the user ask their customers.
- Never auto-fill all three without user confirmation on each.

See [REFERENCE.md](REFERENCE.md) for archetypes, worked examples, and band analysis.
