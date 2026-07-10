// Worked example — brand "Orbit" (team scheduling that keeps everyone in sync).
//
// Concept (the intelligence the agent brings): a satellite on a tilted orbit — one
// element circling a shared centre = teams moving in sync around one schedule. The
// smart-minimal reading: it is also an abstract "O". One saturated hue (indigo).
//
// Run:  node examples/orbit.mjs   (from the skill root)

import {
  setup, grid, ellipse, circle, monoline, fill, palette, wordmark,
  centerOn, rotate, place, lockups, constructionSheet, save, paper, P,
} from '../engine/logokit.js';
import { mkdirSync } from 'fs';

const S = 1024;
setup({ size: S });
const g = grid(12);
const pal = palette('#4c5fef'); // ONE saturated brand hue + black/white

// ── the mark ───────────────────────────────────────────────────────────────
// Concept: one satellite circling a shared centre = a team moving in sync around one
// schedule. Refined per the study pieces: thinner uniform monoline and a smaller,
// cleaner accent dot. Kept background-robust (no white masking) so the asset drops onto
// any surface unchanged.
const cx = S / 2, cy = S / 2;
const orbitPath = ellipse(cx, cy, 340, 150);          // the orbit
monoline(orbitPath, { weight: 56, color: pal.ink });  // uniform monoline, round caps

// satellite dot sitting on the orbit (the one saturated-hue accent)
const t = -45 * Math.PI / 180;
const dotPt = P(cx + 340 * Math.cos(t), cy + 150 * Math.sin(t));
const dot = fill(circle(dotPt.x, dotPt.y, 64), pal.brand);

// tilt the whole system for motion
for (const it of [orbitPath, dot]) rotate(it, -22, P(cx, cy));

const mark = new paper.Group([orbitPath, dot]);

// ── the wordmark (custom-lettered, one concept twist) ────────────────────────
// twist: redraw the 'o' as a perfect geometric ring so the letterform echoes the
// mark's construction — a subtle, deliberate tie between symbol and wordmark.
const wm = wordmark('orbit', {
  font: 'poppins-semibold', size: 300, tracking: -8, color: pal.ink,
  twist: (glyphs, api) => {
    const gl = glyphs.find((x) => x.char === 'o');
    if (!gl || !gl.item) return;
    const b = gl.item.bounds;
    const r = Math.min(b.width, b.height) / 2;
    const ring = api.circle(b.center.x, b.center.y, r)
      .subtract(api.circle(b.center.x, b.center.y, r * 0.6));
    gl.item.replaceWith(ring);
    gl.item = ring;
  },
});

// ── export the full identity system ──────────────────────────────────────────
const outDir = new URL('./output/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const set = lockups({ mark, wordmark: wm, palette: pal });
for (const [name, svg] of Object.entries(set)) save(outDir + `orbit-${name}.svg`, svg);

// construction sheet: grid + orbit guide over the mark
const guides = [];
for (let i = 0; i <= 12; i++) {
  guides.push(new paper.Path.Line(P(g.at(i, 0)), P(g.at(i, 12))));
  guides.push(new paper.Path.Line(P(g.at(0, i)), P(g.at(12, i))));
}
save(outDir + 'orbit-construction.svg', constructionSheet(mark, guides, { color: pal.brand }));

console.log('Wrote', Object.keys(set).length + 1, 'assets to', outDir);
