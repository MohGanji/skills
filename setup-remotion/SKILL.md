---
name: setup-remotion
description: One-time setup skill that scaffolds the remotion-videos directory and adds Remotion conventions to CLAUDE.md. Establishes the standard that all Remotion video projects live under remotion-videos/ as separate React projects. Use when user wants to set up Remotion video creation or during bootstrap setup.
---

# Setup Remotion

One-time guided setup. Creates the `remotion-videos/` directory and establishes the convention for how Remotion video projects are organized.

## Workflow

### Step 1 -- Check existing setup

- [ ] Check if `remotion-videos/` already exists
- [ ] Check if CLAUDE.md already has a Remotion section
- [ ] If both exist, inform user and exit

### Step 2 -- Scaffold remotion-videos directory

Ask user for confirmation, then:

- [ ] Create `remotion-videos/` in the repo root
- [ ] Add a `.gitkeep` to track the empty directory
- [ ] Explain the convention: each video is its own Remotion project scaffolded inside this directory

```
remotion-videos/
  explainer-video/     # npx create-video@latest --yes --blank explainer-video
  product-demo/        # each is a self-contained React project
  social-clip/         # with its own package.json, src/, public/
```

### Step 3 -- Update CLAUDE.md

Append to CLAUDE.md:

```markdown
## Remotion Videos

All Remotion video projects live under `remotion-videos/`. Each video is a separate React project scaffolded with `npx create-video@latest --yes --blank <name>`. Always scaffold new videos inside `remotion-videos/`, never at the repo root. Use `/remotion` skill when working on video code.
```

### Step 4 -- Verify

- [ ] Confirm `remotion-videos/` exists
- [ ] Show the user what was added to CLAUDE.md
- [ ] Suggest creating their first video: `cd remotion-videos && npx create-video@latest --yes --blank my-first-video`

## Key rules

- Never overwrite existing CLAUDE.md content -- only append
- If `remotion-videos/` already exists, skip creation
- Idempotent -- running again detects existing setup and skips
