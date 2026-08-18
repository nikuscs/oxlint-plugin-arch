#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

increment=""
dry_run=false
yes=false

usage() {
  cat >&2 <<'EOF'
usage:
  scripts/release.sh [patch|minor|major] [--yes] [--dry-run]

Runs check, bumps the version with bumpp, pushes the tag, and publishes to npm.
patch|minor|major skips the bumpp prompt. --yes confirms the chosen bump.
--dry-run only runs check and npm publish --dry-run.
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
    --dry-run) dry_run=true ;;
    -h|--help) usage ;;
    *) usage ;;
  esac
done

[[ "$(git branch --show-current)" == main ]] || fail 'release must run from main'
[[ -z "$(git status --porcelain)" ]] || fail 'working tree must be clean'
git fetch origin main --tags
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] || fail 'main must match origin/main'

bun run check

if [[ "$dry_run" == true ]]; then
  npm publish --access public --dry-run
  exit 0
fi

npm whoami >/dev/null 2>&1 || fail 'npm login is required before publish'

bumpp_args=(--commit --tag --push)
if [[ -n "$increment" ]]; then
  bumpp_args+=(--release "$increment")
fi
if [[ "$yes" == true ]]; then
  bumpp_args+=(--yes)
fi

bunx bumpp "${bumpp_args[@]}"
npm publish --access public
