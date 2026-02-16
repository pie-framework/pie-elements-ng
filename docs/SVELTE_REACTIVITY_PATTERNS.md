# Svelte Reactivity Patterns for PIE Elements

**Date:** 2026-02-03

## Core Principle

**Keep reactivity simple and straightforward.** Web components don't play well with complex reactive patterns, and components that do DOM mutations need simple, predictable state management.

## Patterns to Avoid

### ❌ Don't: Complex `$effect()` with `untrack()`

```typescript
// BAD - Fighting against reactivity
$effect(() => {
  untrack(() => {
    // Wrapped in untrack means updates don't propagate properly
    initializeStores(data);
  });
});
```

**Problems:**
- Store updates don't propagate to child components
- Creates timing issues and race conditions
- Hard to debug and reason about

### ❌ Don't: Reactive stores for props that come from route data

```typescript
// BAD - Unnecessary indirection through stores
<PlayerLayout
  elementName={$elementName}
  capabilities={$capabilities}
/>
```

**Problems:**
- Adds unnecessary complexity
- Creates timing issues (store may not be initialized when component mounts)
- Makes data flow harder to trace

### ❌ Don't: Using `$state` for loop guards in effects

```typescript
// BAD - Modifying $state inside effects causes infinite loops
let lastRef = $state(null);

$effect(() => {
  if (something !== lastRef) {
    lastRef = something;  // ← Triggers the effect again!
    doSomething();
  }
});
```

**Problems:**
- Infinite loops
- Unpredictable behavior
- Browser crashes

## Patterns to Use

### ✅ Do: Simple `onMount()` for initialization

```typescript
// GOOD - Simple and predictable
onMount(() => {
  initializeStores({
    elementName: data.elementName,
    model: data.initialModel,
    session: data.initialSession,
  });
});
```

**Benefits:**
- Runs once, predictably
- No reactivity complexity
- Easy to understand

### ✅ Do: Pass props directly from route data

```typescript
// GOOD - Direct prop passing
<PlayerLayout
  elementName={data.elementName}
  capabilities={data.capabilities}
/>
```

**Benefits:**
- Clear data flow
- No timing issues
- Data available immediately when component mounts

### ✅ Do: Use plain variables for loop guards

```typescript
// GOOD - Plain variables don't trigger reactivity
let lastRef: any = null;
let updatingFromElement = false;

$effect(() => {
  if (updatingFromElement) return;

  if (session !== lastRef) {
    lastRef = session;  // ← Doesn't trigger effect
    doSomething();
  }
});

function handler() {
  updatingFromElement = true;
  // ... do work ...
  setTimeout(() => {
    updatingFromElement = false;
  }, 100);
}
```

**Benefits:**
- No infinite loops
- Predictable behavior
- Clear intent

### ✅ Do: Minimize reactive state

```typescript
// GOOD - Only use $state for UI state that needs to re-render
let loading = $state(true);
let error = $state<string | null>(null);

// GOOD - Use plain variables for internal tracking
let initialized = false;
let lastValue: any = null;
```

**Benefits:**
- Less reactivity = fewer bugs
- Clearer separation of concerns
- Better performance

## Web Components Considerations

Web components do their own DOM manipulation and don't integrate well with reactive frameworks:

1. **Prefer page refreshes for mode/role changes** - Instead of complex reactive updates, use full page navigation
2. **Pass data once at mount** - Don't try to reactively update web component props
3. **Use events, not reactivity** - Web components communicate via events, not reactive bindings
4. **Keep it simple** - The simpler your state management, the fewer issues with web components

## When to Use Reactivity

Use reactivity sparingly and only for:
- UI state that needs immediate re-rendering (loading spinners, error messages)
- Form inputs bound to local component state
- Computed values derived from props

**Don't use reactivity for:**
- Data that flows from parent to child (use props)
- Initialization logic (use `onMount`)
- Complex state synchronization (use events or simple callbacks)

## Summary

**The golden rule:** If you're reaching for `$effect()`, `untrack()`, or complex reactive patterns, stop and ask: "Can I make this simpler?"

Most of the time, the answer is yes:
- Use `onMount()` for initialization
- Pass props directly instead of through stores
- Use plain variables for internal tracking
- Let web components manage their own state
