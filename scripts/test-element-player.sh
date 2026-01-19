#!/bin/bash
# Helper script to test element player from repo root

cd "$(dirname "$0")/.."
exec ./packages/shared/element-player/test/test-standalone.sh
