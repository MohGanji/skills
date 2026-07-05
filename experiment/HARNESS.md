# Harness reference implementation

Distilled from a real background-texture experiment (Astro landing page, 6 variants, label `BG`). Adapt names: `bg` → your decision label, `6` → your N, `myapp-bg-experiment` → a project-prefixed key.

## The switcher pill (Astro)

`src/components/BgExperiment.astro` — one self-contained file: markup, inline script, scoped styles.

```astro
---
/**
 * TEMPORARY — background experiment switcher (landing only).
 *
 * Floating pill (bottom-right) that cycles <body data-bg="1..N">,
 * persisted in localStorage('myapp-bg-experiment'). Variant CSS lives in
 * the single "TEMPORARY — background experiment" block in pages/index.astro.
 *
 * TO REMOVE: delete this file + its import/usage in pages/index.astro,
 *   and the marked style block there (the var() fallbacks restore baseline).
 * TO SHIP a winner: fold that variant's --bgx-* values into the real
 *   tokens (src/styles/tokens.css — and any duplicated token file, same
 *   commit, drift check), then remove as above.
 */
---

<!-- TEMPORARY — background experiment switcher -->
<button id="bg-experiment-pill" type="button" aria-label="Cycle background experiment variant">
  BG 1/6
</button>

<script is:inline>
  // TEMPORARY — inline so the stored variant applies before first paint.
  (() => {
    const KEY = 'myapp-bg-experiment';
    const N = 6;
    const pill = document.getElementById('bg-experiment-pill');
    const apply = (n) => {
      document.body.dataset.bg = String(n);
      if (pill) pill.textContent = 'BG ' + n + '/' + N;
    };
    const stored = parseInt(localStorage.getItem(KEY) || '1', 10);
    apply(stored >= 1 && stored <= N ? stored : 1);
    pill?.addEventListener('click', () => {
      const next = ((parseInt(document.body.dataset.bg, 10) || 1) % N) + 1;
      localStorage.setItem(KEY, String(next));
      apply(next);
    });
  })();
</script>

<style>
  /* Deliberately un-branded chrome: dashed border says "temporary tool". */
  #bg-experiment-pill {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    z-index: 100;
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    color: var(--color-muted, #666);
    background: var(--color-surface, #fff);
    border: 1px dashed var(--color-subtle, #bbb);
    border-radius: 999px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    cursor: pointer;
  }
  #bg-experiment-pill:active { transform: scale(0.97); }
</style>
```

Usage in the page (both lines marked):

```astro
// TEMPORARY — background experiment switcher (see the marked style block below).
import BgExperiment from '../components/BgExperiment.astro';
...
<!-- TEMPORARY — background experiment switcher (remove with the marked style block) -->
<BgExperiment />
```

## The variant CSS pattern

Base styles consume experiment hooks **with the baseline as fallback** — so unset props (or a deleted harness) render the untouched baseline:

```css
.hero::before {
  /* --bgx-* are TEMPORARY experiment hooks; fallbacks = baseline. */
  background-image: var(--bgx-image, var(--color-texture-grid));
  background-size: var(--bgx-size, var(--color-texture-grid-size));
}
```

All overrides in one fenced block, one selector per variant (variant 1 = baseline = no rule), each with a comment saying what the treatment *is* and why:

```css
/* ════════════════ TEMPORARY — background experiment ════════════════
   1  baseline (no override — the var() fallbacks)
   2  quadrillage + sporadic colored pluses at grid intersections
   ...
   TO REMOVE: delete this whole block + the BgExperiment import/usage;
   the --bgx-* fallbacks restore the baseline. TO SHIP: fold the winner's
   --bgx-* into the texture tokens in BOTH token files (drift check).
   ══════════════════════════════════════════════════════════════════ */
:global(body[data-bg='2']) {
  --bgx-image: url("data:image/svg+xml,..."), var(--color-texture-grid);
  --bgx-size: 588px 588px, var(--color-texture-grid-size);
}
/* ══════════════ end TEMPORARY — background experiment ══════════════ */
```

(`:global()` is Astro scoped-style syntax; in a plain stylesheet just `body[data-bg='2']`.)

## Framework notes

- **Plain HTML**: same component verbatim minus the frontmatter fence — `<button>` + `<script>` + `<style>` at the end of `<body>`.
- **React/Next**: make the pill a client component holding `variant` in state; initialize from `localStorage` (guard `typeof window`), and set `document.body.dataset` in an effect — or keep the inline pre-paint script in the document head and let the component only render the pill. For **copy/component variants**, branch on the variant value from a tiny context/store instead of CSS: `{variant === 2 ? <HeroB /> : <HeroA />}` — same numbering, same pill.
- **Vue/Svelte**: identical shape — one self-contained component, `document.body.dataset`, localStorage, mounted once on the page under test.
