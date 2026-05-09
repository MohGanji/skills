[![skills.sh](https://skills.sh/b/mohganji/skills)](https://skills.sh/mohganji/skills)

# skills

Agent skills I use for work, personal projects, and the openclaw agent. This is the new dotfiles -- a portable, git-tracked agent setup that follows you across repos.

Internal skills live here. External skills are installed at runtime from their source repos via `npx skills@latest add`. The `bootstrap-agentic-repo` skill orchestrates the full setup.

## Quick Start

```bash
npx skills@latest add mohganji/skills
```

Then run `/bootstrap-agentic-repo` in Claude Code to install external skills and walk through setup.

## Bootstrap Skills

Meta-meta -- one-time environment setup.

| Skill | Description | Owner | Tags |
|-------|-------------|-------|------|
| [bootstrap-agentic-repo](bootstrap-agentic-repo/) | Installs all skills, walks through setup skills. | internal | `bootstrap`, `setup` |

## Setup Skills

Meta -- one-time repo setup. Each owns a CLAUDE.md section.

| Skill | Description | Owner | Tags |
|-------|-------------|-------|------|
| [setup-caveman-default](setup-caveman-default/) | Sets caveman as default communication style and git rules. | internal | `setup`, `communication` |
| [setup-crap-check-github-actions](setup-crap-check-github-actions/) | Adds CRAP score CI workflow. | internal | `ci`, `github-actions` |
| setup-matt-pocock-skills | Configures issue tracker, triage labels, domain docs. | [mattpocock](https://github.com/mattpocock/skills) | `setup`, `workflow` |

## Skills

On-demand, day-to-day.

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
