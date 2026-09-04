---
name: braindump
description: Long-term memory for agents — dense one-line facts appended to topic files, grepped back on later sessions. Use proactively whenever something surfaces that the code can't record but the next session will need (a constraint, a gotcha, a decision and its reason, an approach already rejected), and read it before starting work in a familiar area. Also triggered by "braindump this", "save this to memory", "use your brain", or "remember anything about...".
---

# Braindump

Memory that survives the session. One dense fact per line, appended to a topic file, grepped back later.

Manual triggers:
- **"braindump this"** / **"save this to memory"** — store
- **"use your brain"** / **"remember anything about..."** — retrieve

Otherwise use it proactively, per below.

## Storage

`.agents-workshop/braindump/<topic>.md` — one file per topic, you choose them. Group by what a future session would search for, not by date or author.

Outside a scaffolded repo, use `~/.braindump/`.

Committed, never ignored. Shared means shared with the next clone.

No index, no database, no CLI. Files and `grep`.

## Retrieve

```bash
grep -ri "<term>" .agents-workshop/braindump/
```

Do this **before storing**, so you update a line instead of adding a near-duplicate. And **before working** in an area that may already be documented.

## Store

```bash
echo "- 2026-09-04 — Stripe idempotency keys expire after 24h; replays past that create duplicate charges." \
  >> .agents-workshop/braindump/stripe.md
```

Flat list of lines. No frontmatter, no headings.

Each line **stands alone** — it gets read a year later, out of order, by an agent with none of today's context. Lead with the noun someone would grep for. Date every line.

## Capture

- Constraints, gotchas and quirks that cost time to find
- Decisions **with the reason** — the reason isn't recoverable from the diff
- Approaches tried and rejected
- Domain terms, and what the user actually means by them
- External systems behaving unlike their docs
- Preferences and conventions no gate enforces

## Don't capture

- Anything the code already says
- Anything a gate, guardrail or ADR enforces — that's enforcement, this is recall
- Transient state, debugging in flight
- General programming knowledge
- Commentary about the conversation

The test: **would the next session pay to know this, and can it not find out any other way?**

## Prune

Delete lines that turn out wrong or stale — don't append a correction and leave both standing. Split a file when it stops being one topic.

A memory nobody prunes becomes a memory nobody trusts.
