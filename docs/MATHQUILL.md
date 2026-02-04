# MathQuill Integration for PIE Elements

**Package:** `@pie-element/shared-mathquill`
**Version:** jQuery-free v3 wrapper
**Status:** ✅ Complete

## What This Is

A PIE-specific wrapper around MathQuill (Desmos fork) that provides a jQuery-free interface with all PIE extensions pre-loaded.

## Key Features

- ✅ **No jQuery dependency** - Uses MathQuill v3 interface (saves 198KB)
- ✅ **Bundle: 346KB** (down from 544KB with jQuery)
- ✅ **All extensions pre-loaded:**
  - Matrices with keyboard shortcuts (Shift-Enter, Shift-Space)
  - Khan Academy mobile keyboard fixes
  - Khan Academy i18n ARIA support
  - Learnosity recurring decimals (`\dot`)
  - Learnosity not-symbols (`\nless`, `\ngtr`)
  - PIE LRN exponents (`\lrnexponent`, `\lrnsquaredexponent`)

## Usage

```typescript
import MathQuill from '@pie-element/shared-mathquill';
import '@pie-element/shared-mathquill/mathquill.css';

// MathQuill is ready to use - no getInterface() call needed
const field = MathQuill.MathField(element, {
  handlers: {
    edit: () => console.log('edited!')
  }
});
```

### Migration from Old Pattern

```typescript
// ❌ OLD (requires jQuery)
import MathQuill from '@pie-element/shared-mathquill';
const MQ = MathQuill.getInterface(2);

// ✅ NEW (no jQuery)
import MathQuill from '@pie-element/shared-mathquill';
const MQ = MathQuill;  // Direct use
```

## Implementation

The wrapper is implemented in [packages/shared/mathquill/src/extensions/index.ts](../packages/shared/mathquill/src/extensions/index.ts):

1. Imports the Desmos MathQuill UMD bundle (sets up `window.MathQuill`)
2. Gets the v3 interface: `MathQuill.getInterface(3)` (jQuery-free)
3. Applies all PIE extensions in order
4. Exports the initialized instance directly

## Files Updated

**Package:**
- `packages/shared/mathquill/src/extensions/index.ts` - Main wrapper
- `packages/shared/mathquill/package.json` - Removed jQuery dependency

**Consumers (5 files):**
- `packages/lib-react/math-input/src/mq/input.tsx`
- `packages/lib-react/math-input/src/mq/static.tsx`
- `packages/elements-react/math-inline/src/author/general-config-block.tsx`
- `packages/elements-react/math-inline/src/delivery/main.tsx`
- `packages/elements-react/math-templated/src/delivery/main.tsx`

Changed from `MathQuill.getInterface(2)` to direct wrapper use.

## Testing

```bash
cd packages/shared/mathquill
bun test
```

**Results:** 53/53 tests passing
- 40 matrix tests
- 13 extension tests

**Browser testing:** All element demo tabs working (Delivery, Author, Source, Print)

## Why v3 Instead of v2?

MathQuill provides two interfaces:
- **v2**: Requires jQuery, uses `MQ.MathField($(element), config)`
- **v3**: No jQuery, uses `MQ.MathField(element, config)` (vanilla JS)

The v3 interface provides identical functionality without the jQuery dependency.

## Demo App Fixes

During integration, simplified the demo app's reactivity patterns (see [SVELTE_REACTIVITY_PATTERNS.md](SVELTE_REACTIVITY_PATTERNS.md)):

1. Changed layout from `$effect()` to simple `onMount()`
2. Pass props directly from route data instead of reactive stores
3. Use plain variables for loop guards to avoid infinite loops

**Key lesson:** Keep reactivity simple for web components that do DOM mutations.

## Benefits

- **198KB smaller bundle** (36% reduction)
- **No jQuery dependency** across all PIE elements
- **Consistent API** - Single wrapper for all elements
- **Pre-configured** - All extensions loaded automatically
- **Maintainable** - One place to update MathQuill for entire project
