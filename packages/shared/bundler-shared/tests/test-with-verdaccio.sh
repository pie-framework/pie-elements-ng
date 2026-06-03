#!/bin/bash
set -e

echo "🚀 Testing bundler with local packages via Verdaccio"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VERDACCIO_URL="http://localhost:4873"
TEST_VERSION="0.0.0-test.$(date +%s)"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

find_workspace_root() {
  local dir="$1"

  while [ "$dir" != "/" ]; do
    if [ -f "$dir/package.json" ] && node -e "const pkg = require(process.argv[1]); process.exit(Array.isArray(pkg.workspaces) || Array.isArray(pkg.workspaces && pkg.workspaces.packages) ? 0 : 1)" "$dir/package.json"; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done

  return 1
}

WORKSPACE_ROOT="$(find_workspace_root "$SCRIPT_DIR")"
TEST_PACKAGE="${VERDACCIO_TEST_PACKAGE:-@pie-element/multiple-choice}"
PACKAGES_INPUT="${VERDACCIO_PACKAGES:-$TEST_PACKAGE}"
IFS=',' read -ra RAW_PACKAGES <<< "$PACKAGES_INPUT"
PACKAGES=()
for RAW_PKG in "${RAW_PACKAGES[@]}"; do
  PKG="$(echo "$RAW_PKG" | xargs)"
  if [ -n "$PKG" ]; then
    PACKAGES+=("$PKG")
  fi
done

if [ ${#PACKAGES[@]} -eq 0 ]; then
  PACKAGES=("$TEST_PACKAGE")
fi

TEST_PACKAGE_INCLUDED=false
for PKG in "${PACKAGES[@]}"; do
  if [ "$PKG" = "$TEST_PACKAGE" ]; then
    TEST_PACKAGE_INCLUDED=true
    break
  fi
done
if [ "$TEST_PACKAGE_INCLUDED" = false ]; then
  PACKAGES+=("$TEST_PACKAGE")
fi

resolve_workspace_package() {
  node - "$WORKSPACE_ROOT" "$1" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');

const workspaceRoot = process.argv[2];
const packageName = process.argv[3];
const rootPackageJson = JSON.parse(fs.readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'));
const workspaces = Array.isArray(rootPackageJson.workspaces)
  ? rootPackageJson.workspaces
  : rootPackageJson.workspaces?.packages || [];

for (const pattern of workspaces) {
  if (!pattern.endsWith('/*')) continue;

  const baseDir = path.join(workspaceRoot, pattern.slice(0, -2));
  if (!fs.existsSync(baseDir)) continue;

  for (const entry of fs.readdirSync(baseDir)) {
    const packageDir = path.join(baseDir, entry);
    const packageJsonPath = path.join(packageDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) continue;

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.name === packageName) {
      console.log(packageDir);
      process.exit(0);
    }
  }
}

console.error(`Package ${packageName} was not found in workspace packages.`);
process.exit(1);
NODE
}

echo -e "${BLUE}Step 1: Check if Verdaccio is running${NC}"
if ! curl -sf "$VERDACCIO_URL/-/ping" > /dev/null; then
  echo -e "${RED}❌ Verdaccio is not running${NC}"
  echo "Start it with: docker compose up -d verdaccio"
  exit 1
fi
echo -e "${GREEN}✅ Verdaccio is running${NC}"
echo ""

echo -e "${BLUE}Step 2: Build and publish local packages to Verdaccio${NC}"
echo "Test version: $TEST_VERSION"
echo ""

# Configure npm to use Verdaccio (temporarily)
export NPM_CONFIG_REGISTRY="$VERDACCIO_URL"

for PKG in "${PACKAGES[@]}"; do
  PKG_PATH="$(resolve_workspace_package "$PKG")"

  if [ ! -d "$PKG_PATH" ]; then
    echo -e "${YELLOW}⚠️  Skipping $PKG (not found)${NC}"
    continue
  fi

  echo -e "${BLUE}📦 Publishing $PKG${NC}"

  # Get package name
  PKG_NAME=$(cd "$PKG_PATH" && node -p "require('./package.json').name")

  # Build the package
  echo "  Building..."
  (cd "$PKG_PATH" && bun run build 2>&1 | grep -v "^$" || true)

  # Update version temporarily
  ORIGINAL_VERSION=$(cd "$PKG_PATH" && node -p "require('./package.json').version")
  echo "  Setting version to $TEST_VERSION..."
  (cd "$PKG_PATH" && npm version "$TEST_VERSION" --no-git-tag-version --allow-same-version > /dev/null)

  # Publish to Verdaccio
  echo "  Publishing to Verdaccio..."
  (cd "$PKG_PATH" && npm publish --registry "$VERDACCIO_URL" 2>&1 | tail -1)

  # Restore original version
  (cd "$PKG_PATH" && npm version "$ORIGINAL_VERSION" --no-git-tag-version --allow-same-version > /dev/null)

  echo -e "${GREEN}  ✅ Published $PKG_NAME@$TEST_VERSION${NC}"
  echo ""
done

echo -e "${BLUE}Step 3: Verify packages are available${NC}"
for PKG in "${PACKAGES[@]}"; do
  PKG_PATH="$(resolve_workspace_package "$PKG")"
  if [ ! -d "$PKG_PATH" ]; then
    continue
  fi

  PKG_NAME=$(cd "$PKG_PATH" && node -p "require('./package.json').name")

  if curl -sf "$VERDACCIO_URL/$PKG_NAME" > /dev/null; then
    echo -e "${GREEN}✅ $PKG_NAME is available${NC}"
  else
    echo -e "${RED}❌ $PKG_NAME is NOT available${NC}"
  fi
done
echo ""

echo -e "${BLUE}Step 4: Create test script with Verdaccio registry${NC}"
cat > test-verdaccio.ts << EOF
import { Bundler } from '../src/index';
import { tmpdir } from 'os';
import { join } from 'path';

// Override the registry in the bundler
const originalExtract = require('pacote').extract;
const pacote = require('pacote');
pacote.extract = function(spec: string, dest: string, opts: any) {
  return originalExtract(spec, dest, {
    ...opts,
    registry: '${VERDACCIO_URL}/',
  });
};

async function test() {
  const bundler = new Bundler(
    join(tmpdir(), 'bundler-verdaccio-test-output'),
    join(tmpdir(), 'bundler-verdaccio-test-cache')
  );

  console.log('Testing with Verdaccio packages...');
  const result = await bundler.build({
    dependencies: [
      { name: '${TEST_PACKAGE}', version: '${TEST_VERSION}' }
    ]
  });

  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('✅ Test passed! Bundle created successfully from local packages.');
    process.exit(0);
  } else {
    console.error('❌ Test failed!');
    console.error('Errors:', result.errors);
    process.exit(1);
  }
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
EOF

echo -e "${GREEN}✅ Test script created${NC}"
echo ""

echo -e "${BLUE}Step 5: Run integration test${NC}"
bun run test-verdaccio.ts

echo ""
echo -e "${GREEN}🎉 All tests passed!${NC}"
