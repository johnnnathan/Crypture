#!/usr/bin/env bash
set -euo pipefail

# Move to root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Building crypto-engine..."

# Move to engine directory
cd "$ROOT_DIR/challenge-engine"
# Create the web engine
wasm-pack build --target web

echo "Copying pkg to frontend..."

# Copy and relocate the engine to be used by the front-end
rm -rf "$ROOT_DIR/frontend/app/chapters/challenges_pkg"
cp -R pkg "$ROOT_DIR/frontend/app/chapters/challenges_pkg"

echo "Done!"
