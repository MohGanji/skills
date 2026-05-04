---
name: design-deliberately
description: Review and guide UI design toward intentional minimalism where every element earns its place. Use when user asks for design review, UI feedback, wants to simplify an interface, mentions "design deliberately", or is building/refining UI components.
---

# Design Deliberately

## Philosophy

Every pixel is real estate. Every character, shape, line, and shade must earn its place. If you remove something and nobody notices, it should never have been there.

Form follows function. Decoration is debt. Clarity is kindness.

## The Razor

Before adding any element, ask:

1. **Does it serve a user goal?** If not, cut it.
2. **Can something existing do this job?** If yes, don't add.
3. **Would removing it break understanding?** If no, cut it.
4. **Is it communicating or decorating?** If decorating, cut it.

## Core Principles

Eight principles govern every decision. See [PRINCIPLES.md](PRINCIPLES.md) for deep treatment.

| Principle | One-line test |
|-----------|---------------|
| **Contrast** | Can I tell what matters in under 1 second? |
| **Balance** | Does anything feel heavier than it should? |
| **Emphasis** | Is there exactly one focal point per view? |
| **Repetition** | Do recurring elements look and behave identically? |
| **Proportion** | Do sizes reflect actual importance? |
| **White Space** | Is there enough breathing room, or does it feel crowded? |
| **Hierarchy** | Can I scan top-to-bottom and understand the structure? |
| **Movement** | Does my eye flow naturally to the next action? |

## Workflow

### Phase 1 -- Audit

- [ ] Screenshot or read the component/page under review
- [ ] List every visible element (labels, borders, shadows, icons, colors, text)
- [ ] For each element, apply the Razor (4 questions above)
- [ ] Flag elements that fail the Razor as **candidates for removal**

### Phase 2 -- Diagnose

For each surviving element, evaluate against the 8 principles:

- [ ] Does contrast guide the eye to what matters?
- [ ] Is visual weight distributed intentionally?
- [ ] Is there one clear focal point, not competing centers?
- [ ] Are patterns consistent (spacing, radius, font weight)?
- [ ] Do sizes encode importance correctly?
- [ ] Is white space doing work (grouping, separating, breathing)?
- [ ] Can the hierarchy be read in a single scan?
- [ ] Does the layout guide toward the primary action?

### Phase 3 -- Prescribe

Present findings as a table:

```
| Element | Issue | Principle Violated | Action |
```

Actions are one of: **cut**, **merge**, **simplify**, **reposition**, **resize**, **restyle**.

### Phase 4 -- Implement

After user confirms:

- [ ] Apply changes one element at a time
- [ ] After each change, re-check: did removing/changing this break anything?
- [ ] Verify the 8 principles still hold on the modified view
- [ ] Compare before/after side by side

## Studio Principles

Distilled from studying six deliberate design cultures. See [STUDIO.md](STUDIO.md) for full treatment.

**From Vercel:** Only animate when it clarifies cause and effect. Every element aligns intentionally to grid, baseline, or optical center. Prefer inline help over tooltips. Design all states (empty, sparse, dense, error).

**From Notion:** The interface is a blank page -- power through absence, not addition. Beauty isn't decoration; it reduces cognitive load. Optimize for the golden path (80% of users). If someone tired and distracted can't understand it, simplify.

**From Figma:** Solve problems artfully -- care about both form and function. Reliability over novelty. Designers and developers should speak the same language.

**From Cursor:** Meticulous consideration behind minimalist operation. Reduce barriers. Communicate clearly about what's happening. Structure determines quality.

**From Anthropic:** Bold aesthetic choices, not safe defaults. Typography, color, and animation should feel intentional, never decorative. Interoperability over replacement.

**From tldraw:** Strong defaults, every layer replaceable. Extensions build at the same level as core features -- no privileged internal APIs. Follow established conventions; only diverge after empirical research. Taste is a first-class engineering concern. Invisible complexity -- interactions feel effortless because the library absorbs the hard math.

## Anti-patterns

Things that should never survive the Razor:

- Labels that restate what the placeholder already says
- Headings on sections with only one item
- Borders between elements that whitespace already separates
- Icons next to text that says the same thing
- "Are you sure?" confirmations on reversible actions
- Loading spinners when a skeleton would prevent layout shift
- Color used as the sole differentiator (accessibility)
- Tooltips hiding information that should be inline
- Generic button text ("Submit", "Continue") when specific text fits ("Save API Key")
