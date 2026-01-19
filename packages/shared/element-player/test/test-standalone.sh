#!/bin/bash
# Automated test script for PIE Element Player standalone testing

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
PLAYER_DIR="$REPO_ROOT/packages/shared/element-player"
TEST_PORT=5175

echo "🧪 PIE Element Player - Standalone Test Setup"
echo "=============================================="
echo ""
echo "Repo root: $REPO_ROOT"
echo "Player dir: $PLAYER_DIR"
echo ""

# Function to cleanup background processes
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  if [ ! -z "$ESM_CDN_PID" ]; then
    kill -TERM $ESM_CDN_PID 2>/dev/null || true
  fi
  if [ ! -z "$HTTP_PID" ]; then
    kill -TERM $HTTP_PID 2>/dev/null || true
  fi
  exit 0
}

trap cleanup INT TERM

# Step 1: Build element player if needed
echo "📦 Step 1: Checking element player build..."
if [ ! -f "$PLAYER_DIR/dist/pie-element-player.js" ]; then
  echo "Building element player..."
  cd "$PLAYER_DIR"
  bun run build
else
  echo "✓ Element player already built"
fi

# Step 2: Start local-esm-cdn
echo ""
echo "🌐 Step 2: Starting local-esm-cdn..."
cd "$REPO_ROOT/apps/local-esm-cdn"
LOCAL_ESM_CDN_BUILD_SCOPE=none bun run dev &
ESM_CDN_PID=$!
echo "Started local-esm-cdn (PID: $ESM_CDN_PID)"

# Wait for local-esm-cdn to be ready
echo "Waiting for local-esm-cdn to start..."
sleep 3

# Step 3: Build hotspot element
echo ""
echo "🔨 Step 3: Building hotspot element..."
cd "$REPO_ROOT"
bun run build --filter @pie-element/hotspot

# Step 4: Start HTTP server for test page
echo ""
echo "🌍 Step 4: Starting HTTP server for test page..."
cd "$PLAYER_DIR"
python3 -m http.server $TEST_PORT &
HTTP_PID=$!
echo "Started HTTP server (PID: $HTTP_PID)"

# Wait for HTTP server to be ready
sleep 2

# Step 5: Open browser
echo ""
echo "✅ Setup complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Test page is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Test URL: http://localhost:$TEST_PORT/test/index.html"
echo ""
echo "🔍 Verification Checklist:"
echo "  ☐ Custom element loads without errors"
echo "  ☐ Hotspot element renders correctly"
echo "  ☐ Mode switching works (Gather/View/Evaluate)"
echo "  ☐ Session updates when clicking hotspots"
echo "  ☐ Controller scoring works in Evaluate mode"
echo "  ☐ Reset button clears session"
echo "  ☐ All UI controls function correctly"
echo ""
echo "🔧 Services running:"
echo "  - local-esm-cdn: http://localhost:5179"
echo "  - Test server:   http://localhost:$TEST_PORT"
echo ""
echo "Press Ctrl+C to stop all services and exit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Try to open in browser (macOS)
if command -v open &> /dev/null; then
  echo "Opening browser..."
  sleep 1
  open "http://localhost:$TEST_PORT/test/index.html"
fi

# Wait for user to stop
wait
