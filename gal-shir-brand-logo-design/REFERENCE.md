# logokit — SDK reference

`engine/logokit.js` is the single, bundled execution medium for this skill. It builds
brand marks as **hand-constructed vector SVG** — the one output medium, so it is always
clear where the agent works. Built on `paper-jsdom` (geometry + SVG i/o),
`opentype.js` (fonts → outlined letterforms), and `svgo` (clean output). Runs headless
in Node ≥18 with **no native build**.

It is a *construction toolkit*, not a template generator — there is no `makeLogo()`.
You compose primitives + boolean operations the way a designer builds in Illustrator.

## Setup (once)

```bash
cd engine && npm install        # opentype.js, paper-jsdom, svgo — pure JS
```

Write build scripts as ES modules that `import` from `engine/logokit.js` (see
`examples/orbit.mjs`). Run with `node your-script.mjs` from the skill root.

## Lifecycle

| Function | Purpose |
|---|---|
| `setup({ size = 1024 })` | Initialise a fresh square canvas. **Call once per mark.** Returns `{ size, center, phi }`. |
| `P(x, y)` | Shorthand for `new paper.Point(x, y)`. |
| `paper` | The live Paper.js scope, if you need lower-level control. |

## Construction guides

| Function | Returns / does |
|---|---|
| `grid(n = 12, { padding = 0.08 })` | Explicit n×n grid. `{ n, unit, pad, span, at(col,row)→Point, snap(pt)→Point, center }`. Snap shapes to it. |
| `goldenSpiral({ cx, cy, size, turns = 4, cw = true })` | Golden-ratio arc armature. `{ arcs:[Path], radiusAt(i), cx, cy }`. Use for wave/motion concepts. |
| `PHI` | 1.618… constant. |

## Primitives (each returns a `paper.Path`)

`circle(cx,cy,r)` · `ellipse(cx,cy,rx,ry)` · `ring(cx,cy,r,weight)` ·
`rect(x,y,w,h,radius=0)` · `square(cx,cy,s,radius=0)` · `line(x1,y1,x2,y2)` ·
`arc(from,through,to)` · `polygon(cx,cy,r,sides,rotation=0)` · `triangle(cx,cy,r,rotation=0)` ·
`star(cx,cy,rOuter,rInner,points=5,rotation=0)` · `heart(cx,cy,size)` · `fromPathData(d)`

## Boolean construction

| Function | Effect |
|---|---|
| `unite(a, ...rest)` | Merge shapes into one. |
| `subtract(a, ...cutters)` | Remove cutters from `a`. |
| `intersect(a, ...rest)` | Keep only overlap. |
| `exclude(a, b)` | Symmetric difference. |
| `negativeSpace(base, ...cutters)` | Alias of `subtract` — the signature "hidden reading" cut. |

## Modular assembly

```js
circlePack({ cx, cy, ringR, r, count, united = true, startAngle = -Math.PI/2 })
```
Packs `count` identical circles of radius `r` around a ring — Gal's mane/cloud/texture
technique. Returns one united `paper.Path` (or a `paper.Group` if `united:false`).

## Transforms

`centerOn(item, cx, cy)` · `fitTo(item, target, { useStroke = true })` (scale so the
larger dimension = `target`) · `place(item, x, y)` · `rotate(item, deg, around)`.

## Style (enforces the grammar)

| Function | Effect |
|---|---|
| `monoline(item, { weight, color='#111', cap='round', join='round' })` | Uniform stroke, rounded terminals, no fill. Works on a Path or Group. |
| `fill(item, color)` | Flat fill, no stroke. |
| `gradientFill(item, stops, { center, radius, radial=true, angle=0 })` | Gradient fill. `stops` = `[[color, offset], …]`. Use sparingly — keep stops **within one hue family** (e.g. cyan→bright-cyan) so the one-saturated-hue rule holds. See the TENZAI study piece. |
| `roundCorners(item, radius)` | Round a polygon/segment path's corners. Returns the new path. |

## Palette (one saturated hue + black/white)

```js
const pal = palette('#4c5fef', { ink = '#111111', paper = '#ffffff' })
// → { brand, ink, paper, hue, tint(t), shade(t) }
```
`tint(t)` / `shade(t)` stay **on-hue** (for mascot shading) so you never introduce a
second saturated colour.

## Wordmark (custom lettering from real fonts)

```js
wordmark(text, {
  font = 'poppins-semibold',   // key from FONTS, or an absolute .ttf/.otf path
  size = SIZE*0.18, tracking = 0, color = '#111',
  twist,                       // (glyphs, api) => void  — redraw ONE letter
})
```
Returns a `paper.Group` of per-glyph outlined paths. In `twist`, `glyphs` is
`[{ char, item, advance, x }]` (item is `null` for spaces); replace one glyph's `item`
to enact the concept — e.g. swap an `o` for a geometric ring (see the example). `api`
exposes `{ paper, circle, rect, ellipse, triangle, polygon, star, P }`.

**Bundled fonts** (OFL, in `engine/fonts/`): `poppins`, `poppins-medium`,
`poppins-semibold`, `poppins-bold` (geometric sans — tech), `rounded` (Varela Round —
playful/mascot). Add your own by dropping a static `.ttf` in `engine/fonts/` and
registering it in the `FONTS` map, or pass an absolute `fontPath`.

## Export & delivery (portable SVG)

| Function | Returns |
|---|---|
| `toSVG(items, { padding = 0.12, background = null, square = false })` | One clean, optimised, framed SVG string. Aspect follows content unless `square`. |
| `save(filename, svg)` | Write the SVG to disk. |
| `lockups({ mark, wordmark, palette, gap })` | The full system as `{ name → svg }`: `mark-color`, `mark-ink`, `mark-reverse`, `lockup-horizontal`, `lockup-stacked`, `app-icon`, `favicon`. |
| `constructionSheet(mark, guides = [], { color })` | Mark with grid/golden guides overlaid — the "rigor" panel. |

Every returned asset is one portable `.svg` — the same file drops onto a tee, mug,
favicon, app icon, software UI, or landing hero unchanged.

## The visual-verification loop (the designer's eyes)

SVG is generated blind, so **always render and look before declaring done** — this is
Gal's "review with fresh eyes" step and it catches optical errors code can't.

1. Write an HTML contact sheet that `<img>`s your exported `.svg` files on neutral and
   dark backgrounds and at small sizes.
2. Render it with the **Playwright MCP**: `playwright_navigate` to the `file://` URL
   (`headless: true`), then `playwright_screenshot` (`fullPage: true`, `savePng: true`).
3. **Read the PNG** and critique against the evaluation gate in
   `references/gal-shir-principles.md`. Fix in code, regenerate, re-render. Loop until
   it passes. Then `playwright_close`.

See `examples/orbit.mjs` (+ `examples/orbit-preview.png`) for a full worked run.

## Known constraints

- `convertPathData` (svgo) is disabled — it crashes on Paper.js smooth-curve output;
  paths are kept verbatim, still cleaned by the rest of svgo.
- The exported group relies on `fill="none"` inheritance so monoline strokes read as
  outlines — keep the group wrapper; don't strip it.
- One `setup()` per process/mark (Paper.js uses a single global scope).
