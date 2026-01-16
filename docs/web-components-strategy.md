# Web Components Strategy

**Status:** Proposed
**Priority:** Medium

## Overview

This document outlines the strategy for providing Web Components as the primary distribution format for PIE elements, enabling framework-agnostic consumption.
In practice, most consumers will load elements through a PIE player, which is responsible for wiring models, sessions, and player-specific lifecycle behaviors.

## The Problem

PIE elements are consumed by diverse applications using different frameworks (React, Angular, Vue, Svelte, vanilla JS). Currently, framework-specific packages create friction:

- Consumers must match their framework to the element's framework
- Updates require coordination across framework versions
- Bundle size includes framework overhead even when host already has it

## The Solution

**Distribute elements as Web Components** (standard custom elements) that work in any framework or vanilla JavaScript.

```html
<!-- Works everywhere -->
<pie-multiple-choice id="q1"></pie-multiple-choice>

<script type="module">
  import '@pie-elements-ng/multiple-choice';

  const el = document.getElementById('q1');
  el.model = {
    prompt: 'What is 2 + 2?',
    choiceMode: 'radio',
    choices: [
      { id: 'a', label: '3' },
      { id: 'b', label: '4' }
    ]
  };

  el.addEventListener('session-changed', (e) => {
    console.log('Answer:', e.detail.session);
  });
</script>
```

## Benefits

### Framework Independence

Elements work in React, Vue, Angular, Svelte, or vanilla JS without modification.

### Smaller Bundles

Svelte compiles to native Web Components with minimal overhead (~5KB) vs React wrappers (~40KB+).

### Future-Proof

Standard browser APIs won't break with framework version changes.

### Gradual Adoption

Consumers can migrate element-by-element, mixing implementations during transition.

## Implementation Approach

### Svelte Elements (Native)

Svelte 5 has built-in Web Component support:

```svelte
<svelte:options customElement="pie-multiple-choice" />
```

- No wrapper needed
- Small bundle size
- Native custom element

### React Elements (Wrapper)

Wrap React components in custom element class:

```typescript
class PieMultipleChoiceElement extends HTMLElement {
  private root: Root;

  connectedCallback() {
    this.root = createRoot(this);
    this.render();
  }

  set model(value) {
    this._model = value;
    this.render();
  }

  private render() {
    this.root.render(<MultipleChoice model={this._model} />);
  }
}

customElements.define('pie-multiple-choice', PieMultipleChoiceElement);
```

## Key Design Decisions

### Light DOM (No Shadow DOM)

PIE elements use Light DOM to inherit host application styles and support theming.

### Property-Based API

Complex data passed via JavaScript properties, not HTML attributes:

```javascript
element.model = { /* complex object */ };  // ✅
```

### Standard Events

Use CustomEvents for all element output:

```javascript
element.dispatchEvent(new CustomEvent('session-changed', {
  detail: { session },
  bubbles: true
}));
```

## Package Structure

```text
packages/
├── elements-svelte/               # Svelte element implementations
│   ├── media/
│   ├── multiple-choice/
│   ├── slider/
│   └── upload/
├── elements-react/                # React element implementations
│   ├── hotspot/
│   ├── multiple-choice/
│   └── number-line/
├── lib-svelte/                    # Shared Svelte libraries
├── lib-react/                     # Shared React libraries
├── shared/                        # Shared utilities
└── core/                          # Core PIE interfaces
```

## Trade-offs

### Advantages

- Framework agnostic
- Smaller bundles (Svelte)
- Standard APIs
- Better tree-shaking

### Challenges

- SSR requires special handling
- Property hydration in frameworks
- Event handling differs by framework
- Learning curve for teams unfamiliar with Web Components

## Status

**Current:** Proposed strategy
**Next Steps:**

1. Build proof-of-concept with 1-2 elements
2. Test integration in major frameworks
3. Gather feedback from consumers
4. Decide on full adoption

## References

- [Svelte Custom Elements](https://svelte.dev/docs/custom-elements-api)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- Framework integration examples live in the main docs and per-package demos.

---

**Document Version:** 2.0 (Condensed)
**Last Updated:** 2025-01-07
