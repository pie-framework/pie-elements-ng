# Adding a Demo to a PIE Element

This guide shows you how to add the new demo system to an existing PIE React element.

## Prerequisites

- The element must be in `packages/elements-react/{element}/`
- The element must have `config.mjs` and `session.mjs` files (these usually already exist)
- The element must be built (`bun run build --filter @pie-element/{element}`)

## Quick Setup (5 minutes)

### Step 1: Create Demo Directory Structure

```bash
cd packages/elements-react/{element}
mkdir -p docs/demo/src
```

### Step 2: Create vite.config.ts

Create `docs/demo/vite.config.ts`:

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

### Step 3: Create index.html

Create `docs/demo/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PIE Demo - {Element Name}</title>
  <style>
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
    }
    h1 {
      margin: 0 0 1rem 0;
      font-size: 1.5rem;
      color: #333;
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
    <h1>🎯 {Element Name} Demo</h1>
    <pie-element-player
      element-name="{element}"
      cdn-url=""
      show-configure="false"
      debug="true"
    ></pie-element-player>
  </div>

  <script type="module" src="./src/main.ts"></script>
</body>
</html>
```

**Replace:**
- `{Element Name}` with the display name (e.g., "Hotspot", "Multiple Choice")
- `{element}` with the package name (e.g., "hotspot", "multiple-choice")

### Step 4: Create main.ts

Create `docs/demo/src/main.ts`:

```typescript
/**
 * {Element Name} Demo
 *
 * This demo uses the shared PIE element player to render the {element} element.
 */

// Import the element player web component
import '../../../../../shared/element-player/dist/pie-element-player.js';

// Import config and session data
import config from '../config.mjs';
import sessions from '../session.mjs';

// Wait for the custom element to be defined
customElements.whenDefined('pie-element-player').then(() => {
  console.log('✓ pie-element-player is ready');

  const player = document.querySelector('pie-element-player');

  if (player) {
    // Extract model and session from the imported data
    const model = Array.isArray(config?.models) ? config.models[0] : config;
    const session = Array.isArray(sessions) ? sessions[0] : sessions;

    console.log('Setting player properties:', { model, session });

    // Set initial properties
    (player as any).model = model;
    (player as any).session = session;

    // Listen for session changes
    player.addEventListener('session-changed', (e: Event) => {
      console.log('Session changed:', (e as CustomEvent).detail);
    });

    console.log('✓ {Element Name} demo initialized');
  } else {
    console.error('Could not find pie-element-player element');
  }
}).catch((error) => {
  console.error('Error initializing demo:', error);
});
```

**Replace:**
- `{Element Name}` with the display name
- `{element}` with the package name

### Step 5: Update package.json

Add demo scripts and dependencies to `package.json`:

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

### Step 6: Run It!

From the repo root:

```bash
bun react-demo --element {element}
```

This will:

1. Build the element-player
2. Build your element
3. Start the demo server
4. Open your browser

## What You Should See

When the demo loads, you should see:

- A heading with your element name
- The element player UI with:
  - Mode selector (Gather / View / Evaluate)
  - Your element rendered in the center
  - Session panel on the right showing current state
  - Reset button to clear session
- Browser console showing debug output

## Customization

### Add Configure Mode

If your element has a configure (authoring) UI, set `show-configure="true"`:

```html
<pie-element-player
  element-name="{element}"
  cdn-url=""
  show-configure="true"
  debug="true"
></pie-element-player>
```

This will add a "Configure" tab to switch between delivery and authoring modes.

### Customize Styling

Edit the `<style>` tag in `index.html` to customize the demo appearance.

### Use Different Config/Session

The demo uses the first model from `config.mjs` and first session from `session.mjs`.

To use a different one, modify `main.ts`:

```typescript
// Use a specific config
const model = config.models[1]; // Second model

// Use a specific session
const session = sessions[2]; // Third session
```

### Multiple Configs

To test multiple configurations, you can create multiple HTML files:

```
docs/demo/
├── index.html           # Config 1
├── config-2.html        # Config 2
├── config-3.html        # Config 3
└── src/
    └── main.ts
```

Each HTML file can import and use different configs.

## Troubleshooting

### "Failed to resolve module specifier"

**Problem:** Browser shows errors about unresolved `@pie-lib/` or `@pie-element/` imports.

**Solution:**

```bash
# Rebuild local-esm-cdn
cd apps/local-esm-cdn
bun run build

# Rebuild your element
cd ../../packages/elements-react/{element}
bun run build
```

### Element not rendering

**Problem:** Element player shows loading forever or displays an error.

**Solution:**

1. Check browser console for errors
2. Verify element is built: `ls packages/elements-react/{element}/dist/`
3. Verify element-player is built: `ls packages/shared/element-player/dist/`
4. Check that `element-name` in HTML matches your package name

### Demo won't start

**Problem:** `bun run demo` fails or hangs.

**Solution:**

1. Check that vite.config.ts exists and is valid
2. Check that dependencies are installed: `bun install`
3. Try killing any existing Vite process: `lsof -ti :5174 | xargs kill`

### Math not rendering / KaTeX errors

**Problem:** Math expressions appear as raw LaTeX or browser shows KaTeX-related errors.

**Solution:**

The element player automatically loads KaTeX CSS for math rendering, so demos don't need to include it manually. If math still isn't rendering:

1. Check that the element player is loaded correctly
2. Verify the element-player package is built: `ls packages/shared/element-player/dist/`
3. Check browser console for any KaTeX loading errors
4. Try clearing browser cache and restarting the demo

**How it works:** PIE elements use KaTeX for math rendering (replacing the original MathML approach). The element player automatically loads the KaTeX CSS from CDN when it initializes, following the pattern from the original PIE player where KaTeX was a dependency of the player rather than individual elements.

### Controller not working in evaluate mode

**Problem:** Switching to "Evaluate" mode doesn't show scoring.

**Solution:**

1. Verify your element has a controller: `ls packages/elements-react/{element}/dist/controller/`
2. Check browser console for controller loading errors
3. Ensure controller exports the required methods: `model()`, `score()`, `outcome()`

## Advanced: Copy from Hotspot

The hotspot element has a complete working demo. You can copy its structure:

```bash
# From your element directory
cp -r ../hotspot/docs/demo ./docs/

# Edit the files to replace "hotspot" with your element name
```

Then update:

- `index.html` - Change element name and title
- `src/main.ts` - Change comments and log messages
- Verify paths in `vite.config.ts` are correct

## Next Steps

After adding your demo:

1. Test all three modes (gather, view, evaluate)
2. Test with different configs if your element has multiple
3. Test the reset button
4. Check that session updates correctly
5. If you have configure mode, test that too

## Getting Help

- See [DEMO_SYSTEM.md](./DEMO_SYSTEM.md) for architecture details
- Check the hotspot demo as a reference: `packages/elements-react/hotspot/docs/demo/`
- Report issues at: https://github.com/anthropics/pie-element/issues
