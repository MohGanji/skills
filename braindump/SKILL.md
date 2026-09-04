---
name: braindump
description: Long-term memory for agents — append dense one-line facts to a topic-organized folder of markdown files, and grep them back on later sessions. Use proactively whenever something surfaces that the code can't record but the next session will need (a constraint, a gotcha, a decision and its reason, an approach already rejected), and read it before starting work in a familiar area. Also triggered by "braindump this", "save this to memory", "use your brain", or "remember anything about...".
---

# Braindump

Things get decided in conversation and then lost. Why an approach was rejected. Which endpoint lies about its status codes. What the client actually meant by "real-time".

None of that fits in code. All of it is expensive to rediscover.

Braindump is one line of text appended to one file. That's the whole mechanism.

## Storage

```
.agents-workshop/braindump/
├── stripe-integration.md
├── deploy.md
├── domain-decisions.md
└── perf.md
```

One file per topic. **You choose the topics** — group by the thing a future session would search for, not by date or by who wrote it.

No index, no database, no CLI. Files and `grep`.

Outside a repo that has `.agents-workshop/`, use `~/.braindump/` instead.

## Reading — do this first

Before writing, and before starting work in an area that might already be documented:

```bash
grep -ri "stripe" .agents-workshop/braindump/
ls .agents-workshop/braindump/
```

Grep before you store, so you update a line instead of adding a near-duplicate. Grep before you work, so you don't rediscover what's already written down.

## Writing

One fact per line. Append:

```bash
echo "- 2026-09-04 — Stripe webhooks retry 3x with exponential backoff; idempotency keys expire after 24h, so replays past that create duplicate charges." \
  >> .agents-workshop/braindump/stripe-integration.md
```

Create the file if the topic is new. No frontmatter, no headings, no ceremony — a flat list of lines.

**Each line must stand alone.** It gets read a year later, out of order, by an agent with none of today's context. "This doesn't work" is worthless. "The /v2/sync endpoint returns 200 with an error body when the account is suspended — check `body.status`, not the HTTP code" survives.

Lead with the noun someone would grep for. Date every line — that's what makes pruning possible.

## What to write

- Constraints and gotchas that cost you time to find
- Decisions, **with the reason** — the reason is the part that isn't recoverable from the diff
- Approaches tried and rejected, and why
- Domain terms, aliases, what the user actually means by a word
- External system behaviour that contradicts its docs
- User preferences and project conventions that aren't enforced by a gate

## What not to write

- Anything the code already says. Read the code instead.
- Anything a gate, guardrail or ADR already enforces — those are enforcement, this is recall
- Transient state: what you're debugging right now, what's on branch X today
- General programming knowledge
- Commentary about the conversation

The test: **would the next session pay to know this, and can it not find out any other way?**

## Pruning

A memory nobody prunes becomes a memory nobody trusts.

When a line turns out to be wrong or stale, delete it — don't append a correction below it and leave both. When a file stops being about one topic, split it.

Dates are there so you can ask "is this still true?" of anything old before acting on it.

## Commit it

`.agents-workshop/braindump/` is committed. Shared means shared with the next clone and the next teammate, not just the next session.
