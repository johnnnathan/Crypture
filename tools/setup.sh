#!/usr/bin/env bash
set -e

echo "🚀 Setting up Cryptography CTF Environment..."

# Ensure the build scripts are executable
chmod +x ./build_crypto_engine.sh ./build_challenge_engine.sh

# Call the local build scripts directly
echo "⚙️  Building Simulators Engine..."
./build_crypto_engine.sh

echo "⚙️  Building Challenge Engine..."
./build_challenge_engine.sh

echo "✅ Setup complete! All Wasm modules are built."
