---
name: setup-remotion
description: One-time setup skill that scaffolds the remotion-videos directory with shared design kit and inspirations folder, and adds Remotion conventions to CLAUDE.md. Use when user wants to set up Remotion video creation or during bootstrap setup.
---

# Setup Remotion

One-time guided setup. Creates the `remotion-videos/` directory with shared infrastructure and establishes the convention for how Remotion video projects are organized.

## Workflow

### Step 1 -- Check existing setup

- [ ] Check if `remotion-videos/` already exists
- [ ] Check if CLAUDE.md already has a Remotion section
- [ ] If both exist, inform user and exit

### Step 2 -- Scaffold remotion-videos directory

Ask user for confirmation, then:

- [ ] Create the full directory structure:

```
remotion-videos/
  shared/              # Shared Remotion design kit
    .gitkeep
  inspirations/        # Reference videos, images, styles
    .gitkeep
  my-first-video/      # npx create-video@latest --yes --blank my-first-video
```

**`shared/`** — Reusable React components matching the user's design system: colors, fonts, layouts, transitions, lower-thirds, brand assets. Every video composition imports from here unless the user wants a different style. Populated over time as the user builds videos.

**`inspirations/`** — Videos, images, and style references that the user mentions in chats as examples. Drop reference material here so the agent can see what the user is going for.

### Step 3 -- Optionally populate shared kit

- [ ] Check if the repo has frontend UI with design assets, brand colors, fonts, or a design system (e.g. `src/styles/`, `tailwind.config`, design tokens, logo files, component library)
- [ ] If found, ask user if they want to seed `remotion-videos/shared/` with components based on what exists (extract colors, fonts, common layouts)
- [ ] Skip this step entirely if the repo is backend-only, a framework/library, has no UI layer, or is new/empty -- the shared kit will be populated naturally as videos are created

### Step 4 -- Update CLAUDE.md

Append to CLAUDE.md:

```markdown
## Remotion Videos

All Remotion video projects live under `remotion-videos/`. Structure:
- `shared/` — Shared design kit (colors, fonts, layouts, components). Every composition imports from here by default.
- `inspirations/` — Reference material (videos, images, styles) dropped here for context.
- Each video is a separate React project scaffolded with `npx create-video@latest --yes --blank <name>`.

Always scaffold new videos inside `remotion-videos/`, never at the repo root. Use `/remotion` skill when working on video code.
```

### Step 5 -- Verify

- [ ] Confirm `remotion-videos/`, `remotion-videos/shared/`, and `remotion-videos/inspirations/` exist
- [ ] Show the user what was added to CLAUDE.md
- [ ] Suggest creating their first video: `cd remotion-videos && npx create-video@latest --yes --blank my-first-video`

## Key rules

- Never overwrite existing CLAUDE.md content -- only append
- If `remotion-videos/` already exists, skip creation
- Idempotent -- running again detects existing setup and skips
