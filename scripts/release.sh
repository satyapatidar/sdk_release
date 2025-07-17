#!/bin/bash

set -e

VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="widget-sdk-v$VERSION.zip"

echo "🔧 Building the SDK..."
npm run build

echo "📦 Zipping build folder as $ZIP_NAME..."
zip -r $ZIP_NAME ./build

echo "📝 Updating lifecycle status..."
node scripts/classifyVersionLifecycle.js

echo "📄 Extracting release notes..."
node scripts/extract-release-notes.js "v$VERSION" > changelog-v$VERSION.json

echo "🚀 Publishing GitHub release..."
gh release create "v$VERSION" \
  --notes-file changelog-v$VERSION.json \
  --title "v$VERSION" \
  "$ZIP_NAME" \
  "sdk-version-status.json"

echo "✅ Done!"
