#!/usr/bin/env bash
set -euo pipefail

# Move to root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Starting CTF Platform Server..."

# Move to python engine directory
cd "$ROOT_DIR/challenge-engine/python"

# Check if uvicorn is installed
if ! command -v uvicorn &> /dev/null; then
    echo "❌ Error: uvicorn is not installed in the active environment."
    echo "Run 'pip install uvicorn fastapi' to install dependencies."
    exit 1
fi

# Run the server using Uvicorn
echo "Serving frontend & API on http://localhost:8000..."
exec uvicorn server:app --reload --port 8000
