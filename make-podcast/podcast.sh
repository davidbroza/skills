#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
if [ ! -d "$DIR/node_modules" ]; then (cd "$DIR" && bun install --silent) >&2; fi
exec bun run "$DIR/scripts/main.ts" "$@"
