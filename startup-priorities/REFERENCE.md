# Startup Priorities — Reference

Based on [Geoff Ralston's Startup Priorities](https://blog.geoffralston.com/startup-priorities).

## The formula

```
score = max(1, round(4 * Breadth * Depth / Cost))     # range 1 - 100
```

The `4x` multiplier maps the natural (b×d)/c range (0.2–25) onto a 1–100 scale. Higher is better. Build the features that affect lots of users as profoundly as possible, and which you can build quickly and cheaply.

## Detailed spectrum definitions

Each variable is 1–5. The litmus tests are designed so that **two people scoring the same feature independently should arrive at the same level**. When in doubt, pick the level whose litmus test you can most confidently answer "yes" to.

### Breadth (b) — reach across current users + validated TAM

Breadth measures **total reach potential** — current users who are affected, or future users you'd unlock. Score based on whichever lens gives a higher reading, but TAM-based scores require evidence.

| b | Label | Current users | TAM expansion (evidence required) | Example (current) | Example (TAM) |
|---|-------|--------------|----------------------------------|-------------------|---------------|
| 1 | Niche | <5%, named accounts | No TAM signal | Fix one customer's SSO config | — |
| 2 | Narrow | 5–20%, one segment | A few inbound requests from non-users | Dark mode for iOS users | 3 companies asked about SAML support |
| 3 | Moderate | 20–50%, multiple segments | Validated demand: waitlist, competitor proof | CSV export for reporting | 50 companies on waitlist for API access |
| 4 | Broad | 50–80%, most weekly actives | Large reachable TAM via existing channels | Faster dashboard load | 200+ companies requesting enterprise tier |
| 5 | Universal | >80%, all including signups | Unlocks dominant share of TAM | Onboarding redesign | Industry-wide compliance requirement |

**How to score:** First check current-user reach (analytics: what % of MAUs touch this surface?). Then check TAM signal (waitlist size, inbound requests, competitor adoption, LOIs). Use the higher of the two.

**Evidence bar for TAM:** "We think the market is big" is not evidence and stays at b=1. Acceptable evidence: waitlist numbers with sign-up dates, inbound feature requests from non-users, competitor adoption data, signed LOIs, market research with methodology. The stronger the evidence, the higher you can score.

### Depth (d) — how much do affected users care?

Depth measures **observable user behavior**, not your internal opinion of importance.

| d | Label | Litmus test | What you'd observe | Example |
|---|-------|------------|-------------------|---------|
| 1 | Cosmetic | If you shipped it silently, would anyone notice? | Nothing. No tickets, no mentions, changelog filler. | Rounded avatar corners |
| 2 | Convenience | Do users have a workaround they tolerate? | Occasional "it would be nice if..." in feedback. No urgency. | Keyboard shortcut for a common action |
| 3 | Meaningful | Do users bring it up unprompted? | It's a recurring theme in feedback calls. Users say "that would really help." | Inline editing instead of modal popups |
| 4 | Critical | Is it a top-10 feature request? Do deals stall? | Sales/CS escalates it. Users bring it up on every call. Prospects ask about it in demos. | Bulk actions on a list users manage daily |
| 5 | Existential | Have users churned citing this gap? | You can point to lost accounts or a blocked market. It's in churn exit surveys. | Data export required for enterprise compliance |

**How to verify:** Ask five customers. If they light up, it's 4–5. If they shrug, it's 1–2. If you don't have customers yet, look at competitors — what do their users complain about missing?

### Cost (c) — scope of the engineering effort

| c | Label | Time | Litmus test | Signals |
|---|-------|------|------------|---------|
| 1 | Trivial | Hours | Can one person ship it today with no review? | Config change, copy fix, flag flip. Deploys with the next train. |
| 2 | Small | 1–3 days | One person, normal PR, isolated change? | Single component. No new dependencies. Standard code review. |
| 3 | Medium | 1–2 weeks | Needs a design discussion and touches 3+ components? | Brief design doc. Cross-module changes. QA beyond unit tests. |
| 4 | Large | 2–6 weeks | Needs cross-team coordination or a migration plan? | Multiple PRs. Staging environment testing. Data migration. |
| 5 | Massive | 6+ weeks | Would you create a project plan with milestones? | Architectural change. Multiple teams. Weekly status meetings. Unknown unknowns. |

**How to verify:** Ask the engineer who'd build it. Then add one level for uncertainty if nobody has done a spike.

## Score bands

| Score | Band | What it means |
|-------|------|---------------|
| 1–4 | **Skip** | Low impact relative to cost. Backlog it or kill it entirely. Don't let it consume planning energy. |
| 5–12 | **Low** | Marginal return. Only pick these up if the backlog is empty or they bundle naturally with other work. |
| 13–24 | **Moderate** | Solid ROI. Worth scheduling in a future sprint. Good candidates for roadmap planning. |
| 25–49 | **High** | Strong impact-to-cost ratio. Should be in the current or next sprint. Prioritize over moderate items. |
| 50–100 | **Do it now** | Exceptional leverage. If you're not building this, ask yourself why. |

### What does it take to reach "Do it now"?

Out of 125 possible input combinations, only **7** (6%) score 50 or above. They all share a pattern: **cost must be trivial (c=1)**, unless both breadth and depth are maxed out.

| b | d | c | Score | Real-world example |
|---|---|---|-------|--------------------|
| 5 | 5 | 1 | 100 | Login is broken for everyone — one-line fix identified |
| 4 | 5 | 1 | 80 | Data loss bug affecting most users — known root cause |
| 5 | 4 | 1 | 80 | Critical UX confusion on every page — copy change fixes it |
| 3 | 5 | 1 | 60 | Half the users can't export data — feature flag already exists |
| 5 | 3 | 1 | 60 | Confusing error message everyone hits — string change |
| 4 | 4 | 1 | 64 | Timeout causes data loss for most users — config tweak |
| 5 | 5 | 2 | 50 | Everyone needs password reset — 2-day isolated build |

The takeaway: "Do it now" means **high impact that's nearly free to ship**. If it costs real engineering time, even very impactful features cap at High.

### Band distribution

Of 125 possible (b, d, c) combinations:

| Band | Combos | % |
|------|--------|---|
| Skip | 27 | 22% |
| Low | 45 | 36% |
| Moderate | 30 | 24% |
| High | 16 | 13% |
| Do it now | 7 | 6% |

This is intentional. Most features are not exceptional — the formula forces you to be honest about that.

## Archetypes

These are calibration examples. When scoring a feature, mentally compare it to these archetypes to sanity-check your inputs. The **one-liner** column shows the standard output format.

| Archetype | b | d | c | Score | One-liner |
|-----------|---|---|---|-------|-----------|
| Quick win | 5 | 3 | 1 | 60 | 🔴 Priority Score: 60(Do it now) - Quick win: everyone hits it, one-line fix |
| Hidden gem | 2 | 5 | 1 | 40 | 🟠 Priority Score: 40(High) - Hidden gem: power users churn without it, flag flip |
| Low-hanging fruit | 3 | 4 | 1 | 48 | 🟠 Priority Score: 48(High) - Low-hanging fruit: data loss bug, known one-line fix |
| Market opener | 4 | 5 | 3 | 27 | 🟠 Priority Score: 27(High) - Market opener: 200 co's on waitlist need API, 2-week build |
| Crowd pleaser | 5 | 2 | 3 | 13 | 🟡 Priority Score: 13(Moderate) - Crowd pleaser: nice for all but nobody's blocked |
| Boil the ocean | 5 | 5 | 5 | 20 | 🟡 Priority Score: 20(Moderate) - Boil the ocean: max impact but quarter-long project |
| Go-to-market play | 3 | 3 | 3 | 12 | 🔵 Priority Score: 12(Low) - Go-to-market play: validated LatAm demand, medium build |
| Infrastructure tax | 4 | 3 | 4 | 12 | 🔵 Priority Score: 12(Low) - Infrastructure tax: faster loads, heavy migration |
| Strategic bet | 2 | 5 | 4 | 10 | 🔵 Priority Score: 10(Low) - Strategic bet: existential for 15%, no wider TAM evidence |
| Vanity project | 1 | 1 | 4 | 1 | ⚪ Priority Score: 1(Skip) - Vanity project: niche cosmetic work, expensive |

### Why "Strategic bet" scores Low but "Market opener" scores High

Both target non-mainstream users with deep need. The difference is **evidence of TAM reach**:
- Strategic bet (b=2): existential for 15% of current accounts, but no validated signal that a larger market exists. The breadth stays narrow.
- Market opener (b=4): 200 companies on a waitlist — concrete evidence that a large TAM segment is reachable. The breadth jumps to b=4.

The formula rewards you for having evidence. If the strategic bet team came back with a waitlist of 200 enterprise prospects, it would rescore as b=4, d=5, c=4 = 20 (Moderate) — a meaningful jump from 10.

### Why "Boil the ocean" only scores Moderate

Even when both breadth and depth are maxed, massive cost (c=5) drags the score to 20. The formula encodes a truth: if you could break this into smaller pieces with lower cost, the individual pieces would each score higher. A 20-point monolith is worse than three 40-point slices.

## Output format

Every scored feature must end with a standard one-liner for portability across skills and processes:

```
<emoji> Priority Score: <score>(<band>) - <archetype>: <brief one-liner why>
```

| Band | Emoji |
|------|-------|
| Skip | ⚪ |
| Low | 🔵 |
| Moderate | 🟡 |
| High | 🟠 |
| Do it now | 🔴 |

Rules:
- `<score>` is the integer 1–100
- `<band>` is the band name: Skip, Low, Moderate, High, Do it now
- `<archetype>` is the closest match from the archetypes table. If none fits, use a short descriptive label (e.g. "Niche fix", "Growth play")
- `<brief why>` is a single clause explaining the score — reference the dominant factor (e.g. "trivial cost" or "no TAM evidence")
- This one-liner is the **portable output** — other skills, issue trackers, and planning docs should be able to consume it as-is

## The early-stage caveat

Ralston emphasizes: in a company's infancy, **Depth trumps Breadth**. The goal is product-market fit — 100 users who love the product beat 1000 who think it's fine.

When scoring for an early-stage company:
- A feature with b=2, d=5 (narrow but existential) may be more strategic than b=5, d=2 (broad but cosmetic), even though the raw scores are similar
- Call this out explicitly when presenting results
- Suggest the user mentally weight Depth by 1.5x if they're pre-PMF, then compare

Once product-market fit is established, Breadth becomes the scaling lever and the formula works as-is.

## Tips for better scoring

- **Uncertain about Breadth?** Two lenses: (1) analytics — what % of MAUs touch the affected surface? (2) TAM — do you have a waitlist, inbound requests, or competitor data showing unmet demand? Use whichever is higher.
- **Uncertain about Depth?** Ask five customers. If they light up, it's 4–5. If they shrug, it's 1–2.
- **Uncertain about Cost?** Ask the engineer who'd build it. Then add one level for uncertainty.
- **Score feels wrong?** Trust your gut and adjust. The formula structures thinking — it doesn't replace it.
- **Want to improve a score?** The highest leverage is reducing Cost. Can you scope down to a smaller version that delivers most of the value?
