#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

DEBUG_MODE=false
for arg in "$@"; do
  if [ "$arg" == "--debug" ] || [ "$arg" == "-d" ]; then
    DEBUG_MODE=true
    break
  fi
done

# Write config.js file for the frontend to read
CONFIG_FILE="$ROOT_DIR/frontend/app/config.js"

if [ "$DEBUG_MODE" = true ]; then
    echo "🐛 DEBUG MODE ENABLED"
    echo "window.APP_CONFIG = { DEBUG: true };" > "$CONFIG_FILE"
else
    echo "🚀 PRODUCTION MODE"
    echo "window.APP_CONFIG = { DEBUG: false };" > "$CONFIG_FILE"
fi

echo "Starting CTF Platform Server..."
cd "$ROOT_DIR/challenge-engine/python"

exec uvicorn server:app --reload --port 8000
