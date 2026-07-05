---
name: experiment
description: Build every candidate for an in-place design/copy/behavior decision into the live page behind a temporary floating variant switcher, so the user flips through them in situ and picks by feel. Use when user says "experiment" or "ab test", wants to try multiple options for one decision (background pattern, hero copy, color treatment, layout variant, animation style) before committing, or has picked a winner from a running experiment and wants it shipped.
---

# Experiment

One page, one decision, N candidates — all built in at once behind a floating switcher pill, instead of shown one at a time. The user clicks through the *live* page and picks by feel. The whole thing is a **harness**: loudly temporary, trivially removable, with a documented ship-the-winner path.

Two branches: **build a harness** (the default) and **ship the winner** (when the user has picked).

## Branch 1 — Build a harness

### 1. Frame the decision

- [ ] Pin down the single decision under test (one harness = one decision) and give it a short label for the pill, e.g. `BG`, `HERO`, `MOTION`.
- [ ] Assemble the variant list: variant 1 is always the current baseline; the user's floated ideas each become a variant *done well* (polished, not a sketch); add 1–2 tasteful variants of your own. Aim for 4–6 total.
- [ ] Confirm the list with the user in one message before building. Done when the user has seen the numbered list.

### 2. Implement the variants

Pick the switching mechanism that fits what varies:

- **Styling** (backgrounds, colors, spacing, motion): a `data-*` attribute on `<body>` (`body[data-bg="2"]`) that overrides CSS custom properties. The base styles consume the props with `var(--x-image, <baseline>)` fallbacks, so **deleting the harness restores the baseline untouched** — no re-editing base styles.
- **Copy / components / behavior**: conditional render or branch keyed on the same variant number (read from the body dataset or a shared store).

Rules, whatever the mechanism:

- [ ] All variant code lives in **one fenced block** per file, opened and closed with a loud `TEMPORARY — <label> experiment` banner comment.
- [ ] The header comment documents both exits: TO REMOVE (which files/blocks to delete) and TO SHIP (where the winner's values get folded — name the real token/code sites, including any that must move in the same commit to avoid drift).
- [ ] Variants must not regress readability: keep decorative treatments out of text areas / behind existing masks; check contrast on every variant.
- [ ] Gotcha: SVG data-URIs cannot read CSS variables — inline the hex and note in the comment which tokens it must stay in sync with.

Done when every variant switches cleanly with no leakage between variants.

### 3. Add the switcher pill

Distilled reference implementation (Astro component + variant CSS, with React and plain-HTML notes): [HARNESS.md](HARNESS.md). The contract:

- Small fixed pill, bottom-right, **dashed border** — deliberately un-branded chrome that says "temporary tool".
- Label `<LABEL> n/N` (e.g. `BG 3/6`), tabular numerals; click cycles to the next variant, wrapping.
- Choice persists in `localStorage` under a project-prefixed key, and is applied by an **inline** script so the stored variant lands before first paint (no flash of the wrong variant).
- Marked TEMPORARY at every touch point (component header, import line, usage line, style block).

### 4. Verify and show

- [ ] Build/typecheck green with the harness in.
- [ ] Screenshot **every** variant (drive the page, set the variant, capture) — done when the user has one image per variant, labeled.
- [ ] Check each screenshot for contrast or layout regressions; fix before presenting.

### 5. Hand off

Tell the user: click the pill (bottom-right) to cycle variants — the choice sticks across reloads. Then offer the follow-up explicitly: *pick a winner and I'll ship it for real everywhere and remove the harness completely.*

## Branch 2 — Ship the winner

- [ ] Fold the winning variant's values/code into the real tokens/components at **every** site named in the harness header comment, in the same commit (drift check).
- [ ] Delete the harness completely: switcher component, its import/usage, every fenced TEMPORARY block, and any variant branches. `grep -ri temporary` (with the label) across the touched app to confirm nothing is left.
- [ ] Build green; the page renders the winner with no pill, and a stale localStorage key is harmless (nothing reads it).
- [ ] Done when a diff shows only real code — no experiment vocabulary survives.
