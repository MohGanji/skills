// logokit — a constructive vector SDK for building brand marks the Gal Shir way.
//
// Philosophy: YOU (the agent) bring the concept — the smart, minimal symbol that
// encodes the brand story, values, audience, and strategy. logokit is the pair of
// hands that executes that concept pixel-perfectly in vector: an explicit grid and
// golden-ratio armature, boolean construction, modular circle-packing, uniform
// monoline strokes with rounded terminals, a disciplined one-hue palette, custom
// wordmark lettering from real fonts, and clean multi-lockup SVG export.
//
// It is deliberately NOT a template generator. There is no "makeLogo()". You compose
// primitives and boolean operations, the same way a designer builds in Illustrator.
//
// Built on: paper-jsdom (geometry + SVG i/o), opentype.js (fonts), svgo (clean output).

import paper from 'paper-jsdom';
import opentype from 'opentype.js';
import { optimize } from 'svgo';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute } from 'path';

export const PHI = 1.618033988749895;
const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = join(__dirname, 'fonts');

// Bundled OFL fonts. `rounded` = playful/mascot; poppins family = geometric tech sans.
const FONTS = {
  poppins: 'Poppins-Regular.ttf',
  'poppins-medium': 'Poppins-Medium.ttf',
  'poppins-semibold': 'Poppins-SemiBold.ttf',
  'poppins-bold': 'Poppins-Bold.ttf',
  rounded: 'VarelaRound-Regular.ttf',
};
const _fontCache = new Map();

function loadFont(key) {
  const file = FONTS[key] ? join(FONT_DIR, FONTS[key]) : (isAbsolute(key) ? key : join(FONT_DIR, key));
  if (!_fontCache.has(file)) _fontCache.set(file, opentype.loadSync(file));
  return _fontCache.get(file);
}

// ───────────────────────────────────────────────────────────── canvas / scope ──

let SIZE = 1024;

/** Initialise a fresh square canvas. Call once per mark. Returns { size, center, phi }. */
export function setup({ size = 1024 } = {}) {
  SIZE = size;
  paper.setup(new paper.Size(size, size));
  paper.project.clear();
  return { size, center: new paper.Point(size / 2, size / 2), phi: PHI };
}

export const P = (x, y) => new paper.Point(x, y);
export { paper };

// ────────────────────────────────────────────────────────────────── grid ──

/**
 * An explicit n×n construction grid inside a padded square — Gal snaps every shape
 * to a grid. Returns helpers to place and snap to grid coordinates.
 */
export function grid(n = 12, { padding = 0.08 } = {}) {
  const pad = SIZE * padding;
  const span = SIZE - pad * 2;
  const unit = span / n;
  const at = (col, row) => new paper.Point(pad + col * unit, pad + row * unit);
  const snap = (pt) => new paper.Point(
    pad + Math.round((pt.x - pad) / unit) * unit,
    pad + Math.round((pt.y - pad) / unit) * unit
  );
  return { n, unit, pad, span, at, snap, center: at(n / 2, n / 2) };
}

/**
 * A golden-ratio arc armature (Gal builds wave/motion curves on a golden spiral).
 * Returns quarter-turn arc guide paths whose radii step by 1/φ, plus radiusAt(i).
 */
export function goldenSpiral({ cx = SIZE / 2, cy = SIZE / 2, size = SIZE * 0.6, turns = 4, cw = true } = {}) {
  const radiusAt = (i) => size / Math.pow(PHI, i);
  const arcs = [];
  let cornerX = cx, cornerY = cy;
  let angle = 0; // 0=right,1=down,2=left,3=up  (quarter turns)
  for (let i = 0; i < turns; i++) {
    const r = radiusAt(i);
    const dir = cw ? angle : (4 - angle) % 4;
    // centre of this quarter arc sits at the shared corner
    const from = quarterPoint(cornerX, cornerY, r, dir, 0);
    const to = quarterPoint(cornerX, cornerY, r, dir, 1);
    const through = quarterPoint(cornerX, cornerY, r, dir, 0.5);
    arcs.push(new paper.Path.Arc(from, through, to));
    // advance the corner to the far end for the next (smaller) arc
    const next = quarterPoint(cornerX, cornerY, r, dir, 1);
    cornerX = 2 * next.x - quarterCenter(cornerX, cornerY, r, dir).x;
    cornerY = 2 * next.y - quarterCenter(cornerX, cornerY, r, dir).y;
    angle = (angle + 1) % 4;
  }
  return { arcs, radiusAt, cx, cy };
}
function quarterCenter(cornerX, cornerY, r, dir) {
  const offs = [[-r, 0], [0, -r], [r, 0], [0, r]][dir];
  return { x: cornerX + offs[0], y: cornerY + offs[1] };
}
function quarterPoint(cornerX, cornerY, r, dir, t) {
  const c = quarterCenter(cornerX, cornerY, r, dir);
  const start = [Math.PI, -Math.PI / 2, 0, Math.PI / 2][dir];
  const a = start + (Math.PI / 2) * t;
  return new paper.Point(c.x + r * Math.cos(a), c.y + r * Math.sin(a));
}

// ─────────────────────────────────────────────────────────── primitives ──
// Every primitive returns a paper.Path so you can boolean/transform/style it.

export const circle = (cx, cy, r) => new paper.Path.Circle(new paper.Point(cx, cy), r);
export const ellipse = (cx, cy, rx, ry) =>
  new paper.Path.Ellipse(new paper.Rectangle(cx - rx, cy - ry, rx * 2, ry * 2));
export const ring = (cx, cy, r, weight) => circle(cx, cy, r).subtract(circle(cx, cy, r - weight));
export const rect = (x, y, w, h, radius = 0) =>
  new paper.Path.Rectangle({ point: [x, y], size: [w, h], radius });
export const square = (cx, cy, s, radius = 0) => rect(cx - s / 2, cy - s / 2, s, s, radius);
export const line = (x1, y1, x2, y2) => new paper.Path.Line(new paper.Point(x1, y1), new paper.Point(x2, y2));
export const arc = (from, through, to) => new paper.Path.Arc(from, through, to);
export const fromPathData = (d) => new paper.Path(d);

export function polygon(cx, cy, r, sides, rotation = 0) {
  const path = new paper.Path({ closed: true });
  for (let i = 0; i < sides; i++) {
    const a = rotation - Math.PI / 2 + (i / sides) * Math.PI * 2;
    path.add(new paper.Point(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return path;
}
export const triangle = (cx, cy, r, rotation = 0) => polygon(cx, cy, r, 3, rotation);

export function star(cx, cy, rOuter, rInner, points = 5, rotation = 0) {
  const path = new paper.Path({ closed: true });
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = rotation - Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
    path.add(new paper.Point(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return path;
}

/** A heart built from two circles + a triangle (a recurring Gal building block). */
export function heart(cx, cy, size) {
  const r = size / 4;
  const left = circle(cx - r, cy - r, r);
  const right = circle(cx + r, cy - r, r);
  const body = new paper.Path({
    closed: true,
    segments: [
      [cx - size / 2, cy - r + r * 0.15],
      [cx, cy + size / 2],
      [cx + size / 2, cy - r + r * 0.15],
    ],
  });
  return left.unite(right).unite(body);
}

// ─────────────────────────────────────────────────── boolean construction ──

const _bool = (op) => (a, ...rest) => rest.reduce((acc, b) => acc[op](b), a);
export const unite = _bool('unite');
export const intersect = _bool('intersect');
export const exclude = _bool('exclude');
export const subtract = (a, ...cutters) => cutters.reduce((acc, c) => acc.subtract(c), a);
/** The signature Gal move: cut a hidden second reading out of the mark's body. */
export const negativeSpace = subtract;

// ───────────────────────────────────────────────────────── circle-packing ──

/**
 * Modular circle-packing — Gal assembles manes / clouds / textures from many
 * identical tangent circles. Packs `count` circles of radius `r` evenly around a
 * ring of radius `ringR`, optionally united into one path. Returns a paper.Path
 * (or Group if united=false).
 */
export function circlePack({ cx = SIZE / 2, cy = SIZE / 2, ringR, r, count, united = true, startAngle = -Math.PI / 2 } = {}) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = startAngle + (i / count) * Math.PI * 2;
    parts.push(circle(cx + ringR * Math.cos(a), cy + ringR * Math.sin(a), r));
  }
  if (!united) return new paper.Group(parts);
  return parts.reduce((acc, c) => acc.unite(c));
}

// ─────────────────────────────────────────────────────── transforms ──

export function centerOn(item, cx = SIZE / 2, cy = SIZE / 2) {
  item.position = new paper.Point(cx, cy);
  return item;
}
export function fitTo(item, target, { useStroke = true } = {}) {
  const b = useStroke ? item.strokeBounds : item.bounds;
  const s = target / Math.max(b.width, b.height);
  item.scale(s, item.position);
  return item;
}
export function place(item, x, y) { item.position = new paper.Point(x, y); return item; }
export function rotate(item, deg, around) { item.rotate(deg, around); return item; }

// ─────────────────────────────────────────────────────────── style ──
// Enforce Gal grammar: uniform monoline weight, rounded terminals, flat fills.

export function monoline(item, { weight = SIZE * 0.06, color = '#111111', cap = 'round', join = 'round' } = {}) {
  const items = item instanceof paper.Group ? item.children : [item];
  for (const it of items) {
    it.strokeColor = color;
    it.strokeWidth = weight;
    it.strokeCap = cap;
    it.strokeJoin = join;
    it.fillColor = null;
  }
  return item;
}
export function fill(item, color) {
  const items = item instanceof paper.Group ? item.children : [item];
  for (const it of items) { it.fillColor = color; it.strokeColor = null; }
  return item;
}
/**
 * Radial (or linear) gradient fill. Use sparingly — Gal's rule is one saturated hue;
 * a gradient should stay within that hue's family (e.g. cyan→bright-cyan).
 * `stops` is [[color, offset], …]. Defaults to a radial gradient from the item centre.
 */
export function gradientFill(item, stops, { center, radius, radial = true, angle = 0 } = {}) {
  const b = item.bounds;
  const c = center || b.center;
  const r = radius || Math.max(b.width, b.height) / 2;
  const rad = angle * Math.PI / 180;
  item.fillColor = {
    gradient: { stops, radial },
    origin: c,
    destination: new paper.Point(c.x + r * Math.cos(rad), c.y + r * Math.sin(rad)),
  };
  item.strokeColor = null;
  return item;
}
/** Round the corners of a polygon/segment path (rounded terminals everywhere). */
export function roundCorners(item, radius) {
  const src = item.clone();
  const out = new paper.Path({ closed: src.closed });
  const segs = src.segments;
  for (let i = 0; i < segs.length; i++) {
    const cur = segs[i].point;
    const prev = segs[(i - 1 + segs.length) % segs.length].point;
    const next = segs[(i + 1) % segs.length].point;
    const toPrev = prev.subtract(cur), toNext = next.subtract(cur);
    const rp = Math.min(radius, toPrev.length / 2), rn = Math.min(radius, toNext.length / 2);
    const p1 = cur.add(toPrev.normalize(rp)), p2 = cur.add(toNext.normalize(rn));
    out.add(new paper.Segment(p1));
    out.add(new paper.Segment(p2, cur.subtract(p2).multiply(0.55), null));
  }
  src.remove(); item.replaceWith(out);
  return out;
}

// ─────────────────────────────────────────────────────────── palette ──

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Gal's rule: exactly ONE saturated brand hue + black/white. Pass a brand hex.
 * Returns { brand, ink, paper, tint(t), shade(t) } — tints/shades stay on-hue for
 * mascot shading without introducing a second saturated colour.
 */
export function palette(brand, { ink = '#111111', paper: paperCol = '#ffffff' } = {}) {
  const { h, s, l } = hexToHsl(brand);
  const tint = (t) => hslToHex(h, s * (1 - 0.15 * t), clamp(l + (100 - l) * t, 0, 100));
  const shade = (t) => hslToHex(h, clamp(s + 6 * t, 0, 100), clamp(l - l * 0.55 * t, 0, 100));
  return { brand, ink, paper: paperCol, hue: h, tint, shade };
}

// ─────────────────────────────────────────────────────────── wordmark ──

/**
 * Custom-lettered wordmark from a real font, returned as outlined vector paths
 * (a paper.Group of per-glyph paths). Gal never types a wordmark and leaves it —
 * pass `twist(glyphs, api)` to redraw ONE letter so it enacts the concept.
 *
 *   glyphs: [{ char, item (paper.Path|null for spaces), advance }]
 *   api:    { paper, circle, rect, ... } convenience refs
 */
export function wordmark(text, {
  font = 'poppins-semibold', size = SIZE * 0.18, tracking = 0, color = '#111111', twist,
} = {}) {
  const f = loadFont(font);
  const scale = size / f.unitsPerEm;
  let x = 0;
  const glyphs = [];
  for (const ch of text) {
    const g = f.charToGlyph(ch);
    const d = g.getPath(x, 0, size).toPathData(3);
    const item = d && d.length > 2 ? new paper.Path(d) : null;
    const advance = g.advanceWidth * scale + tracking;
    glyphs.push({ char: ch, item, advance, x });
    x += advance;
  }
  if (typeof twist === 'function') {
    twist(glyphs, { paper, circle, rect, ellipse, triangle, polygon, star, P });
  }
  const group = new paper.Group(glyphs.filter((g) => g.item).map((g) => g.item));
  fill(group, color);
  return group;
}

// ─────────────────────────────────────────────────────────── export ──

function frame(items, { padding = 0.12, background = null, square = false, useStroke = true } = {}) {
  const arr = Array.isArray(items) ? items : [items];
  const group = new paper.Group(arr.map((i) => i.clone()));
  const b = useStroke ? group.strokeBounds : group.bounds;
  const pad = Math.max(b.width, b.height) * padding;
  let x, y, w, h;
  if (square) {
    const side = Math.max(b.width, b.height) + pad * 2;
    x = b.center.x - side / 2; y = b.center.y - side / 2; w = side; h = side;
  } else {
    x = b.x - pad; y = b.y - pad; w = b.width + pad * 2; h = b.height + pad * 2;
  }
  const inner = group.exportSVG({ asString: true });
  const bg = background ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${background}"/>` : '';
  group.remove();
  const f = (n) => n.toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x)} ${f(y)} ${f(w)} ${f(h)}" width="${Math.round(w)}" height="${Math.round(h)}">${bg}${inner}</svg>`;
}

/** Frame one or more items into a clean, optimised standalone SVG string. */
export function toSVG(items, opts = {}) {
  const raw = frame(items, opts);
  return optimize(raw, {
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,
            mergePaths: false,
            // convertPathData can crash on paper's smooth-curve output; keep paths verbatim.
            convertPathData: false,
          },
        },
      },
    ],
  }).data
    // Strip paper.js's noisy default group attributes. Value "none" is never
    // meaningful for these, and this never touches children's real values
    // (stroke-linecap="round") or the load-bearing group fill="none".
    .replace(/ (?:stroke-width|stroke-linecap|stroke-linejoin|font-family|font-size|font-weight|text-anchor)="none"/g, '')
    .replace(/ stroke-miterlimit="10"/g, '')
    .replace(/ style="mix-blend-mode:normal"/g, '');
}

export function save(filename, svg) {
  writeFileSync(filename, svg);
  return filename;
}

/**
 * Produce the full lockup set from a finished mark + wordmark + palette. Returns an
 * object of { name: svgString } ready to save: colour + mono marks, horizontal and
 * stacked lockups, app icon, and favicon. Every asset is one portable vector file.
 */
export function lockups({ mark, wordmark: wm, palette: pal, gap = SIZE * 0.06 }) {
  const out = {};
  out['mark-color'] = toSVG(mark, { background: null });
  const inkMark = mark.clone(); recolor(inkMark, pal.ink); out['mark-ink'] = toSVG(inkMark, {});
  const paperMark = mark.clone(); recolor(paperMark, pal.paper);
  out['mark-reverse'] = toSVG(paperMark, { background: pal.brand });

  if (wm) {
    // horizontal: mark left, wordmark right, vertically centred
    const m1 = mark.clone(), w1 = wm.clone();
    const mb = m1.strokeBounds;
    fitTo(m1, SIZE * 0.5); const mb2 = m1.strokeBounds;
    w1.scale((SIZE * 0.42) / w1.bounds.height, w1.position);
    m1.position = new paper.Point(0, 0);
    const wb = w1.strokeBounds;
    w1.position = new paper.Point(m1.strokeBounds.width / 2 + gap + wb.width / 2, 0);
    out['lockup-horizontal'] = toSVG(new paper.Group([m1, w1]), {});

    const m2 = mark.clone(), w2 = wm.clone();
    fitTo(m2, SIZE * 0.5);
    w2.scale((SIZE * 0.34) / w2.bounds.height, w2.position);
    m2.position = new paper.Point(0, 0);
    w2.position = new paper.Point(0, m2.strokeBounds.height / 2 + gap + w2.strokeBounds.height / 2);
    out['lockup-stacked'] = toSVG(new paper.Group([m2, w2]), {});
  }

  // app icon: squircle brand background, mark reversed to paper, ~60% inset
  const icon = mark.clone(); recolor(icon, pal.paper); fitTo(icon, SIZE * 0.58);
  centerOn(icon, SIZE / 2, SIZE / 2);
  const bg = rect(SIZE * 0.06, SIZE * 0.06, SIZE * 0.88, SIZE * 0.88, SIZE * 0.22);
  bg.fillColor = pal.brand;
  out['app-icon'] = toSVG(new paper.Group([bg, icon]), { padding: 0.02, square: true });

  // favicon: mark on brand, tighter
  const fav = mark.clone(); recolor(fav, pal.brand);
  out['favicon'] = toSVG(fav, { padding: 0.12, square: true });
  return out;
}

/** Overlay the construction guides (grid / golden arcs) on the mark for the sheet. */
export function constructionSheet(mark, guides = [], { color = '#ff0083' } = {}) {
  const g = new paper.Group(guides.map((x) => x.clone()));
  for (const it of g.children) { it.strokeColor = color; it.strokeWidth = SIZE * 0.004; it.fillColor = null; it.opacity = 0.5; }
  const m = mark.clone();
  return toSVG(new paper.Group([g, m]), { padding: 0.14, square: true });
}

function recolor(item, color) {
  const items = item instanceof paper.Group ? allPaths(item) : [item];
  for (const it of items) {
    if (it.strokeColor) it.strokeColor = color;
    if (it.fillColor) it.fillColor = color;
  }
  return item;
}
function allPaths(group) {
  const out = [];
  for (const c of group.children) c instanceof paper.Group ? out.push(...allPaths(c)) : out.push(c);
  return out;
}

// ─────────────────────────────────────────────────── colour helpers ──

function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const r = parseInt(c.slice(0, 2), 16) / 255, g = parseInt(c.slice(2, 4), 16) / 255, b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}
