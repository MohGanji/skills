[![skills.sh](https://skills.sh/b/mohganji/skills)](https://skills.sh/mohganji/skills)

# skills

Everyone needs to have their skills repo to make their personal agent setup portable and git-tracked. This is the new dotfiles.

This repo is a curated set of agent skills for Claude Code that I use for work, personal projects, and the openclaw agent. Install once, bootstrap your repo, and get a development environment with quality controls, workflow standards, and on-demand agent capabilities baked in.

## What you get

By installing these skills and running [`/bootstrap-agentic-repo`](bootstrap-agentic-repo/), you get:

- **Automated code quality enforcement** via [CRAP score checks](setup-crap-check-github-actions/) in CI and pre-commit hooks, so no high-complexity untested code ships
- **Structural duplication detection** with [`/dry`](dry/) to catch copy-paste debt before it compounds
- **React performance guardrails** via [`/react-doctor`](https://github.com/millionco/react-doctor) analyzing component patterns and flagging anti-patterns
- **Codebase pattern enforcement** with [`/no-broken-window`](no-broken-window/) so one violation doesn't erode the standard
- **Intentional UI design review** through [`/design-deliberately`](design-deliberately/) applying principles from world class products
- **Test-driven development** with [`/tdd`](https://github.com/mattpocock/skills) running red-green-refactor loops
- **Structured planning pipeline** -- [`/to-prd`](https://github.com/mattpocock/skills) turns context into PRDs, [`/to-issues`](https://github.com/mattpocock/skills) breaks them into tickets, [`/priority-score`](priority-score/) ranks them by impact
- **Issue triage workflow** via [`/triage`](https://github.com/mattpocock/skills) with a state machine and labels configured for your tracker
- **Exhaustive decision-tree exploration** with [`/grill-me`](https://github.com/mattpocock/skills) and [`/grill-with-docs`](https://github.com/mattpocock/skills) to walk down every branch of the decision tree, resolving dependencies between decisions one-by-one until reaching shared understanding
- **Browser automation** via [`/browser-harness`](https://github.com/browser-use/browser-harness) for CDP-based browser control
- **Ultra-compressed communication** with [`/caveman`](https://github.com/mattpocock/skills) cutting ~75% token usage as the default style


## Quick Start

```bash
npx skills@latest add mohganji/skills
```

Then run `/bootstrap-agentic-repo` in Claude Code to install external skills and walk through setup.

## Bootstrap Skills (meta-meta)

One-time orchestration. [`/bootstrap-agentic-repo`](bootstrap-agentic-repo/) detects your stack, installs all skill sources (internal + external), walks you through the setup skills interactively, and verifies the result.

| Skill | Description | Owner | Tags |
|-------|-------------|-------|------|
| [bootstrap-agentic-repo](bootstrap-agentic-repo/) | Installs all skills, walks through setup skills. | internal | `bootstrap`, `setup` |

## Setup Skills (meta)

One-time repo configuration. These run during bootstrap (or standalone) to wire up automated workflows and establish defaults. They add CI pipelines, pre-commit hooks, CLAUDE.md directives, and initialize workflow standards like issue tracking conventions and communication style. Naming convention: `setup-{skill-name}` -- each setup skill corresponds to the on-demand skill it configures enforcement for.

| Skill | Description | Owner | Tags |
|-------|-------------|-------|------|
| [setup-caveman](setup-caveman/) | Sets caveman as default communication style. | internal | `setup`, `communication` |
| [setup-crap-check](setup-crap-check/) | Adds CRAP score enforcement via CI and pre-commit hook. | internal | `setup`, `code-quality` |
| [setup-dry](setup-dry/) | Adds DRY violation detection via CI and pre-commit hook. | internal | `setup`, `code-quality` |
| [setup-react-doctor](setup-react-doctor/) | Adds React performance analysis via CI and pre-commit hook. | internal | `setup`, `react` |
| setup-matt-pocock-skills | Configures issue tracker, triage labels, domain docs. | [mattpocock](https://github.com/mattpocock/skills) | `setup`, `workflow` |

## Skills

On-demand capabilities for each iteration in the development lifecycle -- planning, building, reviewing, refactoring, and shipping.

| Skill | Description | Owner | Tags |
|-------|-------------|-------|------|
| [cut-the-crap](cut-the-crap/) | CRAP scores, refactoring, test improvements. | internal | `code-quality`, `testing` |
| [dry](dry/) | Structural duplicate detection. | internal | `code-quality`, `refactoring` |
| [design-deliberately](design-deliberately/) | UI design review. | internal | `design`, `ui` |
| [no-broken-window](no-broken-window/) | Codebase pattern enforcement. | internal | `code-quality`, `conventions` |
| [priority-score](priority-score/) | Feature prioritization via (b*d)/c. | internal | `prioritization`, `planning` |
| tdd | Test-driven development. | [mattpocock](https://github.com/mattpocock/skills) | `engineering`, `testing` |
| triage | Issue triage state machine. | [mattpocock](https://github.com/mattpocock/skills) | `engineering`, `workflow` |
| to-prd | Turn context into a PRD. | [mattpocock](https://github.com/mattpocock/skills) | `engineering`, `planning` |
| to-issues | Break plans into tickets. | [mattpocock](https://github.com/mattpocock/skills) | `engineering`, `planning` |
| grill-me | Stress-test a plan or design. | [mattpocock](https://github.com/mattpocock/skills) | `productivity` |
| grill-with-docs | Grill against domain model. | [mattpocock](https://github.com/mattpocock/skills) | `productivity` |
| caveman | Ultra-compressed communication. | [mattpocock](https://github.com/mattpocock/skills) | `productivity` |
| write-a-skill | Create new agent skills. | [mattpocock](https://github.com/mattpocock/skills) | `productivity` |
| improve-codebase-architecture | Refactoring opportunities. | [mattpocock](https://github.com/mattpocock/skills) | `engineering`, `architecture` |
| browser-harness | Browser control via CDP. | [Browser Use](https://github.com/browser-use/browser-harness) | `browser`, `automation` |
| react-doctor | React codebase analysis. | [Million](https://github.com/millionco/react-doctor) | `react`, `code-quality` |
