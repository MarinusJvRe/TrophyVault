#!/bin/bash
set -e

echo "=== Post-merge setup ==="

echo "Installing npm dependencies..."
npm install --prefer-offline --no-audit --no-fund < /dev/null 2>&1

echo "Pushing database schema..."
npx drizzle-kit push --force < /dev/null 2>&1

echo "=== Post-merge setup complete ==="
