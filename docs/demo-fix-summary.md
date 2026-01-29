# Demo System Fix Summary (2026-01-29)

## Problem
The demo system was completely broken:
- Infinite effect loop (`effect_update_depth_exceeded`)
- No tabs visible
- Player not rendering
- Element-player custom element not registered

## Root Causes

1. **PieElementPlayer had wrong imports** - Using deleted `@pie-element/math-typesetting` package
2. **Incompatibility between apps/element-demo and PieElementPlayer** - Demo expected capabilities prop, player didn't have it
3. **Infinite effect loops in +page.svelte** - Circular state dependencies
4. **Missing element-player import** - Custom element never registered
5. **State management bugs** - Tracking refs not using `$state()`

## Changes Made

### 1. PieElementPlayer Fixes ([packages/shared/element-player/src/PieElementPlayer.svelte](../packages/shared/element-player/src/PieElementPlayer.svelte))

**Math rendering imports:**
```typescript
// OLD (broken):
import { createKatexRenderer } from '@pie-element/math-typesetting';
import type { MathRenderer } from '@pie-element/math-typesetting';

// NEW (fixed):
import { createKatexRenderer } from '@pie-element/math-rendering-katex';
import type { MathRenderer } from '@pie-element/math-rendering';
```

**Capabilities system added:**
```typescript
// Custom element props
customElement: {
  props: {
    // ... existing props
    capabilities: { reflect: false, type: 'Array' },
    preloadedController: { reflect: false, type: 'Object' }
  }
}

// Props signature
let {
  // ... existing props
  capabilities = undefined,
  preloadedController = undefined,
}: {
  // ... existing types
  capabilities?: string[];
  preloadedController?: PieController;
} = $props();

// Usage in onMount
if (capabilities) {
  // Use metadata to avoid unnecessary loading attempts
  hasConfigure = capabilities.includes('author');
  hasPrint = capabilities.includes('print');
}
```

**State management fixes:**
```typescript
// OLD (broken):
let lastSessionRef = session;
let lastElementModelRef = elementModel;
let lastElementSessionRef = session;

// NEW (fixed):
let lastSessionRef = $state<any>(null);
let lastElementModelRef = $state<any>(null);
let lastElementSessionRef = $state<any>(null);

// Initialize in onMount
onMount(async () => {
  lastSessionRef = session;
  lastElementSessionRef = session;
  lastElementModelRef = elementModel;
  // ...
});
```

**Session normalization effect fixed:**
```typescript
// OLD (infinite loop):
$effect(() => {
  if (session && session !== lastSessionRef) {
    lastSessionRef = session;
    const normalized = normalizeSession(session);
    if (normalized !== session) {
      session = normalized; // Triggers effect again!
    }
    sessionVersion += 1;
  }
});

// NEW (no loop):
$effect(() => {
  if (!session) return;
  if (session === lastSessionRef) return; // Early exit

  const normalized = normalizeSession(session);
  lastSessionRef = normalized;

  if (normalized !== session) {
    session = normalized;
    return; // Exit early after normalization
  }

  sessionVersion += 1;
});
```

### 2. Demo App Fixes ([apps/element-demo/src/routes/+page.svelte](../apps/element-demo/src/routes/+page.svelte))

**Removed duplicate $props() and fixed state:**
```typescript
// OLD (broken):
const props = $props<{ data: DemoData }>();
let data = $state(props.data);
let model = $state<unknown>();
let session = $state<unknown>();

$effect(() => {
  data = props.data; // Circular dependency!
  model = data.model;
  session = data.session;
});

// NEW (fixed):
let { data } = $props<{ data: DemoData }>();
let pageTitle = $derived(`${data.elementTitle} Demo`);
let model = $state<unknown>();
let session = $state<unknown>();

$effect(() => {
  model = data.model;
  session = data.session;
});
```

**Removed redundant player update effect:**
```typescript
// REMOVED (redundant):
$effect(() => {
  if (playerElement) {
    playerElement.model = model;
    playerElement.session = session;
  }
});
// Attributes are sufficient
```

**Added model/session attributes:**
```svelte
<pie-element-player
  element-name={data.elementName}
  model={model}
  session={session}
  mode={mode}
  player-role={role}
  capabilities={data.capabilities}
/>
```

### 3. Layout Fix ([apps/element-demo/src/routes/+layout.svelte](../apps/element-demo/src/routes/+layout.svelte))

**Added element-player import:**
```typescript
import '../app.css';
// Import element-player to register the custom element
import '@pie-element/element-player';
```

### 4. Supporting Files

**Element loader improvements** ([packages/shared/element-player/src/lib/element-loader.ts](../packages/shared/element-player/src/lib/element-loader.ts)):
- Conditional `@vite-ignore` only for CDN imports
- Better local alias support

**EsmElementPlayer cleanup** ([packages/shared/element-player/src/players/EsmElementPlayer.svelte](../packages/shared/element-player/src/players/EsmElementPlayer.svelte)):
- Removed excessive debug logging
- Simplified session comparison logic

**Element-player index** ([packages/shared/element-player/src/index.ts](../packages/shared/element-player/src/index.ts)):
- Added Tailwind CSS import

## Results

✅ **All 4 tabs working**: Delivery, Author, Print, Source
✅ **No infinite effect loops**: Fixed circular state dependencies
✅ **Player rendering**: Element-player custom element registered
✅ **Element loading**: Multiple-choice element renders correctly
✅ **Capabilities system**: Avoids unnecessary component loading
✅ **Clean console**: Minimal errors (just expected 404s from tryImport)

### Expected 404s

The following 404s are **normal and expected**:
```
[404] GET .../src/print/index.ts
```

The `tryImport` function in `+page.ts` tries multiple extensions (`.ts`, `.tsx`, `.js`, etc.) until one succeeds. These 404s are harmless - the `.tsx` file loads successfully on the second attempt.

## Testing

Tested with: `bun run dev:demo multiple-choice --port 5174`

**Browser verification:**
- ✅ Multiple-choice element renders with checkboxes
- ✅ Mode selector works (Gather/View/Evaluate)
- ✅ Role selector works (Student/Instructor)
- ✅ Session state displays correctly
- ✅ Model inspector shows full config
- ✅ All tabs clickable and functional

## Future Improvements

See [docs/element-player-lost-features.md](element-player-lost-features.md) for features that can be re-added:
1. **Lazy math renderer loading** - Reduce bundle size
2. **Theming system** - DaisyUI/MUI integration
3. **Better tryImport** - Reduce 404 noise by checking package.json exports first

## Files Changed

Core fixes:
- `packages/shared/element-player/src/PieElementPlayer.svelte`
- `packages/shared/element-player/src/lib/element-loader.ts`
- `packages/shared/element-player/src/players/EsmElementPlayer.svelte`
- `packages/shared/element-player/src/index.ts`
- `apps/element-demo/src/routes/+page.svelte`
- `apps/element-demo/src/routes/+layout.svelte`

New documentation:
- `docs/demo-fix-summary.md` (this file)
- `docs/element-player-lost-features.md`
