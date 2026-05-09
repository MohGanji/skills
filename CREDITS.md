# Credits

This repo includes external skills from other open-source projects, brought in via git subtree. Their work is used and built upon under their respective licenses.

| Source | Author | License | Path |
|--------|--------|---------|------|
| [browser-harness](https://github.com/browser-use/browser-harness) | Browser Use | MIT | `vendor/browser-harness/` |
| [mattpocock/skills](https://github.com/mattpocock/skills) | Matt Pocock | MIT | `vendor/mattpocock-skills/` |
| [react-doctor](https://github.com/millionco/react-doctor) | Million | MIT | `vendor/react-doctor/` |

## Adding an external skill source

1. **Subtree add** the repo into `vendor/`:

```bash
git subtree add --prefix=vendor/<name> <repo-url> <branch> --squash
```

2. **Register it** in `scripts/vendor-update.sh` by adding an entry to the `VENDORS` array:

```bash
["<name>"]="<repo-url> <branch>"
```

3. **Add a row** to the table above in this file (source, author, license, path).

4. **Add a row** to the "Vendored Skills" table in `README.md` (source, skills list, tags).

## Updating external skills

Pull the latest from all sources:

```bash
./scripts/vendor-update.sh
```

Or update a single source:

```bash
./scripts/vendor-update.sh <name>
```

If you've made local edits, the pull merges upstream changes with yours. Resolve conflicts like any normal git merge.

## Forking an external skill

Edit files in `vendor/` directly — they're regular files in this repo. Upstream updates will merge with your changes. If you're making substantial modifications, consider copying the skill to a top-level directory and maintaining it independently.
