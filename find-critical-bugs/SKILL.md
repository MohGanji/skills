---
name: find-critical-bugs
description: Deep bug hunt for high-severity correctness bugs — data loss, crashes, security holes, races, silent corruption. Use when asked to find critical bugs, audit an open PR/MR or the repo's current changes for severe regressions, or when running as a scheduled bug-hunt automation.
---

# Find Critical Bugs

A deep bug hunt for high-severity issues. Nothing else.

Most days this finds nothing. That is the expected outcome, and reporting it plainly is the job.

## Load prior context first

The tracker is your memory across runs. Before inspecting any code, read:

- **Open and recently closed bugs** filed by previous runs. Where the repo configures a tracker, `docs/agents/issue-tracker.md` has the query mechanics — use them. Otherwise `gh issue list --label bug` / `glab issue list --label bug`.
- **Open and recently closed PRs** and their discussions (`gh pr list`, `gh pr view <n> --comments`; `glab mr list`, `glab mr view <n> --comments`).
- **Recent git history** — what changed and why.

**Never investigate or re-report a bug that already has an open fix PR or an open tracker issue.** That is the single most common failure mode of a scheduled bug hunt.

## Two modes

Decide the mode first. It fixes both what you inspect and what you do with a verified bug.

- **PR mode** — invoked against a specific pull/merge request, by a cloud automation or "check PR #N". Scope is that PR's diff, traced through the full code paths it touches.
- **Local mode** — invoked in a working copy with no PR named. Scope is the repo's existing changes: uncommitted work plus commits on the current branch that aren't on the default branch. If there are none, fall back to recent commits on the default branch.

## What counts

Only issues that would cause **data loss, crashes, security holes, or significant user-facing breakage.**

Hunt for: data corruption, race conditions that lose writes, null dereferences in critical paths, auth and permission bypasses, infinite loops, resource leaks, silent data truncation.

Trace the full code path. Don't pattern-match on the diff — understand the caller chain and the downstream effects. Focus on behavioural changes with real blast radius.

**Ignore:** style, minor edge cases, theoretical concerns with no concrete trigger, and anything that merely degrades UX.

## The confidence bar

You must be able to describe a concrete scenario that triggers the bug.

**A bug does not count as found until you have reproduced it with a failing test.** Write the smallest test that encodes the trigger and fails on current code because of the bug. This applies in both modes.

No plausible trigger, or no test you can make fail? It's a suspicion, not a finding. Mention it in the run summary and take no other action.

This bar is the whole value of the skill. A bug hunt that reports unproven suspicions trains people to ignore it.

## Acting on a verified bug

**Local mode — fix it.**

- Implement a minimal, high-confidence fix. No broad refactors in the same change.
- Keep the reproduction test. It must now pass, locking in the behaviour.
- File the bug in the tracker — one line, location and root cause — unless an issue already exists.

**PR mode — report it, don't fix it.**

- Comment on the PR: the bug and its impact, the root cause, the reproduction (include the failing test), and a suggested fix.
- Add inline comments on the offending lines where that's clearer than the summary.
- Leave the code unchanged. The fix belongs to the PR author.

## Avoiding duplicate reports

For each verified bug, check the tracker for an existing record and act on its state:

| State | Action |
| --- | --- |
| Fix PR still open | Do **not** re-report. Note in your summary that the fix awaits review, with a link. |
| Fix PR merged | The bug is fixed. Close any issue still open for it. |
| Fix PR closed unmerged | Treat as rejected. Don't re-report unless the code has materially changed since, or the rejection is over 30 days old — after that much drift it's worth a fresh look. |
| Bug no longer in the code | Fixed some other way. Close the stale issue. |

## Safety

- Never report or fix a bug you aren't highly confident is real. The failing test is that proof.
- Found nothing critical? Post a short "no critical bugs found" summary and stop.

## Output

Per verified bug:

- **Bug and impact**
- **Root cause**
- **Reproduction** — the failing test and its output
- **Fix and validation** (local mode) or **suggested fix** (PR mode)

Close with links to anything created or updated, plus any suspicions that didn't clear the bar.

## Attribution

Adapted from Cursor's bug-hunt automation template ([`cursor/plugins`](https://github.com/cursor/plugins)). The original ships as an automation, not a skill — this is the same method rewritten as one, so any harness can invoke it and an automation can reference it rather than restate it.
