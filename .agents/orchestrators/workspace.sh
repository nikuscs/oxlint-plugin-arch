#!/bin/bash
# Worktree lifecycle for Paseo, Orca, Conductor and T3 Code: setup and check.
# The orchestrator configs next to this file call it; `bun run agents:sync` links them to the repo root.
set -e

# ─── Tool detection ──────────────────────────────────
if [ -n "${PASEO_SOURCE_CHECKOUT_PATH:-}" ]; then
  TOOL="paseo"; SOURCE_PATH="$PASEO_SOURCE_CHECKOUT_PATH"
elif [ -n "${ORCA_ROOT_PATH:-}" ]; then
  TOOL="orca"; SOURCE_PATH="$ORCA_ROOT_PATH"
elif [ -n "${CONDUCTOR_ROOT_PATH:-}" ]; then
  TOOL="conductor"; SOURCE_PATH="$CONDUCTOR_ROOT_PATH"
elif [ -n "${T3CODE_PROJECT_ROOT:-}" ]; then
  TOOL="t3code"; SOURCE_PATH="$T3CODE_PROJECT_ROOT"
else
  TOOL="manual"; SOURCE_PATH=""
fi

# ─── Helpers ─────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
error() { echo -e "${RED}x${NC} $1"; }
success() { echo -e "${GREEN}v${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

main_worktree_path() {
  git worktree list --porcelain 2>/dev/null | awk '/^worktree /{path=$2} /^branch refs\/heads\/main$/{print path; exit}'
}

# ─── Setup ───────────────────────────────────────────
setup_main() {
  command -v bun >/dev/null 2>&1 || { error "bun not found"; exit 1; }

  [ -n "$SOURCE_PATH" ] || SOURCE_PATH=$(main_worktree_path)
  echo "Setting up $(basename "$PWD") ($TOOL)"

  # 1. Dependencies, agent links and the build the self-lint config imports
  bun install < /dev/null || { error "bun install failed"; exit 1; }
  bun run agents:sync < /dev/null || warn "agents:sync failed"
  bun run build < /dev/null >/dev/null || warn "build failed"

  # 2. Plans are local and git-ignored: share the source checkout's folder
  if [ -n "$SOURCE_PATH" ] && [ "$SOURCE_PATH" != "$PWD" ] && [ -d "$SOURCE_PATH/.agents/plans" ] && [ ! -L .agents/plans ]; then
    rm -rf .agents/plans
    ln -s "$SOURCE_PATH/.agents/plans" .agents/plans
    success "Linked .agents/plans"
  fi

  echo ""
  echo "Workspace ready. Run: ./.agents/orchestrators/workspace.sh check"
}

case "${1:-}" in
  setup) setup_main ;;
  check) exec bun run check ;;
  *)     error "Usage: $0 {setup|check}"; exit 1 ;;
esac
