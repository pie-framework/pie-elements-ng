# PIE Element Demo System

## Overview

The demo system uses a single shared app and picks the element to load at runtime.

- **`dev:demo`**: runs `apps/element-demo` and loads an element via `VITE_*` env vars.

## Quick Start

```bash
# Default demo (shared app)
bun run dev:demo categorize

```

## How It Works

`apps/element-demo` reads:

- `VITE_ELEMENT_NAME`
- `VITE_ELEMENT_PATH`
- `VITE_ELEMENT_TYPE`

The CLI commands set these env vars and start a single Vite dev server.
The app loads the element from the workspace using the resolver plugin.

## Per-Element Demo Data

Each element supplies demo data under:

```text
packages/elements-{react|svelte}/{element}/docs/demo/
├── config.mjs
└── session.mjs
```

The shared app reads those files to populate the model and session.

## Known Issues & Solutions

### Infinite Loop / HMR Reconnection Issue

**Problem:** The demo app was experiencing an infinite loop with continuous Vite HMR reconnections (`[vite] connecting/connected` repeating endlessly), causing thousands of network requests.

**Root Cause:** The combination of these Vite config settings created the loop:

```js
// ❌ PROBLEMATIC CONFIGURATION
resolve: {
  conditions: ['development', 'import', 'default'],
},
optimizeDeps: {
  exclude: ['@pie-element/*', '@pie-lib/*'],
}
```

This configuration:

1. Resolved workspace packages to their **source files** (via 'development' condition)
2. Did not pre-bundle them (via exclude)
3. Made Vite watch all source files for changes
4. Any HMR update triggered the player layout's load function, creating new objects
5. This caused another HMR cycle, creating an infinite loop

**Solution:** Remove both problematic settings from `vite.config.ts`:

```js
// ✅ WORKING CONFIGURATION
export default defineConfig({
  plugins: [tailwindcss({ optimize: false }), sveltekit()],

  // Don't use 'development' condition - causes infinite HMR loops
  // resolve: { conditions: ['development', ...] },

  server: {
    port: Number(process.env.PORT ?? 5222),
    fs: { allow: [workspaceRoot] },
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    // Don't exclude workspace packages - use built versions instead
    // exclude: ['@pie-element/*', '@pie-lib/*'],
  },
});
```

**Additional Fixes Applied:**

1. **Disabled preload on hover** in `app.html`:

   ```html
   <body data-sveltekit-preload-data="off">
   ```

2. **Cached math renderer** in `player/+layout.ts` to prevent creating new objects:

   ```ts
   let cachedMathRenderer: any = null;
   if (!cachedMathRenderer) {
     cachedMathRenderer = createKatexRenderer();
   }
   ```

3. **Used `onMount` instead of `$effect`** in `player/+layout.svelte` for one-time initialization:

   ```ts
   onMount(() => {
     if (data) {
       initializeDemo({...});
     }
   });
   ```

4. **Converted reactive statements to `$derived`** for Svelte 5 runes mode:

   ```ts
   // Old: $: activeTab = ...
   // New:
   const activeTab = $derived($page.url.pathname.split("/")[2] || "deliver");
   ```

**Trade-off:** Without the 'development' condition, Vite uses the **built/dist** versions of workspace packages instead of watching source files directly. This means:

- ✅ Demo app loads successfully without infinite loops
- ✅ Element packages (`@pie-element/multiple-choice`, etc.) load from their `dist/` folders
- ⚠️ Changes to element source code require rebuilding the package before they appear in the demo
- ⚠️ No HMR for workspace package changes during development

**Workflow:** When developing an element, you need to:

1. Make changes to element source code
2. Run `bun run build` in the element package
3. Refresh the demo to see changes

**Alternative (Advanced):** To enable HMR for development on specific packages:

The `upstream:sync` command already adds 'development' export conditions to synced element packages via `addDevelopmentExports()`. To use this:

1. **Sync a specific element:**

   ```bash
   bun run upstream:sync:element multiple-choice
   ```

   This adds 'development' exports pointing to `src/` files in that element's package.json.

2. **Enable the development condition in Vite config:**

   ```js
   // vite.config.ts
   resolve: {
     conditions: ['development', 'import', 'default'],
   },
   optimizeDeps: {
     include: ['react', 'react-dom', 'react/jsx-runtime'],
     // IMPORTANT: Only exclude the specific package you're developing
     exclude: ['@pie-element/multiple-choice'],  // Not all packages!
   },
   ```

3. **⚠️ Warning:** This approach can still trigger infinite loops if:
   - You exclude too many packages (use `exclude` sparingly)
   - Your element has many source files that change frequently
   - The element imports other workspace packages that also use 'development' exports

**Recommendation:** For most development, use the stable configuration (no 'development' condition) and rebuild packages as needed. Only use HMR for rapid iteration when absolutely necessary.
