---
name: provision-automation-environment
description: Provision the cloud environment a repo's automations run in — repo checkout, host CLI (gh/glab) auth, tracker access, dependencies — from the environment definition in .agents/environments/. Use when setting up automations on a new platform or account, when a probe shows missing clone/tool capability, or when the environment definition changes.
---

# Provision Automation Environment

Walk the user through provisioning a cloud environment for a repo's automations, so every session boots with the repo checked out, the host CLI authenticated, and dependencies ready.

One environment per repo per platform.

This is interactive. The dashboard is theirs to click; you supply the content and verify the result.

## 1. Discover the repo's facts

Derive these from the working copy. Don't ask for what you can look up.

- **Repo URL and host** — `git remote -v`. GitHub, GitLab (hosted or self-managed), or other. Note whether the path nests beyond `<owner>/<repo>`: **nested group paths trip repo pickers and git-source validators on more than one platform.**
- **Host CLI** — GitHub → `gh`. GitLab → `glab`.
- **Tracker** — whatever `docs/agents/issue-tracker.md` declares, if present. Its access is part of verification.
- **Dependencies** — how this repo installs. Lockfiles present → `npm ci`, `uv sync`, etc.

## 2. The environment definition

`.agents/environments/` is the canonical home — one folder per logical environment, holding `environment.json` (Cursor's schema, adopted as the platform-neutral standard), `Dockerfile`, `install.sh` and a `README.md` naming the runtime secrets.

Create or extend a folder there, then **symlink it into the platform's expected location** (`.cursor/environment.json`, `.cursor/Dockerfile`). The definition is git-tracked in one place; platforms read symlinks, never copies.

Read that folder's README before writing anything — it carries the path-resolution caveat, which bites on the first build.

## 3. Platform branch

Follow the guide for the platform hosting the automations:

- **Cursor** → [cursor-environment.md](cursor-environment.md)
- Anything else: author `<platform>-environment.md` alongside on the first attempt, and add it to this list.

## 4. Credentials

The host token is where "automations never merge" is actually enforced. A prompt saying *don't merge* is a suggestion. A token that cannot merge is a fact.

- **GitHub** — fine-grained PAT: `contents:write`, `pull-requests:write`, `issues:write`. No merge rights, no admin.
- **GitLab** — project access token, **Developer** role (not Maintainer), scopes `api, read_repository, write_repository`.

Secrets go in the platform's secrets store as runtime secrets, injected as environment variables. **Never pasted into chat, files, or the repo.** Install scripts verify a secret works and never print it.

## Completion criterion

Provisioned means a fresh session in the environment passes all three:

1. **Checkout** — the repo is present at the path the guide states.
2. **Host CLI** — `gh auth status` / `glab auth status` succeeds against the repo's host.
3. **Tracker** — the platform's tracker connection can read the repo's configured tracker.

Run these as a one-off probe session in the new environment. **Show the user all three verdicts before calling this done.** A provisioning step that reports success without a probe is how an automation fleet fails silently on its first real fire.

## Record what you hit

Every platform tried so far has had at least one undocumented trap: git-source validators rejecting nested paths, allowlist network modes blocking the git host, environment-dialog variables not reaching setup scripts, cron minutes silently reassigned.

None were documented. All cost an afternoon.

Write what you find into the repo's automations README under platform findings. That section is the payoff.
