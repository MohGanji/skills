import * as fabric from 'fabric';
import rough from 'roughjs';

const PAPER = '#f7f7f4', INK = '#1a1a2e', BRAND = '#0d9488', GRID = '#e6e6df';

// ── canvas ───────────────────────────────────────────────────────────────────
const canvas = new fabric.Canvas('c', {
  backgroundColor: '',            // transparent — the grid layer draws the paper
  preserveObjectStacking: true,   // stable z-order (matters for layered depth)
  selection: true,
});
const resize = () => canvas.setDimensions({ width: window.innerWidth, height: window.innerHeight });
resize();
window.addEventListener('resize', () => { resize(); canvas.requestRenderAll(); });

// ── grid (drawn behind objects, respects zoom + pan) ─────────────────────────
canvas.on('before:render', () => {
  const ctx = canvas.getContext();
  const vt = canvas.viewportTransform, zoom = vt[0];
  const w = canvas.getWidth(), h = canvas.getHeight();
  ctx.save();
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);           // paper
  const gap = 40 * zoom;
  if (gap > 6) {
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    const sx = ((vt[4] % gap) + gap) % gap, sy = ((vt[5] % gap) + gap) % gap;
    ctx.beginPath();
    for (let x = sx; x < w; x += gap) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = sy; y < h; y += gap) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
  }
  ctx.restore();
});

// ── zoom (wheel) + pan (space/alt/middle-drag) ───────────────────────────────
canvas.on('mouse:wheel', (opt) => {
  const e = opt.e; let zoom = canvas.getZoom() * 0.999 ** e.deltaY;
  zoom = Math.min(8, Math.max(0.15, zoom));
  canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom);
  e.preventDefault(); e.stopPropagation();
});
let panning = false, spaceHeld = false, last = null;
canvas.on('mouse:down', (opt) => {
  const e = opt.e;
  if (e.altKey || e.button === 1 || spaceHeld) { panning = true; canvas.selection = false; last = { x: e.clientX, y: e.clientY }; }
});
canvas.on('mouse:move', (opt) => {
  if (!panning) return; const e = opt.e;
  const vt = canvas.viewportTransform; vt[4] += e.clientX - last.x; vt[5] += e.clientY - last.y;
  canvas.setViewportTransform(vt); last = { x: e.clientX, y: e.clientY };
});
canvas.on('mouse:up', () => { panning = false; canvas.selection = true; });

// ── undo / redo (toJSON history) ─────────────────────────────────────────────
let history = [], future = [], locked = false;
const GRAD_KEYS = ['selectable', 'evented'];
const snap = () => { if (locked) return; future = []; history.push(canvas.toJSON(GRAD_KEYS)); if (history.length > 60) history.shift(); };
['object:added', 'object:modified', 'object:removed'].forEach((ev) => canvas.on(ev, snap));
async function restore(json) { locked = true; await canvas.loadFromJSON(json); canvas.requestRenderAll(); locked = false; }
async function undo() { if (history.length < 2) return; future.push(history.pop()); await restore(history[history.length - 1]); }
async function redo() { if (!future.length) return; const j = future.pop(); history.push(j); await restore(j); }

// ── keyboard ─────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') spaceHeld = true;
  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (meta && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
  else if ((e.key === 'Backspace' || e.key === 'Delete') && canvas.getActiveObjects().length) {
    e.preventDefault(); canvas.remove(...canvas.getActiveObjects()); canvas.discardActiveObject(); canvas.requestRenderAll();
  }
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') spaceHeld = false; });

// ── expose to AI + human ─────────────────────────────────────────────────────
window.fabric = fabric;
window.canvas = canvas;
window.editor = canvas;
window.studio = {
  shapes() {
    return canvas.getObjects().map((o) => ({
      type: o.type, left: Math.round(o.left), top: Math.round(o.top),
      w: Math.round((o.width || 0) * o.scaleX), h: Math.round((o.height || 0) * o.scaleY),
      fill: typeof o.fill === 'string' ? o.fill : `${o.fill?.type || ''}-gradient`,
      stroke: o.stroke || null, strokeWidth: o.strokeWidth || 0,
    }));
  },
  exportSvg() { return canvas.toSVG(); },
  clear() { canvas.remove(...canvas.getObjects()); canvas.requestRenderAll(); },
  radial(x1, y1, r1, x2, y2, r2, stops) { return new fabric.Gradient({ type: 'radial', coords: { x1, y1, r1, x2, y2, r2 }, colorStops: stops }); },
  add(o) { canvas.add(o); canvas.requestRenderAll(); return o; },
  undo, redo,
  fit() { zoomToFit(); return true; },
  seedMindmap,
};

function zoomToFit(pad = 120) {
  const objs = canvas.getObjects(); if (!objs.length) return;
  const b = objs.reduce((a, o) => { const r = o.getBoundingRect(); return {
    l: Math.min(a.l, r.left), t: Math.min(a.t, r.top), r: Math.max(a.r, r.left + r.width), b: Math.max(a.b, r.top + r.height) }; },
    { l: Infinity, t: Infinity, r: -Infinity, b: -Infinity });
  const cw = canvas.getWidth(), ch = canvas.getHeight();
  const zoom = Math.min((cw - pad) / (b.r - b.l), (ch - pad) / (b.b - b.t), 3);
  canvas.setViewportTransform([zoom, 0, 0, zoom,
    cw / 2 - ((b.l + b.r) / 2) * zoom, ch / 2 - ((b.t + b.b) / 2) * zoom]);
}

// paint a cloudy "ink in water" field from a palette (soft, feathered, organic)
// pal = { base:'#hex', dark:'r,g,b', light:'r,g,b', core:'r,g,b', scale?:1 }
function paintInk(ctx, w, h, pal) {
  const s = pal.scale || 1;
  ctx.save();
  ctx.fillStyle = pal.base; ctx.fillRect(0, 0, w, h);
  ctx.filter = `blur(${7 * s}px)`;
  const blob = (rgb, n, amin, amax, rmin, rmax) => {
    for (let i = 0; i < n; i++) {
      const cx = Math.random() * w, cy = Math.random() * h, r = (rmin + Math.random() * (rmax - rmin)) * s;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const a = amin + Math.random() * (amax - amin);
      g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
  };
  blob(pal.dark, 30, 0.18, 0.5, 60, 210);
  blob(pal.light, 22, 0.12, 0.34, 45, 170);
  blob(pal.core, 8, 0.45, 0.72, 30, 95);
  ctx.restore();
}

// build an ink-in-water IMAGE masked to whatever `maskFn(ctx)` draws (in world coords)
function buildInk(maskFn, ox, oy, tw, th, pal) {
  const tex = document.createElement('canvas'); tex.width = tw; tex.height = th;
  const tx = tex.getContext('2d');
  paintInk(tx, tw, th, pal);
  const mask = document.createElement('canvas'); mask.width = tw; mask.height = th;
  const mc = mask.getContext('2d');
  mc.save(); mc.translate(-ox, -oy); mc.fillStyle = '#000'; mc.strokeStyle = '#000'; maskFn(mc); mc.restore();
  tx.globalCompositeOperation = 'destination-in'; tx.drawImage(mask, 0, 0); tx.globalCompositeOperation = 'source-over';
  return new fabric.Image(tex, { left: ox, top: oy, originX: 'left', originY: 'top' });
}

// ── builders return objects; wrappers/gallery below compose them ─────────────
function buildMindmap() {
  const W = 74, L = 300, M = 512, R = 724, footY = 660, legTop = 470;
  const h = 128;                    // cubic control-handle length -> smooth, TANGENT shoulders
  // node sizing on a golden-ratio anchor: branch ⌀ ≈ stroke × φ (74×1.618≈120 -> r60);
  // origin only a touch larger for gentle root emphasis (subtle, not the old 24% gap).
  const nodeCy = 360, nodeR = 66, branchR = 60;

  // the "m" as an INK-IN-WATER texture (cloudy blend of the landing page's primary
  // #1a1a2e and secondary/grey #6b6b7b), masked to the smooth monoline + branch nodes.
  const paths = [
    `M${L} ${footY} L${L} ${nodeCy}`,                                            // raised left trunk
    `M${L} ${legTop} C${L} ${legTop - h} ${M} ${legTop - h} ${M} ${legTop}`,     // smooth arch L→M
    `M${M} ${legTop} L${M} ${footY}`,                                            // middle leg
    `M${M} ${legTop} C${M} ${legTop - h} ${R} ${legTop - h} ${R} ${legTop}`,     // smooth arch M→R
    `M${R} ${legTop} L${R} ${footY}`,                                            // right leg
  ];
  const INK_M = { base: '#4a4a57', dark: '26,26,46', light: '107,107,123', core: '20,20,34' };

  const inkM = buildInk((mc) => {
    mc.lineWidth = W; mc.lineCap = 'round'; mc.lineJoin = 'round';
    paths.forEach((d) => mc.stroke(new Path2D(d)));
    [[M, footY, branchR], [R, footY, branchR]].forEach(([x, y, r]) => { mc.beginPath(); mc.arc(x, y, r, 0, Math.PI * 2); mc.fill(); });
  }, 250, 308, 556, 432, INK_M);

  // ROOT node (mascot) = the teal two-shade faceted gem, lifted off the "m" by a
  // paper-coloured HALO (negative space by layering).
  const disc = (cx, cy, r, fill) => new fabric.Circle({ left: cx, top: cy, radius: r, originX: 'center', originY: 'center', fill });
  const halo = disc(L, nodeCy, nodeR + 14, PAPER);
  const node = disc(L, nodeCy, nodeR, BRAND);
  node.set('fill', new fabric.Gradient({
    type: 'linear',
    coords: { x1: nodeR * 0.35, y1: nodeR * 0.2, x2: nodeR * 1.6, y2: nodeR * 1.85 },
    colorStops: [
      { offset: 0, color: '#41c9b9' }, { offset: 0.5, color: '#41c9b9' },
      { offset: 0.5, color: '#0a5f58' }, { offset: 1, color: '#0a5f58' },
    ],
  }));

  return [inkM, halo, node];
}

// draw a faint hexagonal (graphene) lattice as an image — the brand "material"
function drawHex(ctx, cx, cy, R) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 90); const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.stroke();
}
function buildLattice(ox, oy, w, h, R, color) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d');
  x.strokeStyle = color; x.lineWidth = 2.5;
  const hexH = R * 2, hexW = Math.sqrt(3) * R;
  for (let row = -1; row * hexH * 0.75 < h + R; row++)
    for (let col = -1; col * hexW < w + R; col++)
      drawHex(x, col * hexW + (row % 2 ? hexW / 2 : 0), row * hexH * 0.75, R);
  return new fabric.Image(cv, { left: ox, top: oy, originX: 'left', originY: 'top', opacity: 1 });
}

// GRAPHENE "m" = an exact 2-hexagon fragment (humps = hexagon tops, legs = vertical
// edges). opts: { haloAll } flat nodes with halo on all or just the mascot;
// { sketch:true, roughness } graphite pencil render (low roughness = subtle).
function buildGraphene(opts = {}) {
  const { haloAll = false, sketch = false, roughness = 1 } = opts;
  const BL = 132, g = 0.8660254 * BL, NR = 30, BT = 22;
  const NODE = '#6b6b7b', BONDC = '#9b9bab', GRAPHITE = '#54545e';
  const V = {
    p1: [0, -BL], p2: [g, -BL / 2], p7: [2 * g, -BL], p8: [3 * g, -BL / 2],
    m6: [-g, -BL / 2], l5: [-g, BL / 2], l3: [g, BL / 2], l9: [3 * g, BL / 2],
  };
  const bonds = [[V.m6, V.p1], [V.p1, V.p2], [V.p2, V.p7], [V.p7, V.p8], [V.m6, V.l5], [V.p2, V.l3], [V.p8, V.l9]];
  const greyPts = [V.p1, V.p2, V.p7, V.p8, V.l5, V.l3, V.l9];
  const disc = (p, r, fill) => new fabric.Circle({ left: p[0], top: p[1], radius: r, originX: 'center', originY: 'center', fill });
  const objs = [];

  if (sketch) {
    const OX = 180, OY = 190, TW = 640, TH = 340, sub = roughness < 1.3;
    const cv = document.createElement('canvas'); cv.width = TW; cv.height = TH;
    const rc = rough.canvas(cv);
    bonds.forEach(([a, b]) => { for (let k = 0; k < (sub ? 1 : 2); k++) rc.line(a[0] + OX, a[1] + OY, b[0] + OX, b[1] + OY,
      { stroke: GRAPHITE, strokeWidth: BT * 0.8, roughness: roughness + k * 0.6, bowing: roughness * 0.8 }); });
    greyPts.forEach((p) => rc.circle(p[0] + OX, p[1] + OY, NR * 2,
      { stroke: GRAPHITE, strokeWidth: 2, fill: GRAPHITE, fillStyle: 'hachure', hachureGap: sub ? 7 : 4.5, fillWeight: sub ? 0.9 : 1.4, roughness }));
    objs.push(new fabric.Image(cv, { left: -OX, top: -OY, originX: 'left', originY: 'top' }));
  } else {
    bonds.forEach(([a, b]) => objs.push(new fabric.Line([...a, ...b], { stroke: BONDC, strokeWidth: BT, strokeLineCap: 'round' })));
    const haloPts = haloAll ? [V.m6, ...greyPts] : [V.m6];
    haloPts.forEach((p) => objs.push(disc(p, NR + 9, PAPER)));
    greyPts.forEach((p) => objs.push(disc(p, NR, NODE)));
  }
  if (sketch) objs.push(disc(V.m6, NR + 9, PAPER));   // mascot halo over the pencil

  const node = disc(V.m6, NR, BRAND);                 // top-left = teal two-shade mascot
  node.set('fill', new fabric.Gradient({ type: 'linear',
    coords: { x1: NR * 0.35, y1: NR * 0.2, x2: NR * 1.6, y2: NR * 1.85 },
    colorStops: [{ offset: 0, color: '#41c9b9' }, { offset: 0.5, color: '#41c9b9' }, { offset: 0.5, color: '#0a5f58' }, { offset: 1, color: '#0a5f58' }] }));
  objs.push(node);

  return objs;
}

// ── wrappers, gallery, and the clone-to-iterate primitive ────────────────────
function finalize() { canvas.requestRenderAll(); locked = false; history = [canvas.toJSON(GRAD_KEYS)]; future = []; zoomToFit(); }
function seedMindmap() { locked = true; canvas.remove(...canvas.getObjects()); buildMindmap().forEach((o) => canvas.add(o)); finalize(); }
function seedGraphene(o) { locked = true; canvas.remove(...canvas.getObjects()); buildGraphene(o).forEach((x) => canvas.add(x)); finalize(); }

// place a built iteration as one movable group at column cx, with a caption
function place(objs, cx, label, target = 330) {
  const grp = new fabric.Group(objs, { originX: 'center', originY: 'center' });
  grp.scale(target / Math.max(grp.width, grp.height));
  grp.set({ left: cx, top: 0 });
  canvas.add(grp);
  canvas.add(new fabric.Text(label, { left: cx, top: target / 2 + 34, fontSize: 17, fill: '#6b6b7b', fontFamily: 'system-ui', originX: 'center', originY: 'top', selectable: false }));
  return grp;
}
// the running GALLERY of iterations — they accumulate on the canvas over time
function gallery() {
  locked = true; canvas.remove(...canvas.getObjects());
  const variants = [
    ['ink-in-water', buildMindmap()],
    ['graphene · 1 haloed', buildGraphene({})],
    ['graphene · all haloed', buildGraphene({ haloAll: true })],
    ['graphene · subtle sketch', buildGraphene({ sketch: true, roughness: 1 })],
  ];
  variants.forEach(([label, objs], i) => place(objs, i * 430, label));
  finalize();
}
window.studio.seedMindmap = seedMindmap;
window.studio.seedGraphene = seedGraphene;
window.studio.gallery = gallery;
window.studio.place = place;
// clone the active iteration and drop the copy to the right — "iterate on a clone"
window.studio.clone = async (dx = 430, dy = 0) => {
  const sel = canvas.getActiveObject(); if (!sel) return null;
  const c = await sel.clone(); c.set({ left: sel.left + dx, top: sel.top + dy });
  canvas.add(c); canvas.setActiveObject(c); canvas.requestRenderAll(); return c;
};

gallery();
console.log('[canvas-studio] Fabric ready — grid · zoom(wheel) · pan(alt/space-drag) · undo(⌘Z)/redo(⌘⇧Z) · delete. window.canvas/fabric/studio.');
