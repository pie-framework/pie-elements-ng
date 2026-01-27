# PIE Element Demo System

## Overview

This document describes the demo system for PIE elements (both React and Svelte), using a two-server architecture with Verdaccio for package validation and a custom package server for file serving.

## Architecture

### Two-Server Design

Each element demo uses two complementary servers:

```
Browser Request → Import Maps (localhost:4874)
                  ↓
┌─────────────────┐
│ Package Server  │  Serves built dist/ files for browser import maps
│ (Bun)           │
│ localhost:4874  │
└─────────────────┘

Built Packages → npm publish
                 ↓
┌─────────────────┐
│ Verdaccio       │  Validates packages can be published to npm
│ (Docker)        │
│ localhost:4873  │
└─────────────────┘
```

### Why Two Servers?

1. **Verdaccio (Port 4873) - Package Validation**
   - Validates packages can be published to npm
   - Tests package.json configuration
   - Verifies tarball structure
   - **Does NOT serve individual files** (only tarballs for npm install)

2. **Package Server (Port 4874) - File Serving**
   - Serves built dist/ files directly from workspace
   - Works with browser import maps
   - Provides CDN-like file serving for demos
   - Fast iteration without republishing

This gives us both production validation (Verdaccio) and developer convenience (package server).

### Key Components

1. **Element Player** (`packages/shared/element-player/`)
   - Svelte 5 web component: `<pie-element-player>`
   - Custom element with shadow: none
   - Props: elementName, model, session
   - Dynamically loads PIE elements and registers them as custom HTML elements
   - Integrates controller for scoring in evaluate mode

2. **Package Server** (`scripts/serve-packages.ts`)
   - Scans workspace packages
   - Serves files from built dist/ directories
   - Provides CDN-like URLs: `http://localhost:4874/@pie-element/multiple-choice/0.1.0/dist/index.js`
   - Started automatically by demo commands

3. **Verdaccio Registry** (Docker)
   - Local npm registry for validation
   - Managed via `npm run registry:*` scripts
   - Used to ensure packages are production-ready

4. **Per-Element Demos** (`packages/elements-{react|svelte}/*/docs/demo/`)
   - Complete Vite app per element
   - Uses existing config.mjs and session.mjs
   - Import maps point to package server

## File Structure

### Shared Element Player

```
packages/shared/element-player/
├── package.json
├── vite.config.ts              # Build config for web component
├── tsconfig.json
├── src/
│   ├── index.ts                # Exports web component
│   ├── PieElementPlayer.svelte # Main web component
│   ├── lib/
│   │   ├── element-loader.ts   # Dynamic element loading
│   │   └── types.ts            # TypeScript types
│   └── components/
│       ├── ModeSelector.svelte
│       ├── SessionPanel.svelte
│       ├── ScoringPanel.svelte
│       └── Tabs.svelte
├── templates/                  # Demo templates
│   ├── esm-demo.html
│   ├── demo-init.ts.template
│   └── vite.config.ts.template
└── dist/
    └── pie-element-player.js   # Built output
```

### Per-Element Demo

```
packages/elements-react/{element}/docs/demo/
├── vite.config.ts              # Simple Vite config
├── index.html                  # Redirects to esm.html
├── esm.html                    # Import maps + <pie-element-player>
├── src/
│   └── esm.ts                  # Demo initialization
├── config.mjs                  # Model configurations (existing)
└── session.mjs                 # Session data (existing)
```

## Usage

### Running a Demo

**From the repo root** (recommended):

```bash
# React element demo
bun run dev:demo:react multiple-choice

# Svelte element demo
bun run dev:demo:svelte slider
```

This will:

1. Publish packages to Verdaccio (validates production readiness)
2. Build the element-player (if needed)
3. Build the specified element (if needed)
4. Start the package server on port 4874
5. Start the Vite dev server for the demo
6. Open the demo in your browser

**From the element directory** (alternative):

```bash
cd packages/elements-react/multiple-choice
bun run demo
```

Note: You may need to manually run `npm run registry:publish` first if packages aren't published.

### Demo HTML Template

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PIE Demo - Multiple Choice</title>
  <script type="importmap">
    {
      "imports": {
        "@pie-element/element-player": "http://localhost:4874/@pie-element/element-player/0.1.0/dist/pie-element-player.js",
        "@pie-element/multiple-choice/": "http://localhost:4874/@pie-element/multiple-choice/0.1.0/dist/",
        "@pie-lib/": "http://localhost:4874/@pie-lib/"
      }
    }
  </script>
  <style>
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
    }
    .demo-container {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div class="demo-container">
    <h1>🎯 Multiple Choice Demo</h1>
    <pie-element-player
      id="player"
      element-name="multiple-choice"
    ></pie-element-player>
  </div>
  <script type="module" src="./src/esm.ts"></script>
</body>
</html>
```

### Demo Main Script Template

```typescript
// Import the player component (loads and registers custom elements)
import '@pie-element/element-player';
import config from '../config.mjs';
import sessions from '../session.mjs';

// Extract model and session from imported data
const model = Array.isArray(config?.models) ? config.models[0] : config;
const session = Array.isArray(sessions) ? sessions[0] : sessions;

console.log('[demo] Initializing demo');
console.log('[demo] Model:', model);
console.log('[demo] Session:', session);

// Wait for custom element to be defined
await customElements.whenDefined('pie-element-player');

// Get player element
const player = document.getElementById('player') as any;

if (!player) {
  console.error('[demo] Player element not found');
  throw new Error('Player element not found');
}

console.log('[demo] Player element found:', player);

// Set properties (create new objects to trigger reactivity)
console.log('[demo] Setting model and session...');
player.model = { ...model };
player.session = { ...session };
console.log('[demo] Model and session set');

// Listen for session changes
player.addEventListener('session-changed', (e: Event) => {
  console.log('[demo] Session changed:', (e as CustomEvent).detail);
});

console.log('[demo] Demo initialized');
```

### Vite Config Template

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5174
  },
  preview: {
    port: 5174
  }
});
```

## How It Works

### 1. Package Validation

Before starting the demo, packages are published to Verdaccio:

1. Build all packages with Turbo
2. Publish each package to `http://localhost:4873`
3. Verdaccio validates package structure, exports, dependencies
4. Ensures packages are production-ready

### 2. Element Loading

When the page loads:

1. Browser loads `<pie-element-player>` custom element from import map
2. Element player calls `loadElement('@pie-element/multiple-choice', 'multiple-choice-element')`
3. Browser resolves import via import map: `@pie-element/multiple-choice/` → `http://localhost:4874/@pie-element/multiple-choice/0.1.0/dist/`
4. Package server serves file from workspace: `packages/elements-react/multiple-choice/dist/index.js`
5. Browser loads the element and all its dependencies via import map
6. Element class is registered: `customElements.define('multiple-choice-element', MultipleChoiceElement)`
7. Element instance created: `<multiple-choice-element>` inserted in DOM
8. Props set: `element.model = {...}`, `element.session = {...}`

### 3. Controller Loading

When switching to evaluate mode:

1. Element player calls `loadController('@pie-element/multiple-choice')`
2. Browser resolves: `@pie-element/multiple-choice/controller` → `http://localhost:4874/@pie-element/multiple-choice/0.1.0/dist/controller/index.js`
3. Package server serves controller from `packages/elements-react/multiple-choice/dist/controller/index.js`
4. Controller methods available: `model()`, `score()`, `outcome()`

### 4. Import Resolution

All imports are resolved via the browser's native import map:

```javascript
// In the element's built code
import { renderMath } from "@pie-lib/math-rendering";
import React from "react";
```

The import map tells the browser where to find these:

```json
{
  "imports": {
    "@pie-lib/": "http://localhost:4874/@pie-lib/",
    "react": "https://esm.sh/react@18.2.0"
  }
}
```

## Key Design Decisions

### Why Verdaccio?

- **Production-equivalent**: Tests real npm package structure
- **Validates exports**: Catches package.json issues before publishing
- **Cross-platform**: Works identically via Docker
- **No external dependencies**: Local iteration without npm

### Why Package Server?

- **Fast iteration**: Serves files directly without republishing
- **Simple**: Just maps URLs to workspace dist/ folders
- **CDN-like**: Mimics real CDN behavior for import maps
- **Lightweight**: 90-line Bun script

### Why Import Maps?

- **Native browser feature**: No build step or bundler needed
- **Production-like**: Same as real CDN usage
- **Clear dependencies**: See exactly what's being loaded
- **Flexible**: Easy to add/remove packages

### Why Per-Element Demos?

- Elements own their demos (no central coordination)
- Easy to add new element demos (copy template)
- Can customize per element if needed
- Matches existing config.mjs/session.mjs pattern

## Verdaccio Commands

```bash
# Start Verdaccio (Docker)
npm run registry:start

# Stop Verdaccio
npm run registry:stop

# Check status
npm run registry:status

# Publish all packages
npm run registry:publish

# Force republish (bumps versions)
npm run registry:publish:force

# Reset registry (delete all data)
npm run registry:reset

# View logs
npm run registry:logs
```

## Troubleshooting

### 404 for package files

**Problem:** `http://localhost:4874/@pie-element/something/0.1.0/dist/index.js` returns 404

**Solution:** Ensure the package is built:
```bash
cd packages/elements-react/something
bun run build
```

### Verdaccio not running

**Problem:** `registry:publish` fails with connection error

**Solution:** Start Verdaccio:
```bash
npm run registry:start
```

### Element not loading

**Problem:** Element player shows loading forever

**Solution:**

1. Check browser console for errors
2. Verify element is built: `cd packages/elements-react/{element} && bun run build`
3. Verify package server is running (should start automatically with demo)

### Import map not working

**Problem:** Browser can't resolve `@pie-element/*` imports

**Solution:**

1. Check that esm.html has the import map
2. Verify package server is running on port 4874
3. Check browser console for import errors

## Future Enhancements

1. **Auto-generate demos** for all elements
2. **Demo gallery** - index page listing all element demos
3. **Hot reload** - watch dist/ and reload on changes
4. **Version management** - support multiple versions in package server
5. **CDN fallback** - fall back to real CDN if local files missing
6. **Model editor** - in-app config editor
7. **Snapshot/restore** - save and load demo states

## Related Documentation

- [ESM Testing Strategy](./esm-testing-strategy.md) - Architecture and rationale
- [Verdaccio Setup](./verdaccio-setup.md) - Detailed Verdaccio configuration
- [Adding a Demo](./ADDING_DEMO.md) - How to create demos for new elements
