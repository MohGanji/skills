This repo contains agent skills I use for work, my personal projects, and openclaw agent.

Everyone needs to have their skills repo to make their personal agent setup portable and git-tracked. This is the new dotfiles.

A lot of these skills come from different places, and you can check out the CREDITS.md for where those come from.

# Skills

| Skill | Description | Tags |
|-------|-------------|------|
| [cut-the-crap](cut-the-crap/) | Calculate CRAP scores for functions, identify high-risk methods, propose refactoring and test improvements, and implement fixes after user approval. | `code-quality`, `testing`, `refactoring` |
| [setup-crap-check-github-actions](setup-crap-check-github-actions/) | One-time guided setup that adds a GitHub Actions workflow to enforce CRAP score thresholds on PRs. Detects repo language and test framework, generates the workflow YAML. | `ci`, `github-actions`, `code-quality` |

# Installation

`npx skills@latest add mohganji/skills`
