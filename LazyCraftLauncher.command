#!/bin/bash
# LazyCraftLauncher macOS helper

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting LazyCraftLauncher bootstrap..."

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Building launcher..."
npm run build

echo "Launching LazyCraftLauncher..."
node dist/main.js "$@"
