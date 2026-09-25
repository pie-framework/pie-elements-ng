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

### Events

The player dispatches each event from `<pie-element-player>`, bubbling and composed. A bubble-phase listener on the player, on an ancestor or on `document` hears each event once, with `event.target` the player; a listener outside a shadow root that contains the player sees that root's host instead. The element's own `session-changed` stops at the element, and the player dispatches its copy in its place. A capture-phase listener on the player or above it also hears every `session-changed` the element dispatches, ahead of the player's copy, and should ignore events whose `event.composedPath()[0]` is not the player. That equals `event.target` when no shadow root lies between listener and player. A closed shadow root hides the player from both, so listen in the bubble phase there.

| Event | When | `detail` |
|---|---|---|
| `session-changed` | delivery: the learner changes the session, or the element re-reports a session the player set (below) | the element's detail, with `session` the new session |
| `model-changed` | author: the author edits the model | the whole model |
| `load-complete` | the element is mounted | `strategy`, `view`, `tagName` |
| `load-cancelled` | a newer load supersedes this one, or the load fails with an abort error (below) | `reason`, `strategy`, `view` |
| `player-error` | the load fails | `error`, `strategy`, `view`, `retry` |
| `build-state` | the load changes stage | `loading`, `error`, `stage`, and `strategy`, `view`, `retry` where known |
| `bundle-retry-status` | IIFE: a bundle build is polled; any strategy: the load fails with an abort error | the retry state |
| `bundle-meta` | IIFE: the bundle loads | the bundle's metadata |
| `controller-load` | a load completes, except a `preloaded` one that finds its tag defined (below) | `status`, `source`, `packageName`, `strategy`, `view`, `message` |
| `controller-changed` | IIFE delivery: the bundle's controller loads | the controller |

`session-changed` also fires with no learner action. Once the element has a model, the player sets `session` on it, and sets it again whenever the host assigns a different session. An element that reports that assignment after its setter returns, as multiple-choice does, has the report forwarded.

An abort error is a load error whose message contains `aborted`, whatever the strategy. The player then emits `bundle-retry-status` with state `cancelled`, `build-state` with stage `cancelled` and `load-cancelled`, in place of `player-error`.

`controller-load` reports `status` `loaded` in delivery view, where any other status fails the load. Author view can also report `missing` or `failed`, and print view reports `not-required` unless an IIFE bundle carries a controller.

A player removed from the document mid-load emits nothing more from that load, and re-attaching it starts a new one; a synchronous move keeps the load.

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
