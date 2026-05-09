---
name: sandcastle
description: Run agent tasks in isolated Sandcastle sandbox environments. Supports parallel execution for TDD, refactoring, or any work that benefits from isolation. Each sandbox gets its own branch, container, and merge strategy. Use when user wants to parallelize work, run TDD in a sandbox, or isolate risky changes.
---

# Sandcastle

Run tasks in isolated sandbox environments. Each sandbox gets its own container and branch -- multiple agents can work in parallel without conflicts.

## Usage

### Single sandbox run

Run a task in an isolated environment:

1. Create a sandbox with the configured provider
2. Execute the task (TDD loop, refactoring, feature implementation)
3. Commit results inside the sandbox
4. Merge changes back to the working branch (or create a PR, based on config)
5. Destroy the sandbox

### Parallel runs

Run multiple tasks simultaneously:

1. Ask the user to define the tasks (or accept a list)
2. Create one sandbox per task
3. Execute all tasks in parallel
4. Merge results back in order, resolving conflicts if needed
5. Destroy all sandboxes

### Sandboxed TDD

Run a full red-green-refactor loop in isolation:

1. Create a sandbox
2. Write the failing test (red)
3. Write the minimal implementation to pass (green)
4. Refactor with confidence -- the sandbox is disposable
5. Merge the final green state back

## Key rules

- Always verify Sandcastle is configured before running (`sandcastle.config.ts` must exist)
- If not configured, tell the user to run `/setup-sandcastle` first
- Never run more sandboxes than the configured parallelism limit
- Always destroy sandboxes after use, even on failure
- When merging back, if conflicts exist, pause and ask the user how to resolve
