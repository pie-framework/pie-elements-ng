#!/bin/bash
#
# Prepare MathQuill bundle from source files
#
# This script concatenates the MathQuill source files in the correct order
# to create the legacy IIFE bundle. Run this when updating from upstream mathquill.
#
# Usage: ./scripts/prepare-bundle.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UPSTREAM_DIR="${UPSTREAM_DIR:-/Users/eelco.hillenius/dev/prj/pie/mathquill}"

echo "📦 Preparing MathQuill bundle..."
echo "   Package: $PKG_DIR"
echo "   Upstream: $UPSTREAM_DIR"

# Check if upstream exists
if [ ! -d "$UPSTREAM_DIR" ]; then
  echo "❌ Error: Upstream mathquill not found at $UPSTREAM_DIR"
  echo "   Set UPSTREAM_DIR environment variable to specify location"
  exit 1
fi

# Check if pjs is installed in upstream
if [ ! -f "$UPSTREAM_DIR/node_modules/pjs/src/p.js" ]; then
  echo "📥 Installing upstream dependencies..."
  cd "$UPSTREAM_DIR"
  npm install pjs
  cd "$PKG_DIR"
fi

# Create legacy directory
mkdir -p "$PKG_DIR/src/legacy"

# Concatenate sources in the correct order
echo "🔨 Concatenating source files..."
cat \
  "$PKG_DIR/src/intro.js" \
  "$UPSTREAM_DIR/node_modules/pjs/src/p.js" \
  "$PKG_DIR/src/tree.js" \
  "$PKG_DIR/src/cursor.js" \
  "$PKG_DIR/src/controller.js" \
  "$PKG_DIR/src/publicapi.js" \
  "$PKG_DIR/src/services/"*.util.js \
  "$PKG_DIR/src/services/"*.js \
  "$PKG_DIR/src/commands/math.js" \
  "$PKG_DIR/src/commands/text.js" \
  "$PKG_DIR/src/commands/math/"*.js \
  "$PKG_DIR/src/outro.js" \
  > "$PKG_DIR/src/legacy/mathquill-bundle.js"

# Count lines
LINE_COUNT=$(wc -l < "$PKG_DIR/src/legacy/mathquill-bundle.js" | tr -d ' ')

echo "✅ Bundle created: $LINE_COUNT lines"
echo "   Output: src/legacy/mathquill-bundle.js"
echo ""
echo "Next steps:"
echo "  1. Review the bundle if needed"
echo "  2. Run: bun run build"
echo "  3. Test with consuming packages"
