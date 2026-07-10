---
name: gal-shir-brand-logo-design
description: Design brand logos the way Gal Shir does — understand the brand story, values, audience, and strategy, then turn it into ONE smart, minimal symbol and execute it pixel-perfectly as portable vector SVG, with full lockups (mark, wordmark, app icon, favicon) and an optional mascot extension. Use when the user wants a logo, brand mark, symbol, wordmark, app icon, or brand identity, or mentions Gal Shir / a "smart minimal symbol" for a tee, mug, app, landing page, or phone.
---

# Gal Shir — Brand Logo Design

Design a brand mark the way Gal Shir does: **understand the brand story, values,
audience, and strategy, and turn all of it into a smart, minimal symbol — then execute
it pixel-perfectly.** Both halves are the job. A brilliant concept rendered sloppily
fails; flawless craft with no idea fails.

**One medium, always.** Marks are built as hand-constructed **vector SVG** via the
bundled `engine/logokit` SDK. Not raster, not a template maker, not a prompt to an image
model — a construction toolkit (grid + golden-ratio armature, boolean geometry,
circle-packing, monoline, one-hue palette, real-font wordmarks) that gives you control
of every coordinate and outputs one portable `.svg` that works on a tee, mug, favicon,
app icon, software UI, landing hero, or phone.

- **The concept is yours.** `references/gal-shir-principles.md` (taste & method),
  `references/idea-generation.md` (the named idea moves), and
  `references/inspirations.md` (his real marks reverse-engineered, with reconstructions).
- **The hands are the SDK.** `REFERENCE.md` documents every `logokit` function.
- **The eyes are Playwright.** Render the SVG and critique it before shipping.

## Workflow

### Phase 1 — Brief (understand the brand)

- [ ] Read `references/gal-shir-principles.md` (the principles, grammar, method, and
      evaluation gate). Do this before designing.
- [ ] Answer the intake questions in that file: product in one sentence, audience and
      how they should feel, 3 core values + mission, competitors (to differ from),
      personality (playful ↔ technical), any object/metaphor/letter the brand ties to,
      and where the mark will live most.
- [ ] If the user hasn't given enough to answer these, ask a few sharp questions — do
      not invent a strategy silently. Gal starts every mark from a real brief.

### Phase 2 — Concept (story before form)

- [ ] Read `references/idea-generation.md` and run the brief through its **idea moves**
      (mine the name/shape/material/function, object fusion, hide-a-letter, negative-space
      reveal, weaponize one colour, contrarian inversion, …). Study
      `references/inspirations.md` for how his real marks turned a brief into a symbol.
- [ ] Generate 3–5 distinct concept *directions* in words first — each a single idea
      that could encode the brand. Diverge wide before judging any (see the divergence
      multipliers). Think story-first.
- [ ] Select ruthlessly — ONE idea (his practice is a single option, not a menu). Name
      the "aha" — the one hidden reading, if there is one.
- [ ] Choose the ONE saturated brand hue and the wordmark character (geometric sans for
      tech, rounded for playful, etc.).

### Phase 3 — Construct (pixel-perfect execution)

- [ ] `cd engine && npm install` if not already installed.
- [ ] Write an ES-module build script (model it on `examples/orbit.mjs`) that:
      `setup()` → build the symbol from primitives + boolean ops on a `grid()` (and a
      `goldenSpiral()` armature if the concept is motion/flow) → apply the grammar
      (`monoline` with rounded terminals, one-hue `palette`, negative-space cuts) →
      draw a custom `wordmark` with at most one concept `twist` → `lockups()` to emit
      the full system, plus a `constructionSheet()`.
- [ ] Run it: `node your-script.mjs`. It writes portable `.svg` files.

### Phase 4 — See & critique (the loop)

- [ ] Render the exported SVGs to a PNG via the **Playwright MCP** (contact sheet →
      `playwright_navigate` the `file://` URL headless → `playwright_screenshot`
      fullPage → **Read the PNG**). See REFERENCE.md § visual-verification loop.
- [ ] Judge against the **evaluation gate** in `references/gal-shir-principles.md`:
      conceptually smart, minimal, unique, scale-proof, right personality,
      negative-space aha, ownable colour, geometric rigor, undeniable in application.
- [ ] Fix in code, regenerate, re-render. **Loop until it passes.** Then
      `playwright_close`.

### Phase 5 — Deliver (and optionally, a mascot)

- [ ] Present the system: primary mark, mono + reverse, horizontal + stacked lockups,
      app icon, favicon, and the construction sheet — with a one-paragraph rationale
      tying the symbol back to the brand story (the "why", not just the "what").
- [ ] If the user wants a **mascot**, extend the symbol's DNA (same primitives, grid,
      stroke weight, hue) per the "Symbol → mascot extension" section of the principles
      file — build the character from the same modular circles/arcs, story-first.

## Key rules

- **Never skip the brief or the concept.** No mark before there is a brand story and a
  single idea to encode. The SDK executes ideas; it does not invent them.
- **Always render and look before declaring done.** SVG is authored blind; the
  Playwright loop is non-optional — it catches optical flaws code can't see.
- **Hold the grammar by default:** one uniform monoline weight, rounded terminals,
  exactly ONE saturated hue + black/white, snapped to a grid, custom lettering, aim for
  one negative-space "aha". Break a rule only with a stated reason.
- **One idea, one twist, one hue.** Restraint is the style. Two hidden readings or two
  saturated colours means you haven't reduced enough.
- **Stay concept-first, not mechanical.** Gal uses no rigid template; don't let the
  grammar produce generic geometric marks. The idea leads; the constraints refine.
- **Deliver a system, not a single file** — mark, lockups, app icon, favicon,
  construction sheet — every one a portable `.svg`.

## Engine

The bundled `engine/logokit.js` SDK is the sole build medium — see **[REFERENCE.md](REFERENCE.md)**
for the full API, the bundled OFL fonts, and the render loop. A complete worked run is
in **[examples/orbit.mjs](examples/orbit.mjs)** (preview: `examples/orbit-preview.png`).

Knowledge lives in `references/`:
- **[gal-shir-principles.md](references/gal-shir-principles.md)** — taste, grammar, method, evaluation gate.
- **[idea-generation.md](references/idea-generation.md)** — the named idea moves + divergence/selection.
- **[inspirations.md](references/inspirations.md)** — 18 of his real marks reverse-engineered by
  a blind 3-agent method. Each `inspirations/<brand>/` holds the real `original.svg`/`.png`, his
  own portfolio showcase images (`images/`), and an `analysis.md` (brand truth · what Gal said ·
  the mark read blind · consolidation). All real references — no reconstructions.

---

## Credit & provenance

Modeled on the design principles and public work of **[Gal Shir](https://galshir.com)**
(@galshirart) — founding-team brand designer at Lemonade, author of the "60 Tips for
Logo Design" e-book, founder of Color Hunt. The principles here are distilled from his
writing, talks, and identity work; the vocabulary and method are his, the SDK is our
translation of his craft into a single reproducible vector medium.

The bar this skill aims for is Gal's own, from watching an AI (Fable 5) design a logo:
*"It understood the brand story, values, audience, strategy, and turned all of it into a
smart, minimal symbol. A genuinely brilliant concept… And it didn't just nail the idea.
It executed the design pixel-perfectly."*

Gal Shir is not affiliated with this skill and has not endorsed it. Bundled fonts are
licensed under the SIL Open Font License (see `engine/fonts/LICENSE.md`).
