---
name: setup-caveman-default
description: One-time setup skill that adds caveman as the default communication style and git safety rules to CLAUDE.md. Use when user wants caveman mode on by default, wants to set up communication defaults, or during bootstrap setup.
---

# Setup Caveman Default

One-time setup. Adds caveman as the default communication style and git safety rules to the project's CLAUDE.md.

## Workflow

### Step 1 -- Check existing CLAUDE.md

- [ ] Check if `CLAUDE.md` exists in the repo root
- [ ] If it exists, read it and check for existing communication style or git rules sections
- [ ] If sections already exist, show them to the user and ask whether to replace or skip

### Step 2 -- Add communication style section

Append to CLAUDE.md (or create it):

```markdown
## Communication Style

Use caveman mode by default (see ~/.claude/skills/caveman/SKILL.md). Stop with "stop caveman".
```

### Step 3 -- Add git rules section

Append to CLAUDE.md:

```markdown
## Git Rules

- Never use `--no-verify` when committing or pushing
- Never force push to main/master
- Always run pre-commit hooks -- they exist for a reason
- Write meaningful commit messages that explain why, not what
```

### Step 4 -- Verify

- [ ] Read back CLAUDE.md and confirm the sections were added correctly
- [ ] Show the user what was added

## Key rules

- Never overwrite existing CLAUDE.md content -- only append sections
- If a section with the same heading exists, ask user before replacing
- This skill is idempotent -- running it again detects existing sections and skips
