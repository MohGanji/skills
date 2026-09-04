---
name: orchestrate
description: Run the session as an orchestrator — delegate everything to a few long-lived subagents and recycle them before they get dumb.
disable-model-invocation: true
---

# Orchestrate

You're the orchestrator — never do any of the work yourself. Subagents do all of it.

## Keep subagents, don't spawn one per prompt

Run a handful of subagents, each owning a non-overlapping area of the work — a feature, a folder, a research question, an experiment. Track which one is working on what, and give each new piece of work to the subagent whose area it falls in, continuing its conversation rather than opening a fresh one. How many you run is your call, as long as no two are editing the same files.

Check on them with:

```bash
scripts/subagent-top --window opus-5=1000000,sonnet-5=1000000
```

## Dumb zone

Once a subagent passes 50% of its window — an observed heuristic, not a hard failure — it is in the **dumb zone**, so retire it. Make that call before you dispatch. If it is mid-way through something and you want a replacement for that area, ask it for a handoff first — the request lands mid-task, so tell it to answer only once it has finished — and prepend that to the next subagent's prompt. Otherwise just drop it and use a fresh one next time.

## Two models

- A **big** model for judgment, a **medium** one for bounded work. Never small.
- Every subagent opens big. Medium only where *all* of that area's work will be trivial, well-defined and bounded — a sweep, a rename, fixture data.
- One on medium that starts surprising you gets retired and re-opened big.

## Your own 50%

Once your own context — the `self` row in `subagent-top` — reaches 50%, ask the user to compact. Give them the instruction to run: what must survive is why each subagent exists, what is outstanding, the decisions taken, and where the conversation stands. The session continues, so your subagents stay warm and keep their ids, and anything lost from the roster itself comes back with `subagent-top`.

Only where the session has to end instead: ask every live subagent for a handoff, and give the user a single prompt opening with `/orchestrate` carrying the same material plus those handoffs. Handed one of those by a previous orchestrator, study it and spin up subagents with their handoffs as a preprompt.

## Claude Code notes

- Subagents are `Agent`, continued with `SendMessage` to the `agentId`. `ListAgents` lists only *running* ones, so `subagent-top` is the roster.
- Big is the latest Opus, medium the latest Sonnet; `model` takes the tier name only.
- Claude Code records no context window, so pass one per model, taking the figures from the `claude-api` skill: `scripts/subagent-top --window opus-5=1000000,sonnet-5=1000000`. Without it you get raw context and no percentage.

## Cursor notes

- Subagents are `Task` with `subagent_type: "generalPurpose"`, `run_in_background: true` and `model` per call. Continue one with another `Task` carrying `resume: "<agentId>"`; add `interrupt: true` to stop work in flight.
- The model id is a real choice — ask, both tiers in one `AskUserQuestion`, grounded in `~/.cursor/cli-config.json`.
- Take the widest context window a model offers: Opus 5 has 300k and 1M, pick 1M.
- Drop `--window` — Cursor's IDE state database records each subagent's model, tokens and limit, and `subagent-top` reads it. One run through the `cursor-agent` CLI shows no context.
