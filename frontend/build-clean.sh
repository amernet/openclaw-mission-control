#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🧹 Cleaning build artifacts..."
rm -f .next/lock
rm -rf .turbo

echo "🔨 Starting build..."
npm run build

echo "✅ Build complete!"
echo ""
echo "To deploy, run:"
echo "  sudo systemctl restart mc-frontend"
