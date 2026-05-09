#!/usr/bin/env bash
set -euo pipefail

# Update all vendored git subtrees from upstream.
# Usage: ./scripts/vendor-update.sh [name]
#   No args  → update all vendors
#   name     → update only that vendor (e.g. "browser-harness")

declare -A VENDORS=(
  ["browser-harness"]="https://github.com/browser-use/browser-harness main"
  ["mattpocock-skills"]="https://github.com/mattpocock/skills main"
)

update_vendor() {
  local name="$1"
  local entry="${VENDORS[$name]}"
  local repo branch
  repo="$(echo "$entry" | awk '{print $1}')"
  branch="$(echo "$entry" | awk '{print $2}')"

  echo "Updating vendor/$name from $repo ($branch)..."
  git subtree pull --prefix="vendor/$name" "$repo" "$branch" --squash \
    -m "chore: update vendor/$name from upstream"
  echo "Done: vendor/$name"
  echo
}

if [[ $# -gt 0 ]]; then
  name="$1"
  if [[ -z "${VENDORS[$name]+x}" ]]; then
    echo "Unknown vendor: $name"
    echo "Available: ${!VENDORS[*]}"
    exit 1
  fi
  update_vendor "$name"
else
  for name in "${!VENDORS[@]}"; do
    update_vendor "$name"
  done
fi
