#!/bin/bash
# Start demo servers: local-esm-cdn + static HTTP server
# This script runs both servers needed for element demos:
# - local-esm-cdn on port 5179 (serves PIE packages + proxies to esm.sh)
# - Bun HTTP server on port 5174 (serves demo HTML files)

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🚀 Starting demo servers..."
echo "  - local-esm-cdn: http://localhost:5179"
echo "  - Demo server: http://localhost:5174"
echo ""

# Start local-esm-cdn in background
echo "Starting local-esm-cdn..."
cd "$REPO_ROOT/apps/local-esm-cdn"
LOCAL_ESM_CDN_BUILD_SCOPE=none bun run dev &
ESM_CDN_PID=$!

# Wait for local-esm-cdn to be ready
sleep 2

# Start Bun HTTP server for demo HTML files
echo "Starting HTTP server for demos..."
cd "$REPO_ROOT"
bun scripts/http-server.ts &
HTTP_PID=$!

echo ""
echo "✅ Servers running!"
echo "  - local-esm-cdn PID: $ESM_CDN_PID"
echo "  - HTTP server PID: $HTTP_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Handle Ctrl+C to kill both processes and their children
cleanup() {
  echo ''
  echo 'Stopping servers...'
  # Kill the process groups to ensure all child processes are terminated
  kill -TERM -$ESM_CDN_PID 2>/dev/null || true
  kill -TERM -$HTTP_PID 2>/dev/null || true
  # Give them a moment to shut down gracefully
  sleep 1
  # Force kill if still running
  kill -9 -$ESM_CDN_PID 2>/dev/null || true
  kill -9 -$HTTP_PID 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

# Wait for both processes
wait $ESM_CDN_PID $HTTP_PID
