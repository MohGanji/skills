---
name: canvas-studio
description: A local collaborative design canvas (Fabric.js) where you and your local AI co-edit the SAME browser page. The AI screenshots the live canvas for real visual feedback and scripts the Fabric editor; you drag/recolor directly. Pixel-level vector paths, arbitrary hex + gradients/shades, textures, and layered depth & negative space (z-order, not fragile boolean cuts). Use when designing a logo, mark, icon, or layout interactively with the AI.
---

# Canvas Studio

A shared design surface built on [Fabric.js](http://fabricjs.com). One real browser window
runs the canvas; **the human works in it directly** (select, drag, recolor), and **the
local AI attaches to that exact page** to see it (screenshots) and drive it (scripts the
Fabric canvas). Same page, both of you.

**Why Fabric.js:** it gives **pixel-level vector control** (arbitrary bézier `Path`s),
**arbitrary hex + linear/radial gradients** (shades/depth), **image/pattern textures**,
**shadows & blend modes** (depth), **groups/z-order** (layers), and clean-enough **SVG
export** — and it proved it can reproduce the real inspiration logos exactly. Crucially,
on a real canvas **depth and negative space are just layering** (put a background-coloured
shape between the stroke and the accent — WYSIWYG, no boolean cut), which is the exact
thing that fought us in the headless path.

The canvas **auto-seeds a gallery of design iterations** on load (`window.studio.gallery()`)
— versions laid out side by side as a visual history. Individual seeds
(`seedMindmap()`, `seedGraphene({…})`) and `clone()` let you grow that history.

## Workflow — the AGENT runs this (the human never touches a terminal)

1. **Already running?** `curl -s localhost:5179/shapes` — if it responds, skip to step 4.
2. **Install once if needed:** if `canvas-studio/node_modules` is missing, run
   `cd canvas-studio && npm install` (fabric + a browser; ~1 min).
3. **Launch in the background** (persists across turns; opens the canvas window on the
   user's screen):
   ```bash
   cd canvas-studio && npm run studio
   ```
   Then wait for readiness: `until curl -s localhost:5179/shapes >/dev/null 2>&1; do sleep 1; done`.
4. **Draft from the brief.** Build/adjust the mark via `/eval`, bringing **depth + negative
   space in from the first pass**. Screenshot, critique, refine 1–2 times.
5. **Hand off.** Tell the user the window is theirs; on each later turn, **screenshot
   first** to pick up their edits, then continue.

> Runs on the user's machine (opens a real window). If there's no display, fall back to the
> `gal-shir-brand-logo-design` headless path.

## The control API (the AI drives it with `curl`)

| Do | Command |
| --- | --- |
| **See** the live canvas | `curl -s localhost:5179/screenshot -o /tmp/canvas.png` → **Read** the PNG |
| **Read** objects as JSON | `curl -s localhost:5179/shapes` |
| **Do** — run canvas JS (an expression; use an IIFE for statements) | `curl -s -XPOST localhost:5179/eval --data '<js>'` |
| **Export** SVG | `curl -s localhost:5179/export -o design.svg` |
| Re-render / re-seed | `curl -s localhost:5179/fit` · POST `window.studio.seedMindmap()` |

The page exposes `window.canvas` (the [Fabric Canvas](http://fabricjs.com/docs/)),
`window.fabric`, and `window.studio` (`shapes()`, `exportSvg()`, `clear()`,
`radial(x1,y1,r1,x2,y2,r2,stops)`, `add(obj)`, `seedMindmap()`).

**Create / style / layer** (via `/eval`):
```js
(() => {
  const c = window.canvas, f = window.fabric;
  // a monoline stroke (arbitrary bézier, exact coords, round caps)
  const arm = new f.Path('M60 240 L60 130 Q110 80 160 130 L160 240', {
    fill: '', stroke: '#1a1a2e', strokeWidth: 26, strokeLineCap: 'round', strokeLineJoin: 'round' });
  // a node with a REAL radial gradient (depth), exact hex
  const node = new f.Circle({ left: 60, top: 70, radius: 30, originX: 'center', originY: 'center' });
  node.set('fill', window.studio.radial(20, 20, 0, 30, 30, 42,
    [{ offset: 0, color: '#8fe8dd' }, { offset: 1, color: '#0d9488' }]));
  // NEGATIVE SPACE by layering: paper-coloured halo ON TOP of the stroke, node on top of that
  const halo = new f.Circle({ left: 60, top: 70, radius: 42, originX: 'center', originY: 'center', fill: '#f7f7f4' });
  c.add(arm, halo, node);            // add-order = z-order (preserveObjectStacking is on)
  c.requestRenderAll();
  return window.studio.shapes().length;
})()
```
- **Move / recolor:** `obj.set({ left, top, fill:'#123456', opacity:0.9 }); c.requestRenderAll();`
- **Depth:** `obj.set('shadow', new f.Shadow({ color:'rgba(0,0,0,.25)', blur:20, offsetX:0, offsetY:8 }))`; or a two-tone facet (a darker shape clipped/stacked on the node); or `obj.globalCompositeOperation = 'multiply'` for blends.
- **Textures:** `new f.Pattern({ source: imgEl, repeat:'repeat' })` as a fill.
- **Layer order:** `c.bringObjectToFront(obj)` / `c.sendObjectToBack(obj)` / add-order.
- **Delete / group:** `c.remove(obj)` · `new f.Group([a,b])`.

Reference objects from `/shapes` (index/id) or `window.canvas.getObjects()`.

### Iterate by CLONING — never destroy prior versions
The canvas is a **visual history of the design**. When the user asks for a change, do
**not** edit the current mark in place or reseed over it. Instead:
1. **Clone** the current iteration so the previous version stays on the canvas —
   `curl -s -XPOST localhost:5179/eval --data 'window.studio.clone(430)'` duplicates the
   selected group and drops the copy to the right (pass `dx,dy`). If nothing is selected,
   select the latest group first (`window.canvas.setActiveObject(...)`).
2. **Modify the clone only** — apply the requested change to the copy.
3. **Line them up** left→right (or top→bottom) so the user can compare the whole history.
Keep each iteration as one **group** (so it clones/moves/labels as a unit) with a small
caption above it. `window.studio.gallery()` reseeds the current comparison row.

### Collaboration etiquette (every round)
1. **Screenshot first** — see the canvas (incl. the human's tweaks) before acting.
2. **Clone, then make one intentful change** on the copy (see above), then **screenshot +
   critique** against the goal. Loop.
3. **Hand off** — invite direct tweaks; screenshot next turn to pick them up.
4. **Deliver** — `curl /export -o <name>.svg`, then run it through SVGO if shipping.

## The design brain (reuse it)

Canvas Studio is the *hands*. For the *taste* use the
[`gal-shir-brand-logo-design`](../gal-shir-brand-logo-design/) skill:
`references/gal-shir-principles.md`, `references/idea-generation.md`, and the
reverse-engineered examples in `references/inspirations/`. **Bring depth and negative space
in from the first concept** — and here they're easy (gradients, shadows, and layered
paper-coloured shapes, all WYSIWYG).

## Notes

- **Colour is exact** — arbitrary hex, linear/radial gradients, opacity, blends. (No more
  themed-palette remapping.)
- **SVG export** via `canvas.toSVG()` is clean for paths/gradients/shadows; run SVGO before
  shipping. Bitmap textures export as embedded images.
- Screenshots are UI-free (the canvas has no heavy chrome), so `/screenshot` is already a
  clean preview; `/export` is the vector.
- Local single-user + AI (not multi-user cloud).

See [README.md](README.md) for architecture and troubleshooting.
