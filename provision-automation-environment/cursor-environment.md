# Cursor — environment walkthrough

Everything platform-side is **dashboard-only** — there is no automations API and no in-repo file format. The git-tracked half is the environment definition from SKILL.md step 2.

Walk the user through these interactively. Use the repo facts from step 1 throughout.

## 1. Host integration (prerequisite)

**GitHub.** Connect via Dashboard → Integrations → GitHub. Self-serve.

**GitLab.** **Premium or Ultimate on the group is a hard prerequisite** — confirm it before anything else, because the integration refuses lower tiers and there is no workaround. gitlab.com is self-serve; self-managed needs Teams/Enterprise and an OAuth application.

**Nested group paths** (`group/subgroup/subsubgroup/repo`): the repo picker loads partial lists for large orgs. Use **Sync repositories** on the integration page, then search the full path.

Treat the first successful connection as a go/no-go gate. Everything downstream assumes it.

## 2. Runtime secrets

The user creates these in the dashboard secrets store. Class **Runtime Secret** — injected as environment variables and redacted from transcripts.

Create exactly what the environment's README lists. Typically:

- `GH_TOKEN` — fine-grained PAT: `contents:write`, `pull-requests:write`, `issues:write`. **No merge rights.**
- `GITLAB_TOKEN` — project access token, **Developer** role, scopes `api, read_repository, write_repository`.
- `GIT_AUTHOR` — optional git identity for automation commits.

Never pasted into chat, files, or the repo.

## 3. Environment

Select the repo. Cursor detects the environment from `.cursor/environment.json` — a symlink into `.agents/environments/<env>/`.

**Verify the first build.** Whether Cursor's builder follows git symlinks is unverified. If the build can't find the manifest or the Dockerfile, apply the fallback in `.agents/environments/README.md`: copy the two files into `.cursor/` and add a CI drift check that fails when they diverge.

The install step must end green — host CLI auth passes inside it.

## 4. Tracker access (MCP)

Add the tracker's MCP server team-shared via Dashboard → Integrations & MCP, HTTP transport.

**Caveat: MCP OAuth is per-user even for team-shared servers.** A headless automation stalls when the grant expires. Grant it from the automations' service account and note the expiry.

Keep a fallback that never stalls — the tracker's REST API via `curl` with an API-token runtime secret.

## 5. Register the automations

Register each definition in `.agents/automations/` by hand, per that README's setup contract. One dashboard entry per trigger in its frontmatter — multiple registrations of one definition are still one writer.

- **Trigger** — mapped from the vocabulary to Cursor's name.
- **Prompt** — exactly the runtime-contract line, nothing else.
- **Model** — from the tier map.
- **Repo + environment** — this repo; the environment is auto-detected.
- **Webhook automations** — saving mints a private webhook URL and Bearer key. Pair each with its tracker-side rule. The URLs and keys live only in that rule's config; re-pair whenever the automation is re-registered.
- **Memory** — **disable per-automation memory** on every entry. It persists outside the working tree and is on by default. The ticket is the ledger.

## 6. Verify — you drive

Launch a manual cloud-agent session in the environment and run the three completion-criterion checks from SKILL.md: repo checkout present, host CLI auth, tracker read.

Show the user all three verdicts. **All must pass before this is done.**
