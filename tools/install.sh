#!/usr/bin/env bash

# Exit immediately if a command fails
set -e

echo "--------------------------------------------------"
echo "Installing project dependencies"
echo "--------------------------------------------------"

# 1. Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 could not be found. Please install Python 3."
    exit 1
fi

# 2. Create Virtual Environment if it doesn't exist
IF_VENV=".venv"
if [ ! -d "$IF_VENV" ]; then
    echo "📦 Creating virtual environment in ./$IF_VENV..."
    python3 -m venv $IF_VENV
else
    echo "✔ Virtual environment already exists."
fi

# 3. Activate Virtual Environment & Upgrade pip
echo "⚡ Activating virtual environment..."
source $IF_VENV/bin/activate

echo "🔄 Upgrading pip..."
pip install --upgrade pip

# 4. Install requirements
if [ -f "requirements.txt" ]; then
    echo "📥 Installing dependencies from requirements.txt..."
    pip install -r requirements.txt
else
    echo "⚠️  requirements.txt not found! Skipping Python dependency installation."
fi

echo "--------------------------------------------------"
echo "✅ Dependency Installation Complete!"
echo "--------------------------------------------------"
