# MathQuill Integration for PIE Elements (Legacy Path)

**Package:** `@pie-element/shared-mathquill`
**Version:** compatibility wrapper around `mathquill@0.10.1`
**Status:** Transitional legacy path (being phased out)

## What This Is

A PIE-specific wrapper around MathQuill (Desmos fork) that provides a compatibility interface with PIE extensions pre-loaded.

The modern path is now `@pie-element/shared-math-engine` (see `docs/MATH_ENGINE.md`), which is ESM-native and does not rely on the MathQuill runtime.

## Legacy Scope

- Uses MathQuill UMD runtime and compatibility patches.
- Depends on `jquery` at runtime for UMD initialization.
- Keeps legacy behavior stable while modern consumers move to `@pie-element/shared-math-engine`.

## Legacy Usage

```typescript
import MathQuill from '@pie-element/shared-mathquill';
import '@pie-element/shared-mathquill/mathquill.css';

const field = MathQuill.MathField(element, { handlers: { edit: () => {} } });
```

### Modern Path

```typescript
// Prefer the modern runtime for new work:
import { createField } from '@pie-element/shared-math-engine';
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

## Migration Direction

- New implementation work should target `@pie-element/shared-math-engine`.
- `@pie-element/shared-mathquill` should only be used where migration is still pending.
- Once authoring and any remaining legacy flows are migrated, this package can be removed.
