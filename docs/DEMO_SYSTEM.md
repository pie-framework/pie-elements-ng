# PIE Element Demo System

## Overview

`apps/element-demo` is one SvelteKit app that demos every element in the workspace. The URL picks the element and view.

## Quick Start

```bash
bun run dev:demo            # CLI wrapper: port 5222, flags --port, --build, --open
bun run dev:element-demo    # plain `vite dev` in apps/element-demo, port from PORT or 5222
```

Open <http://localhost:5222> and choose an element, or go straight to `/<element>/deliver`, `/<element>/author`, `/<element>/print`, `/<element>/docs` or `/<element>/source`. `?player=iife` switches a view from the ESM player to the IIFE player; the bundler modes are in [DEV_BUNDLER.md](../apps/element-demo/DEV_BUNDLER.md).

## How It Works

- `scripts/generate-element-imports.ts` runs before every dev start and build. It writes `src/lib/element-imports.js`, which registers each element's delivery, author, controller and print modules by package specifier.
- `src/lib/elements/registry.ts` lists the elements and which views each one has.
- `src/vite-plugin-workspace-resolver.ts` aliases each workspace package's `exports` to the matching `src/` file, so the ESM views pick up element source edits without a package build.

## Per-Element Demo Data

The app reads each element's demos from `apps/element-demo/src/lib/samples/<element>.json`, which is edited directly. `bun tools/generate-demo-metadata.mjs` rewrites `registry.ts` from `packages/elements-react` and `packages/elements-svelte`, keeping each entry's hand-set `title` and `hasSession`, and seeds a missing samples file from the element's `docs/demo/config.mjs`. [demo-configuration-guide.md](demo-configuration-guide.md) covers the demo format.

## Known Issues & Solutions

### Infinite HMR Reconnection Loop

**Symptom:** `[vite] connecting/connected` repeats endlessly and the page issues thousands of requests.

**Cause:** `resolve.conditions: ['development', ...]` in `vite.config.ts`. Vite resolved workspace packages through their `development` conditions and watched those files, and each HMR update re-ran the element layout's load function, which created new objects and triggered the next update.

**Rule:** never add a `development` resolve condition to the demo. Source loading goes through `vite-plugin-workspace-resolver.ts` aliases. Package manifests stay dist-only, so no package adds `development` export conditions that point at `src/` ([PUBLISHING.md](PUBLISHING.md)).

The app also keeps `data-sveltekit-preload-data="off"` in `app.html`, and `routes/[element]/+layout.svelte` initializes the demo once in `onMount` rather than in an `$effect`.

---

### Drag-and-Drop Lockups

**Symptom:** Browser lockup after dragging items in interactive elements.

**Cause:** The host sets the session back on the element when it hears `session-changed`. Setting `session` dispatches `session-changed` again, so each change triggers itself; a bidirectional `$bindable` on session does this on every update.

**Solution:** Set `session` when the item loads and read each change off that object, which the element writes into ([Delivery Contract](PIE_ELEMENT_CONTRACT.md#delivery-contract)):

```svelte
<!-- ❌ Wrong: hands the element a new session on every change -->
<simple-cloze {model} session={current} onsession-changed={() => (current = { ...current })}></simple-cloze>

<!-- ✅ Correct: the element writes into `session`; the host only reads it -->
<simple-cloze {model} {session} onsession-changed={(e) => save(session, e.detail.complete)}></simple-cloze>
```

**Key Rule:** The player owns the session object and the element writes into it. Never set the session back in response to its event.

---
