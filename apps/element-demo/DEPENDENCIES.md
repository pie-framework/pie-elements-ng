# Element Demo Dependencies

## Architecture

The demo app is designed to work with PIE elements loaded as ESM web components. This document explains the minimal dependency structure.

## Runtime Dependencies

Only two packages are needed at runtime:

- `@pie-element/bundler-shared` - Bundler infrastructure for IIFE operation
- `@pie-element/element-player` - Web component that loads and renders elements

### Why so minimal?

In production ESM mode, the demo app loads elements from a CDN (like esm.sh, jspm, or unpkg):

```typescript
// Production: Load from CDN
<pie-esm-element-player
  element-name="multiple-choice"
  cdn-url="https://esm.sh"
/>
```

The CDN:
1. Serves element packages from npm
2. Resolves all transitive dependencies automatically
3. Serves everything as ESM modules

This means the demo app doesn't need to know about element dependencies like React, TipTap, MUI, recharts, etc. They're encapsulated within the elements and resolved by the CDN.

## Development Dependencies

Development-only packages needed for local dev mode:

- `@pie-element/multiple-choice` - Example element for testing
- `@pie-element/shared-math-rendering-*` - Math rendering packages

### Why are these dev dependencies?

In local development mode (`vite dev`), the demo uses static imports instead of CDN:

```typescript
// Development: Load from workspace
<demo-element-player
  element-name="multiple-choice"
  cdn-url=""
/>
```

The empty `cdn-url` triggers the static import path, which:
1. Uses Vite's workspace resolver with `resolveSources: true`
2. Loads source files instead of built dist files
3. Requires workspace packages to be available for module resolution

These packages are marked as devDependencies because:
- They're only needed during `vite dev` (not for production builds)
- In production, elements load from CDN or IIFE bundles
- They're automatically available through Bun's workspace protocol

## Previously Removed Dependencies

These were incorrectly listed as runtime dependencies and have been removed:

### UI Libraries (already in elements)
- `@tiptap/core`, `@tiptap/extension-*` - In element-player
- `highlight.js`, `lowlight` - In element-player
- `katex` - In math rendering packages

### React (peer dependency)
- `react`, `react-dom` - Elements declare these as peer deps, not needed in demo

### Unused libraries
- `recharts` - Elements use `@visx/*` instead

## Migration Path

Currently the demo only supports local development mode. To support production CDN mode:

1. Update demo to accept and use `cdn-url` prop
2. Deploy elements to npm
3. Configure CDN URL (e.g., `https://esm.sh` or `https://unpkg.com`)
4. All element dependencies resolve automatically through CDN

At that point, only `@pie-element/element-player` would be needed as a runtime dependency (bundler-shared is only for IIFE mode).
