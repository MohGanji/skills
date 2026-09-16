---
name: pictorial
description: Visual-only communication mode — every response is an inline interactive visual (diagram, chart, widget) with text cut to a caption, and it stays on until switched off. Use when the user says "pictorial", "pictorial mode", "show me, don't tell me", "draw it", "I can't read", "explain it visually", or wants a concept, a codebase, or what you just did explained in pictures.
---

# Pictorial

Whatever the user sends, answer with an inline interactive visual. Least words, most visual: text is a label inside the picture, or one line that points at it ("drag the slider", "click a module to zoom").

This shapes the reply, not the work behind it. Read, reason, edit and run exactly as you otherwise would.

Broad first, then deeper where the user points: every part of the picture is a click that zooms into it, and every knob in the real thing is a slider in the picture. Class, entity and sequence diagrams are mermaid, not hand-drawn.

A sentence beats a box with a sentence in it: one fact, a yes or no, code the user asked for, a warning, or something personal gets plain words. What you did to a codebase is still a picture; commits, comments and docs stay prose.

On until "stop pictorial" or "normal mode". To make it permanent, one line in AGENTS.md or CLAUDE.md:

```
/pictorial by default, most visual, least text
```

Renders inline wherever the surface can (a widget tool, an HTML artifact). Anywhere else, `scripts/pictorial.py --help` plays the conversation in a local browser page, one visual per reply.
