# PieElementPlayer Lost Features (2026-01-29)

> **Context**: These features were added by another AI agent on 2026-01-29 but caused infinite effect loops and module loading issues. The file was reverted to commit `5ebbba6` (working state). This document captures the features so they can be re-implemented properly.

## Working Baseline

**Commit**: `5ebbba6` - "feat(element-player): add Print tab to demo system"
**Date**: January 27, 2026
**File Size**: 925 lines
**Effects Count**: 11
**Status**: ✅ All tabs working (Delivery, Author, Print, Source)

## Lost Features Overview

The modified version (1051 lines, 14 effects) added several valuable features but introduced critical bugs. Features are listed in priority order for re-implementation.

---

## Feature 1: Capabilities System ⭐ HIGH PRIORITY

### What It Did

Instead of trying to load optional components (author, print) and catching errors, elements can now declare their capabilities upfront.

### Implementation Details

**New Prop**:
```typescript
capabilities?: string[];
```

**Custom Element Attribute**:
```typescript
customElement: {
  props: {
    // ... existing props
    capabilities: { reflect: false, type: 'Array' }
  }
}
```

**Usage in Props**:
```typescript
let {
  // ... existing props
  capabilities = undefined,
}: {
  // ... existing types
  capabilities?: string[];
} = $props();
```

**Detection Logic** (replaced runtime loading):
```typescript
// In onMount, before trying to load components
if (capabilities) {
  // Use metadata to avoid unnecessary loading attempts
  hasConfigure = capabilities.includes('author');
  hasPrint = capabilities.includes('print');
  if (debug) {
    console.log(`[pie-element-player] Using capabilities metadata:`, {
      hasConfigure,
      hasPrint,
    });
  }
} else {
  // Fall back to runtime detection (existing logic)
  // Try to load components and see if they exist
}
```

**Derived Tag Names** (added):
```typescript
const authorTag = $derived(`${elementName}-element-author`);
const printTag = $derived(`${elementName}-element-print`);
```

### Benefits

- ✅ Avoids 404 errors from trying to load non-existent components
- ✅ Faster initialization (no failed network requests)
- ✅ Cleaner console output
- ✅ Elements can declare capabilities in their package.json metadata

### How to Re-implement Safely

1. Add `capabilities` prop to component signature
2. Add custom element attribute declaration
3. Add conditional check: if capabilities exist, use them; otherwise fall back to runtime detection
4. Test with elements that have/don't have author and print components

---

## Feature 2: Lazy Math Renderer Loading ⭐ MEDIUM PRIORITY

### What It Did

Changed math renderer from a required prop (with default) to a lazy-loaded optional dependency. This reduces bundle size when math rendering isn't needed or when using a specific renderer.

### Implementation Details

**Changed Prop Type**:
```typescript
// OLD (working version):
mathRenderer = $bindable<MathRenderer>(createKatexRenderer())

// NEW (lost version):
mathRenderer: mathRendererType = 'katex'
```

**Custom Element Attribute**:
```typescript
customElement: {
  props: {
    // ... existing props
    mathRenderer: { attribute: 'math-renderer', type: 'String' }
  }
}
```

**Props Signature Change**:
```typescript
let {
  // ... existing props
  mathRenderer: mathRendererType = 'katex',  // Now a string, not object
}: {
  // ... existing types
  mathRenderer?: 'katex' | 'mathjax' | 'none';
} = $props();

// Create separate state for the actual renderer
let mathRenderer = $state<MathRenderer | null>(null);
```

**Lazy Loading Effect**:
```typescript
// Lazy-load math renderer when type changes
$effect(() => {
  const loadRenderer = async () => {
    switch (mathRendererType) {
      case 'katex': {
        const { createKatexRenderer } = await import('@pie-element/math-rendering-katex');
        mathRenderer = createKatexRenderer();
        break;
      }
      case 'mathjax': {
        const { createMathjaxRenderer } = await import('@pie-element/math-rendering-mathjax');
        mathRenderer = createMathjaxRenderer();
        break;
      }
      case 'none':
        mathRenderer = null;
        break;
      default: {
        // Default to KaTeX for smaller bundles
        const { createKatexRenderer } = await import('@pie-element/math-rendering-katex');
        mathRenderer = createKatexRenderer();
      }
    }
  };

  loadRenderer();
});
```

**Import Changes**:
```typescript
// OLD:
import { createKatexRenderer } from '@pie-element/math-typesetting';
import type { MathRenderer } from '@pie-element/math-typesetting';

// NEW:
import type { MathRenderer } from '@pie-element/math-rendering';
// No direct renderer imports - loaded dynamically
```

### Benefits

- ✅ Smaller initial bundle (math renderers loaded on demand)
- ✅ Support for multiple math renderers without importing all
- ✅ Can disable math rendering entirely with 'none'
- ✅ More flexible for different deployment scenarios

### Issues to Fix

The effect might need better guards to prevent re-loading on every render.

### How to Re-implement Safely

1. Add `mathRenderer: mathRendererType = 'katex'` prop
2. Create separate `let mathRenderer = $state<MathRenderer | null>(null)`
3. Add effect with proper dependency tracking
4. Add null checks wherever `mathRenderer` is used
5. Test with all three modes: 'katex', 'mathjax', 'none'

---

## Feature 3: Theming System Integration ⭐ LOW PRIORITY

### What It Did

Integrated DaisyUI theme system with PIE elements, allowing dynamic theme switching and CSS variable generation.

### Implementation Details

**New Imports**:
```typescript
import type { PieTheme } from '@pie-element/shared-types';
import type { PieThemeExtended } from '@pie-element/theming';
import {
  extractDaisyUiTheme,
  watchDaisyUiTheme,
  daisyUiToPieTheme,
} from '@pie-element/theming-daisyui';
import { generateCssVariables, cssVariablesToStyleString } from '@pie-element/theming';
```

**New State**:
```typescript
let currentTheme = $state<PieThemeExtended | undefined>(undefined);
let cssVars = $derived(
  currentTheme ? cssVariablesToStyleString(generateCssVariables(currentTheme)) : ''
);
```

**Usage** (presumably):
```svelte
<div style={cssVars}>
  <!-- Element content with theme variables -->
</div>
```

### Benefits

- ✅ Dynamic theming support
- ✅ Integration with DaisyUI themes
- ✅ CSS variables for consistent styling

### Concerns

- ⚠️ Most complex feature
- ⚠️ Requires theming packages to be fully implemented
- ⚠️ May need theme context/provider pattern
- ⚠️ Unclear where theme comes from (prop? context? DOM?)

### How to Re-implement Safely

1. Wait until theming packages are stable
2. Design theme API carefully (prop vs context vs attribute)
3. Test theme switching without breaking existing elements
4. Consider making it opt-in rather than always-on

---

## Feature 4: Session Handling Improvements

### What Changed

Several changes were made to prevent circular updates between parent session prop and element session state.

**Added Flag**:
```typescript
let isUpdatingFromElement = false;
```

**Changed State Declarations**:
```typescript
// OLD:
let lastSessionRef = session;
let lastElementModelRef = elementModel;
let lastElementSessionRef = session;

// NEW:
let lastSessionRef = $state(session);
let lastElementModelRef = $state(elementModel);
let lastElementSessionRef = $state<any | null>(null);  // Changed initial value
```

**Session Normalization Change**:
```typescript
// OLD:
const normalizeSession = (nextSession: any) => {
  const normalized = nextSession && typeof nextSession === 'object' ? nextSession : {};
  if ((normalized as any).value === undefined) {
    (normalized as any).value = [];
  }
  return normalized;
};

// NEW:
const normalizeSession = (nextSession: any) => {
  const normalized = nextSession && typeof nextSession === 'object' ? nextSession : {};
  if ((normalized as any).value === undefined) {
    return { ...(normalized as any), value: [] };  // Return new object
  }
  return normalized;
};
```

**Session Update Effect Changes**:
```typescript
// Added normalization in effect
$effect(() => {
  if (!session) return;
  const normalized = normalizeSession(session);
  if (normalized !== session) {
    session = normalized;
    return;  // Early return after normalization
  }
  if (session !== lastSessionRef) {
    lastSessionRef = session;
    sessionVersion += 1;
    logConsole('session:prop', normalized);
  }
});

// Added isUpdatingFromElement guard
$effect(() => {
  // ... other checks

  if (session && session !== lastElementSessionRef && !isUpdatingFromElement) {
    lastElementSessionRef = session;
    try {
      (elementPlayer as any).session = session;
      logConsole('element:session:set', { value: session?.value });
    } catch (err) {
      console.error('[pie-element-player] Error setting element session:', err);
    }
  }
});
```

### Issues

- ⚠️ These changes likely contributed to the "effect_update_depth_exceeded" error
- ⚠️ Multiple effects reading and writing the same state
- ⚠️ Unclear if `isUpdatingFromElement` was being set anywhere

### How to Re-implement Safely

1. First understand the exact circular update scenario that's being prevented
2. Consider using Svelte 5's `untrack()` instead of manual flags
3. Reduce number of effects - combine related logic
4. Add clear comments explaining the update flow

---

## Feature 5: Removed/Changed Features

### ModelPanel Component Removed

```typescript
// OLD:
import ModelPanel from './components/ModelPanel.svelte';

// NEW:
// Import removed (not used?)
```

Unclear if this was intentional or if ModelPanel functionality was moved elsewhere.

---

## Critical Bugs Introduced

### 1. Infinite Effect Loop

**Error**: `Svelte error: effect_update_depth_exceeded`

**Cause**: Multiple effects reading and writing the same reactive state, creating circular dependencies.

**Effects Involved**:
- Math renderer loading effect
- Session normalization effects (multiple)
- Theme watching effects (if implemented)

**Fix Needed**:
- Use `untrack()` for reads that shouldn't trigger re-runs
- Consolidate related effects
- Ensure effects have clear dependencies

### 2. Module Loading 404 Errors

**Error**: Multiple 404s trying different file extensions

```
[404] GET /@fs/.../multiple-choice/src/author/index.tsx
[404] GET /@fs/.../multiple-choice/src/author/index.js
[404] GET /@fs/.../multiple-choice/src/author/index.jsx
[404] GET /@fs/.../multiple-choice/src/author/index.svelte
[404] GET /@fs/.../multiple-choice/src/print/index.ts (repeated)
```

**Cause**: Vite trying to resolve failed imports with different extensions

**Root Issue**: The capabilities system wasn't working properly, so the code still tried to load non-existent components

**Fix Needed**:
- Ensure capabilities system properly prevents load attempts
- Make sure optional loading (`optional: true`) truly suppresses errors

### 3. Other Warnings

**Emotion Warning**:
```
Using kebab-case for css properties in objects is not supported.
Did you mean WebkitFontSmoothing?
```

This is likely from the theming CSS variable generation.

---

## Re-implementation Strategy

### Phase 1: Capabilities System (Week 1)
1. Add capabilities prop and custom element attribute
2. Implement fallback to runtime detection
3. Test with multiple-choice (has author), hotspot (no author)
4. Verify no 404 errors

### Phase 2: Lazy Math Renderer (Week 2)
1. Change mathRenderer prop to string type
2. Add lazy loading effect with guards
3. Test with KaTeX, MathJax, and none
4. Verify no infinite loops
5. Measure bundle size savings

### Phase 3: Session Handling (Week 3)
1. Audit current session update flow
2. Identify specific circular update scenario
3. Add minimal fixes (prefer `untrack()` over flags)
4. Test with rapid session changes
5. Verify no effect loops

### Phase 4: Theming System (Week 4+)
1. Wait for theming packages to stabilize
2. Design theme API (prop? context? CSS?)
3. Implement theme watching
4. Test theme switching
5. Document theme usage for element developers

---

## Testing Checklist

Before merging any re-implemented feature:

- [ ] No infinite effect loops (`effect_update_depth_exceeded`)
- [ ] No 404 errors in console
- [ ] All 4 tabs work (Delivery, Author, Print, Source)
- [ ] HMR works correctly
- [ ] Demo server starts without errors
- [ ] Elements render correctly in gather/view/evaluate modes
- [ ] Session changes propagate correctly
- [ ] Model changes propagate correctly
- [ ] Role switching works (student/instructor)
- [ ] Test with elements that have/don't have author/print

---

## Files to Review

When re-implementing, reference these commits:

- **Working baseline**: `5ebbba6` (Jan 27, 2026)
- **Last known good**: `ecd4b68` (Jan 28, 2026) - same as 5ebbba6 plus printTag fix
- **Lost changes**: Were uncommitted modifications from Jan 29, 2026

---

## Notes

The lost version was approximately:
- **1051 lines** (vs 925 working)
- **14 $effects** (vs 11 working)
- **+249 lines, -123 lines** (net +126 lines)

Key lesson: These features are valuable but need incremental implementation with testing at each step. Don't add multiple complex features simultaneously.
