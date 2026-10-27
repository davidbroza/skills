#!/usr/bin/env bash
# Entry point — defers to bun + scripts/narrate.ts
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

# Ensure deps
if [ ! -d "$DIR/node_modules" ]; then
    (cd "$DIR" && bun install --silent) >&2
fi

exec bun run "$DIR/scripts/narrate.ts" "$@"
