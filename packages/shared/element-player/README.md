# PIE Element Player

Self-contained web components for rendering PIE elements, following the same architecture as `@pie-framework/pie-players`.

## Overview

The element player is a **standalone web component bundle** (`pie-element-player.js`) that can be dropped into any HTML page with a simple `<script>` tag. It loads PIE elements via dynamic ESM imports.

## Usage

### ESM Player

For elements with import maps:

```html
<!DOCTYPE html>
<html>
<head>
  <title>PIE Element Demo</title>
</head>
<body>
  <pie-esm-element-player
    id="player"
    element-name="hotspot"
  ></pie-esm-element-player>

  <!-- Import map for module resolution -->
  <script type="importmap">
  {
    "imports": {
      "@pie-element/": "./packages/elements-svelte/"
    }
  }
  </script>

  <!-- Load the player bundle -->
  <script type="module" src="/packages/shared/element-player/dist/pie-element-player.js"></script>

  <script type="module">
    const player = document.getElementById('player');
    player.model = { /* PIE model */ };
    player.session = { /* session data */ };
  </script>
</body>
</html>
```

## Architecture

### ESM Player (`<pie-esm-element-player>`)

- Loads elements via dynamic ESM imports: `import('@pie-element/hotspot')`
- Uses import maps for module resolution
- Smaller bundle sizes (shared dependencies via CDN)
- Fast refresh during development
- Works with both React and Svelte elements

## Testing Elements Locally

Use the existing demo commands to test elements:

```bash
# Start demo server for Svelte elements
bun cli dev:demo hotspot
```

**Prerequisites:**

- Element must be built: `bun run turbo build --filter @pie-element/hotspot`
- Element player must be built: `bun run turbo build --filter @pie-elements-ng/element-player`

## Development

### Local Development

To test changes to player components:

```bash
# Build element-player
cd packages/shared/element-player
bun run build

# Run element demo
cd ../../../
bun cli dev:demo hotspot
```
