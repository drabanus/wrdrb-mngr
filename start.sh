#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env if present
if [ -f "$DIR/.env" ]; then
  set -a
  source "$DIR/.env"
  set +a
fi

export PORT="${PORT:-3000}"
export ORIGIN="${ORIGIN:-http://localhost:$PORT}"
export NODE_ENV="${NODE_ENV:-production}"

# Resolve Node.js binary – check common locations so this works
# under systemd (which has a minimal PATH) and interactive shells.
find_node() {
  # 1. Already on PATH?
  command -v node 2>/dev/null && return
  # 2. Common install locations
  for candidate in \
    /usr/local/bin/node \
    /usr/bin/node \
    "$HOME/.local/share/fnm/aliases/default/bin/node" \
    "$HOME/.fnm/aliases/default/bin/node" \
    ; do
    [ -x "$candidate" ] && echo "$candidate" && return
  done
  echo "ERROR: node not found. Install Node.js >= 18 and make sure it is on PATH." >&2
  exit 1
}

NODE_BIN="$(find_node)"
exec "$NODE_BIN" "$DIR/build/index.js"
