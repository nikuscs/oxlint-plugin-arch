#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

increment="patch"
yes=false

usage() {
  cat >&2 <<'EOF'
usage:
  scripts/release.sh [patch|minor|major] [--yes]

Runs check, bumps the version with bumpp, and pushes the tag.
GitHub Actions publishes to npm and creates the GitHub Release.
The bump defaults to patch; pass minor or major to override. --yes confirms the chosen bump.
EOF
  exit 2
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

for argument in "$@"; do
  case "$argument" in
    patch|minor|major) increment=$argument ;;
    --yes) yes=true ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

[[ "$(git branch --show-current)" == main ]] || fail 'release must run from main'
[[ -z "$(git status --porcelain)" ]] || fail 'working tree must be clean'
git fetch origin main --tags
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || fail 'main must match origin/main'

bun run check

bumpp_args=(--commit --tag --push)
if [[ -n "$increment" ]]; then
  bumpp_args+=(--release "$increment")
fi
if [[ "$yes" == true ]]; then
  bumpp_args+=(--yes)
fi

bunx bumpp "${bumpp_args[@]}"
