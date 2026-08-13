#!/usr/bin/env bash
set -euo pipefail

# Move to root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Move directly into the python directory
cd "$ROOT_DIR/challenge-engine/python"

echo "Indexing Python challenges..."

# Auto-generate challenge manifest file safely
python3 -c '
import os, json

challenges_dir = "challenges"
output_file = "challenges.json"

if os.path.exists(challenges_dir):
    files = [f for f in os.listdir(challenges_dir) if f.endswith(".py") and not f.startswith("_")]
    
    # Safely handle parent dir check only if a path exists
    parent_dir = os.path.dirname(output_file)
    if parent_dir:
        os.makedirs(parent_dir, exist_ok=True)

    with open(output_file, "w") as f:
        json.dump(files, f, indent=2)

    print(f"Successfully generated {output_file} with {len(files)} challenge(s).")
else:
    print(f"Warning: {challenges_dir} directory not found.")
'

echo "Copying Python engine to frontend..."

# Remove old target directory if it exists
rm -rf "$ROOT_DIR/frontend/app/chapters/python_engine"

# FIX: Copy current directory (.) since we are inside challenge-engine/python
cp -R . "$ROOT_DIR/frontend/app/chapters/python_engine"

echo "Done!"
