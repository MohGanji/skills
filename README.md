This repo contains agent skills I use for work, my personal projects, and openclaw agent.

Everyone needs to have their skills repo to make their personal agent setup portable and git-tracked. This is the new dotfiles.

A lot of these skills come from different places, and you can check out the CREDITS.md for where those come from.

# Skills

| Skill | Description | Tags |
|-------|-------------|------|
| [cut-the-crap](cut-the-crap/) | Calculate CRAP scores for functions, identify high-risk methods, propose refactoring and test improvements, and implement fixes after user approval. | `code-quality`, `testing`, `refactoring` |
| [design-deliberately](design-deliberately/) | Review and guide UI design toward intentional minimalism where every element earns its place. Applies principles distilled from Vercel, Notion, Figma, Cursor, Anthropic, and tldraw. | `design`, `ui`, `review` |
| [no-broken-window](no-broken-window/) | Detect, establish, and enforce codebase patterns so one violation doesn't erode the standard. Scans for inconsistencies, proposes rules, and sets up automated enforcement. | `code-quality`, `conventions`, `enforcement` |
| [setup-crap-check-github-actions](setup-crap-check-github-actions/) | One-time guided setup that adds a GitHub Actions workflow to enforce CRAP score thresholds on PRs. Detects repo language and test framework, generates the workflow YAML. | `ci`, `github-actions`, `code-quality` |
| [priority-score](priority-score/) | Score feature priorities using Geoff Ralston's (b×d)/c formula — Breadth, Depth, and Cost on 1-5 scales yielding a 1-100 priority score. Outputs a standard one-liner for use in issue trackers and planning docs. | `prioritization`, `planning`, `product` |

# Installation

`npx skills@latest add mohganji/skills`
