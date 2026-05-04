# Studio Principles

Design philosophies distilled from five companies that ship deliberate, minimalist interfaces. Each section extracts the transferable principle -- not the brand, but the idea.

---

## Vercel -- Precision Engineering

Vercel treats UI like mechanical engineering: tolerances matter, every alignment is intentional, and invisible work produces the polished result.

### Principles

**Optical over mathematical.** Adjust +/-1px when human perception disagrees with the grid. The eye is the final judge, not the ruler. A centered icon may need to shift 1px right to *look* centered.

**Animate only causality.** Animation exists to show cause and effect ("I clicked this, that opened") or to add deliberate delight. If an animation doesn't clarify a relationship or bring joy, it's noise. Never use `transition: all` -- name every property you animate.

**Design all states.** Empty, loading, sparse, dense, error, success. A component isn't designed until every state is designed. Skeletons must match final layout exactly -- no layout shift.

**GPU-first motion.** Only animate `transform` and `opacity`. Properties that trigger reflow (`width`, `height`, `top`, `left`) are banned from transitions. Performance is a design decision.

**Inline over hidden.** Prefer inline help text over tooltips. Prefer visible labels over icon-only buttons. If information matters, show it -- don't make users hover to discover it.

**Content dictates copy.** Use specific button labels ("Save API Key") not generic ones ("Submit"). Active voice. Figures not words ("8 deployments" not "eight"). Constructive error messages that explain resolution, not just the problem.

### Source

[Vercel Web Interface Guidelines](https://vercel.com/design/guidelines) -- the most comprehensive public design system guidelines available. [Design Engineering at Vercel](https://vercel.com/blog/design-engineering-at-vercel) -- their philosophy on craft, iteration, and shipping.

---

## Notion -- The Blank Page

Notion's founder Ivan Zhao studied cognitive science and fine arts. He treats software as a blank page -- power comes from what you can do with it, not from what's already on it.

### Principles

**Beauty is function.** A visually harmonious interface creates mental clarity. Clean layout, generous whitespace, and considered typography aren't luxury -- they reduce cognitive load. Software that looks calm helps you think clearly.

**The drunk test.** "If someone's drunk, can they understand it?" Most users are distracted and tired. Overly complex UI fails real-world use. Design for the worst attention span you'll encounter.

**Golden path first.** 80% of users follow the primary flow. Spend 80% of design energy on that path. Edge cases matter, but optimizing for them at the cost of the primary experience is a trap.

**Systems, not features.** Every new element must harmonize with existing ones. "When you add a new LEGO brick, it might pollute the whole thing." Think system-first -- does this addition compose well with everything already there?

**Mine history.** The best design solutions often already exist in architecture, typography, or early computing. Study Bauhaus, mid-century furniture, Douglas Engelbart, Alan Kay. Don't reinvent -- rediscover.

**Power through absence.** The interface should feel like a blank sheet of paper. Capability is latent, not in-your-face. Progressive disclosure: show the minimum, reveal depth on demand.

### Source

[The Ivanisms that power Notion](https://designerfounders.substack.com/p/ivan-zhao-notion) -- Ivan Zhao's design philosophy distilled. [Notion UX Review](https://adamfard.com/blog/notion-ux-review) -- third-party analysis of what makes the interface work.

---

## Figma -- Artful Problem-Solving

Figma believes design is about solving problems artfully -- caring equally about form and function.

### Principles

**Reliability over novelty.** Users trust tools that behave predictably. Consistency across every interaction builds that trust. A surprising interaction might delight once but frustrate forever after.

**Shared language.** Designers and developers should speak the same vocabulary. The design system is the dictionary. When the naming in Figma matches the naming in code, miscommunication drops to zero.

**Solve the problem, then make it beautiful.** Function first, form second -- but never function without form. An ugly solution that works is still an incomplete solution. The artfulness is not optional.

**Reduce human error.** Design systems exist primarily to prevent mistakes. Constraints (type scales, spacing tokens, color palettes) aren't limitations -- they're guard rails that free designers to focus on what matters.

### Source

[Figma Design Principles](https://www.figma.com/community/file/817913152610525667/figma-design-principles) -- the team's published principles. [Config 2025 recap](https://www.figma.com/blog/config-2025-recap/) -- their evolving philosophy on AI and design.

---

## Cursor -- Meticulous Minimalism

Cursor's interface is described as "astonishingly minimalist" yet underpinned by meticulous consideration. Every element that survives the design process is load-bearing.

### Principles

**Communicate state clearly.** Users should never wonder "what's happening right now?" Every operation should have visible feedback. Confirm uncommitted changes. Show progress. Dispel anxiety about invisible processes.

**Reduce barriers.** The interface should welcome non-experts. Complexity exists in the system, not in the UI. Powerful capability behind a simple surface.

**Structure determines quality.** The clarity of the underlying system (architecture, rules, naming) determines the quality of what gets built on top. A well-structured foundation produces better outcomes than pixel-polishing on a shaky base.

**One environment.** Don't split the user's attention across disconnected tools. Every change happens in the same context where logic already exists. Integration beats context-switching.

### Source

[Cursor for Designers](https://cursor.com/for/designers) -- their approach to designer workflows. [Cursor's Design Mode](https://www.builder.io/blog/cursor-design-mode-visual-editing) -- visual editing philosophy.

---

## Anthropic -- Intentional Boldness

Anthropic's design philosophy resists the safe defaults that AI tools tend to produce (Inter font, purple gradients, minimal animation) in favor of deliberate aesthetic choices.

### Principles

**Intentional, not decorative.** Typography, color palettes, and animations should feel like deliberate choices, not defaults. Ask: "Did I choose this, or did I accept a suggestion?" If the latter, reconsider.

**Bold over safe.** Distinctive design is more honest than generic design. A product that looks like itself -- not like every other SaaS dashboard -- communicates confidence and care.

**Interoperability over empire.** Don't replace the user's existing tools -- meet them where they work. Export to their formats. Connect via their protocols. Design that respects the user's ecosystem, not one that traps them.

**Stack, don't sprawl.** Each tool in the product suite has a clear purpose. Conversation. Development. Collaboration. Design. They stack vertically (depth) not horizontally (breadth). Each layer does one thing well.

### Source

[Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs) -- Anthropic's approach to design tooling. [Claude Design Guide 2026](https://www.buildfastwithai.com/blogs/claude-design-anthropic-guide-2026) -- practical application of their philosophy.

---

## tldraw -- Infrastructure With Taste

tldraw's creator Steve Ruiz came from fine arts, not computer science. He treats aesthetic judgment as a first-class engineering concern -- the technical aspects of drawing a perfect arrow are secondary to developing an eye for what "good" actually looks like. tldraw positions itself as infrastructure (what CodeMirror did for text editors), not as a product.

### Principles

**Strong defaults, highly customizable.** Ship a complete, production-ready experience out of the box, but make every layer replaceable. The default should be good enough that most people never change it. The architecture should be open enough that power users can replace anything.

**Extensions are first-class citizens.** Every built-in feature is implemented using the same API available to third-party developers. No privileged internal code. No "neutered subset" for plugins. If the core team can build it, so can you.

**You can't design a framework de novo.** Don't abstract before you observe. tldraw's v1-to-v2 rewrite failed when designed top-down; it succeeded when redesigned after watching how people actually used v1. Extension points should emerge from real usage, not speculation.

**Convention-driven, empirically validated.** Follow established design tool conventions (Figma, Illustrator, Photoshop) rather than innovating for innovation's sake. When conventions conflict or don't exist, conduct systematic empirical research -- then aim to define the next convention.

**Direct manipulation on a uniform surface.** Creation and editing happen in the same space. Every element -- video, image, sticky note, code sandbox -- responds to the same gestures: drag, resize, delete, copy. The canvas doesn't privilege any content type.

**Invisible complexity.** Interactions should feel effortless. Pressure sensitivity, palm rejection, zoom-adaptive precision, and advanced stroke generation all operate behind the scenes. The user should never perceive the engineering cost -- that's the library's problem.

**Mathematical correctness prevents drift.** Small calculation errors compound across operations. Dragging uses delta from drag origin, not current position. Rotation retains the initial center point throughout a session. Zoom scales relative to cursor position. Get the math right or interactions feel increasingly wrong.

**Taste is an engineering concern.** Many design challenges are fundamentally about aesthetic judgment, not algorithms. The `perfect-freehand` and `perfect-arrows` libraries exist because someone cared about what "good" looks like at the sub-pixel level. Craft is not a polish step -- it's the design process itself.

### Source

[Steve Ruiz - Perfect Dragging](https://www.steveruiz.me/posts/perfect-dragging) -- interaction design methodology. [Latent Space Podcast - The Accidental AI Canvas](https://www.latent.space/p/tldraw) -- design philosophy and origins. [Metamuse Podcast - Infinite Canvases](https://museapp.com/podcast/59-infinite-canvases/) -- framework design lessons from v1 to v2. [tldraw Blog - A Review of Design Tool Hover Areas](https://tldraw.dev/blog/a-review-of-design-tool-hover-areas) -- empirical interaction research in practice.

---

## Cross-Cutting Themes

Six companies, six cultures, one recurring pattern:

1. **Subtract before you add.** All six ship less UI, not more.
2. **Invisible quality.** The best design work is what users never notice -- smooth performance, proper alignment, considered accessibility, mathematically correct interactions.
3. **Constraints liberate.** Type scales, spacing tokens, limited palettes, uniform APIs -- constraints free designers from trivial decisions so they can focus on meaningful ones.
4. **State is visible.** Users should always know what's happening, what they can do, and what just changed.
5. **Craft is not optional.** Every company treats visual polish as integral to function, not as a nice-to-have applied after the "real work." Taste is an engineering concern.
6. **Observe before abstracting.** Convention over invention. Follow established patterns; only diverge when you've researched the space and can define something better.
