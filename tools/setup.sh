#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Setting up Cryptography CTF Environment..."

# Ensure the build scripts are executable
chmod +x ./build_crypto_engine.sh ./build_challenge_engine.sh build_python_challenge_engine.sh

# Call the local build scripts directly
echo "⚙️  Building Simulators Engine..."
./build_crypto_engine.sh

echo "⚙️  Building Challenge Engine..."
./build_challenge_engine.sh

echo "⚙️  Building Python Engine..."
./build_python_challenge_engine.sh

echo "✅ Setup complete! All Wasm modules are built."
