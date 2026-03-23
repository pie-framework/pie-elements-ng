# PIE Element Player

Self-contained web components for rendering PIE elements, following the same architecture as `@pie-framework/pie-players`.

---

## ⚠️ IMPORTANT: NOT FOR PUBLISHING

**This package is currently marked as `private` and should NOT be published to npm.**

### Build Issue

The package has a dependency resolution issue that prevents it from building as a standalone library:

- [element-loader.ts](src/lib/element-loader.ts) imports `$lib/element-imports` for local development mode
- This import only exists in the element-demo app, not in this package
- The import is marked as external in the build config as a workaround
- For production use, this architecture needs to be refactored

**Before publishing this package**, the following must be resolved:

1. Refactor the element-loader to not depend on app-specific imports
2. Either remove local development mode from the library OR provide a proper abstraction
3. Ensure the build completes successfully without external dependencies on non-existent modules
4. Remove the `"private": true` field from package.json

**Issue tracked in**: Build fails with "Rollup failed to resolve import '$lib/element-imports'"

---

## Overview

The element player is a **standalone web component bundle** (`pie-element-player.js`) that can be dropped into any HTML page with a simple `<script>` tag. It loads PIE elements via dynamic ESM imports.

## Recommendation

Use the player as a **Node package dependency** in modern applications.

- Recommended: install/import via package manager and bundle with your app.
- Secondary/fallback: dynamic script/import-map loading for environments that cannot bundle.

Positioning note:

- In normal production integrations, use the standard production player stacks from the upstream PIE projects (`../pie-elements` and `../pie-players`).
- Treat `@pie-element/element-player` as a flexible element-level host for development, testing, and composable/advanced embedding scenarios.

Why this is preferred:

- Better build-time optimization and dependency deduplication
- More reliable versioning through lockfiles
- Better TypeScript/IDE support and compile-time validation
- Fewer runtime resolution issues (CDN/import-map/config drift)

## Usage

### Recommended: Node package integration

```ts
import '@pie-element/element-player/players';
```

Then render the host component and set `model`/`session` via properties in your framework/runtime.

### Dynamic loading fallback (supported)

For elements with import maps:

```html
<!DOCTYPE html>
<html>
<head>
  <title>PIE Element Demo</title>
</head>
<body>
  <pie-element-player
    id="player"
    element-name="hotspot"
    view="delivery"
  ></pie-element-player>

  <!-- Import map for module resolution -->
  <script type="importmap">
  {
    "imports": {
      "@pie-element/": "./packages/elements-svelte/"
    }
  }
  </script>

  <!-- Load the player bundle -->
  <script type="module" src="/packages/element-player/dist/pie-element-player.js"></script>

  <script type="module">
    const player = document.getElementById('player');
    player.model = { /* PIE model */ };
    player.session = { /* session data */ };
  </script>
</body>
</html>
```

## Architecture

### Unified Player

**Delivery view (`<pie-element-player view="delivery">`):**

- Loads elements via dynamic ESM imports: `import('@pie-element/hotspot')`
- Handles session state and user interactions
- Manages math rendering internally (MathJax)
- Emits `session-changed` events
- Works with both React and Svelte elements

**Print view (`<pie-element-player view="print">`):**

- Loads print exports: `import('@pie-element/hotspot/print')`
- Stateless (no session management)
- Optimized for print layouts
- Manages math rendering internally (MathJax)
- Role-based rendering (student/instructor)

**All views:**

- Use import maps for module resolution
- Self-contained (no external setup needed)
- Handle math rendering automatically
- Support for both React and Svelte elements

## Testing Elements Locally

Use the existing demo commands to test elements:

```bash
# Start demo server for Svelte elements
bun cli dev:demo hotspot
```

**Prerequisites:**

- Element must be built: `bun run turbo build --filter @pie-element/hotspot`
- Element player must be built: `bun run turbo build --filter @pie-element/element-player`

## Development

### Local Development

To test changes to player components:

```bash
# Build element-player
cd packages/element-player
bun run build

# Run element demo
cd ../..
bun cli dev:demo hotspot
```
