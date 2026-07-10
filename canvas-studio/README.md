# Canvas Studio

A local, collaborative design canvas where **you and your local AI co-edit the same
browser page**. Built on [Fabric.js](http://fabricjs.com).

- **You** work in a real browser window (select, drag, recolor, transform — zero friction).
- **Your AI** (Claude Code) attaches to that exact page: it **screenshots** the live canvas
  for real visual feedback and **scripts** the Fabric canvas to build and refine.
- **Pixel-level vector** paths, **arbitrary hex + gradients/shades**, **textures**,
  **shadows/blend depth**, **layers** — and **depth & negative space by layering** (z-order
  on a real canvas), not fragile boolean cuts.

## Run

```bash
cd canvas-studio
npm install      # first run only — installs Fabric + a browser for the studio
npm run studio   # opens the canvas window + the AI control API on :5179
```

The window that opens **is your canvas** (it auto-seeds the mindmap.io mark as a starting
point). Keep `npm run studio` running; `Ctrl-C` stops it. Usually your AI launches this for
you — just ask it to design with you on the canvas.

## Architecture

```
 you ──────────────┐
                   ▼
        ┌──────────────────────┐        one shared Playwright `page`
        │  Fabric.js canvas     │◀──────────────────────────────────────┐
        │  window.canvas/studio │                                       │
        └──────────────────────┘                                       │
                   ▲                                                    │
 npm run studio ───┘  serves control API on :5179  ◀── curl ──── your local AI
```

`scripts/studio.mjs` starts Vite, opens one real browser window (the human's canvas), and
serves a control API bound to that same page:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/screenshot` | GET | PNG of the live canvas (exactly what you see) |
| `/shapes` | GET | JSON of the current objects |
| `/export` | GET | SVG of the canvas (`canvas.toSVG()`) |
| `/fit` | GET | re-render |
| `/eval` | POST | run a JS expression in the page (`window.canvas` / `window.fabric` / `window.studio`) |

Because the page and the API share **one** Playwright `page`, a screenshot is exactly the
human's view and an eval mutates the human's canvas live.

## For the AI

See [SKILL.md](SKILL.md) for the collaboration loop, the Fabric scripting patterns, and how
to bring the design brain from the `gal-shir-brand-logo-design` skill. TL;DR: screenshot →
one change via `/eval` → screenshot & critique → loop; colours are exact (arbitrary hex +
gradients, no remapping); depth/negative space by layering; export SVG when done and run
SVGO before shipping.

## Troubleshooting

- **Port in use** — the app uses `5178` (Vite) and `5179` (control API). Free them or edit
  `vite.config.js` + `scripts/studio.mjs`.
- **Window didn't open** — ensure `npm install` finished (it downloads a browser via
  `playwright install chromium`). Re-run `npx playwright install chromium` if needed.
- **AI can't reach the API** — confirm `npm run studio` is running and shows
  "control API on http://localhost:5179".
- **Reset the canvas** — reload the window (it re-seeds), or POST `window.studio.clear()`.

## Status

Working: Fabric.js canvas, AI scripts the editor, screenshot + SVG export, shared single
page, seeded mindmap mark with gradient depth + layered negative-space halo. Next: a small
tools/panels layer for the human (gradient/layer pickers), texture presets, and an SVGO
export pass.
