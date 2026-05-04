# The Eight Principles

Each principle includes what it means, how to test for it, and what violation looks like.

---

## 1. Contrast

**What:** Differences in color, weight, size, or shape that make important things visually distinct from unimportant things.

**Test:** Squint at the screen. Can you still tell what the primary action is? Can you distinguish headings from body text? Does the most important element pop without reading a single word?

**Violations:**
- Everything is the same font weight
- Primary and secondary buttons look identical except for label text
- Active and inactive states differ only by a subtle gray shift
- Text and background have insufficient contrast ratio (use APCA, not WCAG 2)

**Fix direction:** Increase difference. If two things have different importance, they must look different. Use weight, size, color, or position -- but not all at once.

---

## 2. Balance

**What:** Distribution of visual weight so the layout feels stable, not lopsided. Can be symmetrical (formal), asymmetrical (dynamic), or radial (centered).

**Test:** Cover half the screen. Does the other half feel complete? Does any corner feel empty while another feels cramped?

**Violations:**
- Heavy sidebar with an empty content area
- All actions clustered in one corner
- Uneven padding (40px left, 12px right)
- A modal with content hugging the top and empty space below

**Fix direction:** Redistribute weight. Adjust spacing, move elements, or add/remove whitespace to restore equilibrium. Asymmetric balance is fine -- the weights just need to feel intentional.

---

## 3. Emphasis

**What:** Exactly one focal point per view that captures attention first. Secondary and tertiary elements support but don't compete.

**Test:** Show the screen to someone for 2 seconds, then cover it. Ask what they noticed first. If they name more than one thing, emphasis is broken. If they name nothing, it's missing.

**Violations:**
- Two equally prominent CTAs fighting for attention
- Bold red text scattered across the page (everything is urgent = nothing is)
- A banner, a modal, and a toast notification all visible simultaneously
- No clear entry point -- the eye wanders

**Fix direction:** Promote one element, demote everything else. Use size, color, position, and whitespace to create a clear visual entry point. There can be only one king.

---

## 4. Repetition / Pattern

**What:** Consistent use of the same visual treatment for the same semantic meaning. Builds rhythm, trust, and predictability.

**Test:** Find two elements that serve the same purpose (e.g., two "delete" buttons, two section headers). Do they look identical? Same font, size, color, spacing, icon style?

**Violations:**
- Card borders: 1px solid gray here, 2px solid gray there
- Inconsistent icon sets (mixing outlined and filled)
- Date formats: "Jan 5" in one place, "2025-01-05" in another
- Different spacing between identical list items

**Fix direction:** Extract the pattern. Define it once (token, class, component) and reuse everywhere. Deviation from a pattern must be intentional and justified.

---

## 5. Proportion / Scale

**What:** Size encodes importance. Larger = more important. This applies to text, buttons, spacing, and sections.

**Test:** Rank elements by visual size. Does that ranking match their actual importance to the user? Is the page title bigger than body text? Is the primary action bigger than secondary?

**Violations:**
- A "Cancel" button the same size as "Confirm"
- Metadata (timestamps, IDs) displayed at the same size as primary content
- A help icon that's visually heavier than the main heading
- Equal-height rows when some items are clearly more important

**Fix direction:** Scale things to match their importance. Use a type scale (e.g., 12/14/16/20/24/32). Apply the same logic to spacing, icons, and interactive targets.

---

## 6. White Space / Negative Space

**What:** Empty space that groups related items, separates unrelated ones, and gives the eye a place to rest. White space is not wasted -- it's structural.

**Test:** Can you tell which elements are grouped together without reading labels? Is there room to breathe between sections? Does the layout feel calm or claustrophobic?

**Violations:**
- Elements crammed edge-to-edge with no padding
- Equal spacing everywhere (nothing is grouped)
- A divider line used where spacing alone would communicate the boundary
- Content touching the viewport edge on mobile

**Fix direction:** Use the Gestalt principle of proximity: things that are close together are perceived as related. Increase space between unrelated groups. Decrease space within related groups. Remove dividers that whitespace alone can replace.

---

## 7. Hierarchy

**What:** Arrangement of elements so the viewer's eye follows a predictable path from most to least important. Typically top-to-bottom, left-to-right (in LTR languages).

**Test:** Read the page like a newspaper. Does the headline come first? Can you skim headings and understand the structure without reading body text? Is the CTA findable within 3 seconds?

**Violations:**
- The most important information is below the fold
- Navigation competes with content for attention
- Flat layouts where everything is at the same level (no headings, subheadings)
- Actions hidden inside menus when they should be surface-level

**Fix direction:** Establish levels. H1 > H2 > H3 > body. Primary action > secondary > tertiary. Use position, size, weight, and color to encode each level distinctly.

---

## 8. Movement

**What:** Guiding the viewer's eye through the composition in a deliberate sequence. Achieved through layout, alignment, visual flow lines, and progressive disclosure.

**Test:** Trace where your eye goes naturally. Does it follow the intended path: headline -> context -> action? Or does it jump around randomly?

**Violations:**
- Eye bounces between left sidebar, center content, and right panel with no clear priority
- A form where labels are far from their inputs (eye has to jump)
- Content that requires scrolling back up to take action
- Animation that draws attention away from the current task

**Fix direction:** Align elements along a clear axis. Place related items near each other. Position the primary action at the end of the natural reading flow. Use animation only to reinforce this flow, never to interrupt it.
