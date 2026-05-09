---
name: setup-sandcastle
description: One-time setup skill that walks the user through installing and configuring Sandcastle for isolated sandbox environments. Configures the sandbox provider (Docker, Podman, or Firecracker), verifies the runtime, and adds sandbox defaults to CLAUDE.md. Use when user wants to enable parallelized agent work or sandboxed TDD.
---

# Setup Sandcastle

One-time guided setup. Installs Sandcastle and configures an isolated sandbox provider so agents can run in parallel without stepping on each other.

## Workflow

### Step 1 -- Detect environment

- [ ] Check if `sandcastle` is already installed (`npx sandcastle --version` or check `package.json`)
- [ ] Detect available container runtimes: Docker, Podman, or Firecracker
- [ ] Check if the project is TypeScript/JavaScript (Sandcastle is a TS library)
- [ ] Check for existing sandbox or container configuration

Present findings to user before proceeding.

### Step 2 -- Ask user preferences

Use `AskUserQuestion` for each:

1. **Sandbox provider** -- which runtime to use:
   - **Docker** (recommended) -- most common, easiest setup
   - **Podman** -- rootless alternative to Docker
   - **Firecracker** (Vercel) -- microVM isolation, strongest sandboxing
2. **Branch strategy** -- how agent changes get merged back:
   - **Auto-merge** (recommended) -- commits merge back to the working branch automatically
   - **PR per sandbox** -- each sandbox run creates a PR for review
3. **Default parallelism** -- how many sandboxes can run concurrently:
   - Suggest based on available CPU/memory

### Step 3 -- Install and configure

- [ ] Install Sandcastle: `npm install sandcastle` (or add to devDependencies)
- [ ] Verify the selected container runtime is running and accessible
- [ ] Create a minimal `sandcastle.config.ts` with the selected provider and branch strategy
- [ ] Run a smoke test: create a sandbox, run `echo "hello"`, verify output, destroy sandbox

### Step 4 -- Update CLAUDE.md

Append to CLAUDE.md:

```markdown
## Sandboxed Execution

Use Sandcastle for isolated agent runs. Provider: {selected_provider}. Run `/sandcastle` to execute tasks in parallel sandboxes.
```

### Step 5 -- Verify

- [ ] Show the user the generated config
- [ ] Confirm the smoke test passed
- [ ] Suggest trying `/sandcastle` with a simple task

## Key rules

- Never install a container runtime for the user -- only detect and configure what's already available
- If no container runtime is found, explain what's needed and exit
- Idempotent -- running again detects existing setup and skips
