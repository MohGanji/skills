---
name: setup-caveman
description: One-time setup skill that adds caveman as the default communication style to CLAUDE.md. Use when user wants caveman mode on by default or during bootstrap setup.
---

# Setup Caveman

One-time setup. Adds a single line to the project's CLAUDE.md enabling caveman mode by default.

## What it does

Append this line to CLAUDE.md (create the file if it doesn't exist):

```
Use caveman mode by default (see ~/.claude/skills/caveman/SKILL.md). Stop with "stop caveman".
```

## Key rules

- Never overwrite existing CLAUDE.md content -- only append
- If the line already exists, skip
