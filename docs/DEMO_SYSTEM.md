# PIE Element Demo System

## Overview

This document describes the new demo system for PIE React elements, built with Svelte 5 and an embedded local ESM CDN.

## Architecture

### Single Server Design

Each element demo runs as a **single Vite development server** with an embedded local ESM CDN:

```
Browser Request → Vite Dev Server (localhost:5174)
                  ├─ Regular files (HTML, JS, CSS)
                  └─ Vite Plugin intercepts /@pie-* requests
                     └─ Serves from local dist/ folders with import rewriting
```

### Key Components

1. **Element Player** (`packages/shared/element-player/`)
   - Svelte 5 web component: `<pie-element-player>`
   - Custom element with shadow: none
   - Props: elementName, cdnUrl, model, session, mode, showConfigure, debug
   - Dynamically loads PIE elements and registers them as custom HTML elements
   - Integrates controller for scoring in evaluate mode

2. **Local ESM CDN** (`apps/local-esm-cdn/`)
   - Embedded as Vite plugin via `@pie-element/local-esm-cdn/adapters/vite`
   - Intercepts requests to `/@pie-*` URLs
   - Serves PIE packages from local `dist/` folders
   - Rewrites imports:
     - `@pie-element/foo` → `/@pie-element/foo`
     - `@pie-lib/bar` → `/@pie-lib/bar`
     - External packages → `https://esm.sh/package`

3. **Per-Element Demos** (`packages/elements-react/*/docs/demo/`)
   - Complete Vite app per element
   - Uses existing config.mjs and session.mjs
   - No central demo app

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
└── dist/
    └── pie-element-player.js   # Built output (87 KB)
```

### Per-Element Demo

```
packages/elements-react/{element}/docs/demo/
├── vite.config.ts              # Vite config with local-esm-cdn plugin
├── index.html                  # Entry HTML with <pie-element-player>
├── src/
│   └── main.ts                 # Demo initialization
├── config.mjs                  # Model configurations (existing)
└── session.mjs                 # Session data (existing)
```

## Usage

### Running a Demo

**From the repo root** (recommended):

```bash
bun react-demo --element hotspot
```

This will:

1. Build the element-player and all dependencies
2. Build the specified element
3. Start the Vite dev server with embedded local-esm-cdn
4. Open the demo in your browser

**From the element directory** (alternative):

```bash
cd packages/elements-react/hotspot
bun run demo
```

Note: You may need to manually build the element-player first if it hasn't been built yet.

### Demo HTML Template

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PIE Demo - {Element Name}</title>
</head>
<body>
  <h1>{Element} Demo</h1>
  <pie-element-player
    element-name="{element}"
    cdn-url=""
    show-configure="false"
    debug="true"
  ></pie-element-player>

  <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

### Demo Main Script Template

```typescript
import '../../../../../shared/element-player/dist/pie-element-player.js';
import config from '../config.mjs';
import sessions from '../session.mjs';

customElements.whenDefined('pie-element-player').then(() => {
  const player = document.querySelector('pie-element-player');
  if (player) {
    const model = Array.isArray(config?.models) ? config.models[0] : config;
    const session = Array.isArray(sessions) ? sessions[0] : sessions;

    (player as any).model = model;
    (player as any).session = session;

    player.addEventListener('session-changed', (e: Event) => {
      console.log('Session changed:', (e as CustomEvent).detail);
    });
  }
});
```

### Vite Config Template

```typescript
import { defineConfig } from 'vite';
import { createVitePlugin as createLocalEsmCdnPlugin } from '@pie-element/local-esm-cdn/adapters/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [
    createLocalEsmCdnPlugin({
      repoRoot: path.resolve(__dirname, '../../../../..'),
      esmShBaseUrl: 'https://esm.sh',
      buildScope: 'none'
    })
  ],
  server: { port: 5174 },
  preview: { port: 5174 }
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "demo": "cd docs/demo && vite",
    "demo:build": "cd docs/demo && vite build",
    "demo:preview": "cd docs/demo && vite preview"
  },
  "devDependencies": {
    "@pie-element/element-player": "workspace:*",
    "@pie-element/local-esm-cdn": "workspace:*"
  }
}
```

## How It Works

### 1. Element Loading

When the page loads:

1. Browser loads `<pie-element-player>` custom element
2. Element player calls `loadElement('@pie-element/hotspot', 'hotspot-element', '', true)`
3. Element loader converts `@pie-element/hotspot` → `/@pie-element/hotspot`
4. Browser requests `/@pie-element/hotspot`
5. Vite plugin intercepts and serves from `packages/elements-react/hotspot/dist/index.js`
6. Plugin rewrites all imports in the served file:
   - `@pie-lib/math-rendering` → `/@pie-lib/math-rendering`
   - `react` → `https://esm.sh/react`
7. Element class is registered: `customElements.define('hotspot-element', HotspotElement)`
8. Element instance created: `<hotspot-element>` inserted in DOM
9. Props set: `element.model = {...}`, `element.session = {...}`

### 2. Controller Loading

When switching to evaluate mode:

1. Element player calls `loadController('@pie-element/hotspot', '', true)`
2. Controller loader converts to `/@pie-element/hotspot/controller`
3. Vite plugin serves from `packages/elements-react/hotspot/dist/controller/index.js`
4. Controller methods available: `model()`, `score()`, `outcome()`

### 3. Import Rewriting

The local-esm-cdn plugin rewrites imports in served files:

**Input** (in dist/index.js):
```javascript
import { renderMath } from "@pie-lib/math-rendering";
import React from "react";
import { jsx } from "react/jsx-runtime";
```

**Output** (served to browser):
```javascript
import { renderMath } from "/@pie-lib/math-rendering";
import React from "https://esm.sh/react";
import { jsx } from "https://esm.sh/react/jsx-runtime";
```

## Key Design Decisions

### Why Svelte 5?

- Modern reactive system with runes ($state, $effect, $bindable)
- Custom element support built-in
- Small bundle size (87 KB for entire player)
- Fast compilation

### Why Embedded CDN?

- Single server = simpler setup
- No CORS issues
- Faster reload during development
- No need to manage multiple processes

### Why Per-Element Demos?

- Elements own their demos (no central coordination)
- Easy to add new element demos (copy template)
- Can customize per element if needed
- Matches existing config.mjs/session.mjs pattern

### Why Custom Elements?

- Matches PIE ecosystem patterns (like ESM player)
- Elements are already built as web components
- Native browser API, no framework lock-in
- Clean encapsulation

## Implementation Status

### ✅ Completed (Phase 1-6)

- [x] Element player package structure
- [x] Core element-loader logic
- [x] UI components (ModeSelector, SessionPanel, etc.)
- [x] PieElementPlayer.svelte main component
- [x] Standalone element player testing
- [x] Local-esm-cdn TypeScript fixes
- [x] Local-esm-cdn import rewriting for PIE packages
- [x] Hotspot demo integration

### ⏳ Pending (Phase 7-8)

- [ ] Root demo script (`bun react-demo --element <name>`)
- [ ] Demo templates and documentation
- [ ] Script to auto-generate demos for all elements
- [ ] Integration with 2-3 more elements for testing

## Troubleshooting

### Module resolution errors

**Problem:** `Failed to resolve module specifier "@pie-lib/something"`

**Solution:** Ensure local-esm-cdn is built:
```bash
cd apps/local-esm-cdn
bun run build
```

### Element not loading

**Problem:** Element player shows loading forever

**Solution:** Check that element is built:
```bash
cd packages/elements-react/{element}
bun run build
```

### Vite plugin not intercepting requests

**Problem:** 404 errors for `/@pie-*` requests

**Solution:** Restart Vite dev server to pick up plugin changes:
```bash
# Stop the demo
# Ctrl+C or: lsof -ti :5174 | xargs kill

# Start again
bun run demo
```

## Future Enhancements

1. **Auto-generate demos** for all elements
2. **Demo gallery** - index page listing all element demos
3. **Embed mode** - hide controls for iframe embedding
4. **Comparison view** - side-by-side modes
5. **Model editor** - in-app config editor
6. **Snapshot/restore** - save and load demo states
7. **Dark mode** support
8. **Mobile responsive** improvements
