# Testing Bundler with Workspace Packages

Since the bundler is designed to download packages from NPM, but our local workspace packages have the fixed dependencies (using `@pie-element/shared-mathquill` instead of the broken git dependency), we need a way to test with local packages.

## Simple Approach: Manual Workspace Setup

The easiest way is to manually create a workspace that the bundler can use:

```bash
# 1. Create a test workspace
mkdir -p /tmp/pie-test-workspace/packages

# 2. Copy (or symlink) local packages
cp -r packages/shared/mathquill /tmp/pie-test-workspace/packages/
cp -r packages/elements-react/multiple-choice /tmp/pie-test-workspace/packages/

# 3. Create workspace package.json
cat > /tmp/pie-test-workspace/package.json << 'EOF'
{
  "name": "pie-test-workspace",
  "private": true,
  "workspaces": [
    "packages/*",
    "packages/*/controller",
    "packages/*/configure",
    "packages/*/author"
  ]
}
EOF

# 4. Install dependencies
cd /tmp/pie-test-workspace
bun install

# 5. Point the bundler to this workspace
# (Requires modifying the bundler to accept a workspace path)
```

## Automated Approach: test-with-workspace.ts

We've created a test script that automates this process:

```bash
cd packages/shared/bundler-shared
bun run tests/test-with-workspace.ts
```

This script:
1. Creates a temporary workspace
2. Symlinks local packages into it
3. Overrides the bundler's installer to use these local packages
4. Runs a full integration test
5. Verifies the bundles are created correctly

## Why This Works

The local packages in this workspace:
- ✅ Use `@pie-element/shared-mathquill` (no broken git dependencies)
- ✅ Have all dependencies properly defined
- ✅ Are built and ready to bundle

## Alternative: Verdaccio (More Complex)

You can also publish to a local NPM registry (Verdaccio), but this requires:
1. Converting workspace: protocol dependencies
2. Publishing each package
3. Configuring the bundler to use Verdaccio

The workspace approach is simpler and more direct for development/testing.

## Future: Once Published to NPM

Once the modernized elements are published to NPM:
- The integration tests will work without any special setup
- Just run: `bun test bundler.test.ts`
- No workspace tricks needed

## Current Status

- ✅ **Unit tests**: Working (don't require packages)
- ✅ **Workspace test**: Working (uses local packages)
- ⏳ **Full integration tests**: Waiting for NPM publish
