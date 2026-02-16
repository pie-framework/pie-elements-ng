# Testing the PIE Bundler

This document explains how to test the bundler with local workspace packages.

## Overview

The bundler creates IIFE (Immediately Invoked Function Expression) bundles for PIE elements that are compatible with `pie-player-components`. These bundles assign to `window.pie` and include the Element component, and optionally the controller and Configure components.

## Test Command

```bash
bun cli dev:test-bundler [--element <name>] [--verbose] [--keep-workspace] [--clean]
```

### Options

- `--element <name>` - Element to test (default: multiple-choice)
- `--verbose` - Show detailed webpack output
- `--keep-workspace` - Keep the temporary workspace for debugging
- `--clean` - Clean workspace before running

### Examples

```bash
# Test with multiple-choice element
bun cli dev:test-bundler

# Test with verbose output
bun cli dev:test-bundler --verbose

# Test and keep workspace for inspection
bun cli dev:test-bundler --keep-workspace

# Test a different element
bun cli dev:test-bundler --element hotspot
```

## How It Works

The test command:

1. **Builds Local Packages**
   - Builds `packages/shared/mathquill` (shared dependency)
   - Builds the target element package

2. **Creates Test Workspace**
   - Creates a temporary workspace directory
   - Symlinks local packages into `packages/`
   - Creates symlinks in `node_modules/@pie-element/`
   - Installs bundler dependencies (esbuild-loader, css-loader, etc.)

3. **Runs Bundler**
   - Generates entry files (player.js, client-player.js, editor.js)
   - Runs webpack to create IIFE bundles
   - Outputs to temporary directory

4. **Verifies Output**
   - Checks that all three bundle files exist
   - Verifies player.js contains `window.pie`
   - Reports bundle sizes

## Implementation Details

### Test Workspace Structure

```
/tmp/pie-bundler-workspace-test/
├── workspace/
│   ├── package.json (workspace config)
│   ├── packages/
│   │   ├── shared-mathquill/ (symlink)
│   │   └── multiple-choice/ (symlink)
│   ├── node_modules/
│   │   ├── @pie-element/
│   │   │   ├── shared-mathquill/ (symlink)
│   │   │   └── multiple-choice/ (symlink)
│   │   ├── esbuild-loader/
│   │   └── ... (webpack loaders)
│   └── entries/
│       ├── player.js
│       ├── client-player.js
│       └── editor.js
├── cache/ (for bundler cache)
└── output/
    └── <hash>/
        ├── player.js
        ├── client-player.js
        └── editor.js
```

### Known Limitations

The current test implementation has one known limitation:

**Missing Transitive Dependencies**: The test workspace only symlinks the target element and `shared-mathquill`. Other `@pie-element/*` packages that the element depends on (like `shared-math-rendering-mathjax`, `shared-player-events`, etc.) are not automatically linked.

**Workaround**: The webpack config adds the repo's root `node_modules` to the resolve paths, allowing webpack to find these packages from the main repository.

**Ideal Solution**: Automatically discover and link all `@pie-element/*` dependencies from the element's package.json.

## Bundle Output Format

The bundler produces bundles compatible with the production `pie-api-aws` bundler:

```javascript
// Webpack IIFE wrapper
(()=>{
  // Module system
  var modules = { /* ... */ };
  function require(id) { /* ... */ }

  // Exports
  var exports = {
    '@pie-element/multiple-choice': { Element: MultipleChoice, controller: Controller },
    '@pie-element/multiple-choice@0.1.0': { Element: MultipleChoice, controller: Controller }
  };

  // Global assignment
  window.pie = exports;
})();
```

## Troubleshooting

### Command Not Found

If you get "command not found", rebuild the CLI:

```bash
cd tools/cli
bun run build
```

### Build Failures

If the element build fails, check:

1. Element has a build script in package.json
2. Element dependencies are installed
3. Run `bun install` in the element directory

### Webpack Errors

If webpack fails to resolve modules:

1. Check that `node_modules/@pie-element/` contains the symlinked packages
2. Verify the element's built `dist/` directory exists
3. Use `--verbose` to see detailed webpack output
4. Use `--keep-workspace` to inspect the workspace structure

### Missing Packages

If webpack can't find `@pie-element/*` packages:

1. Make sure the repo's root `node_modules` is populated (`bun install` at root)
2. The test automatically adds root node_modules to webpack's resolve paths
3. Check that the missing package has been built (`turbo run build`)

## Next Steps

To fully test the bundler:

1. **Fix Transitive Dependencies**: Automatically discover and link all `@pie-element/*` deps
2. **Test with Verdaccio**: Publish to local npm registry for more realistic testing
3. **Integration Tests**: Test bundles with actual `pie-player-components`
4. **Multiple Elements**: Test bundling multiple elements in one bundle
5. **Production Comparison**: Binary diff with production bundles

## Related Files

- [tools/cli/src/commands/dev/test-bundler.ts](../../tools/cli/src/commands/dev/test-bundler.ts) - Test command implementation
- [src/index.ts](./src/index.ts) - Main bundler class
- [src/entry-generator.ts](./src/entry-generator.ts) - Entry file generation
- [src/webpack-config.ts](./src/webpack-config.ts) - Webpack configuration
- [tests/verify-bundle-compatibility.md](./tests/verify-bundle-compatibility.md) - Compatibility verification
