# @pie-element/math-typesetting

Pluggable math typesetting system for PIE elements with KaTeX and MathML support.

## Features

- **Pluggable Architecture**: Easy to swap between different math rendering engines
- **KaTeX by Default**: Automatic KaTeX rendering with lazy loading
- **MathML Support**: Native browser MathML rendering as an alternative
- **Zero Coupling**: Math rendering engine is completely decoupled from consumers
- **Lazy Loading**: Math engines only loaded when first used
- **Automatic CSS Loading**: CSS dependencies loaded automatically (configurable)
- **Framework Agnostic**: Works in React, Svelte, vanilla JavaScript
- **TypeScript**: Full TypeScript support with type definitions

## Installation

```bash
bun add @pie-element/math-typesetting
```

## Quick Start

### Basic Usage with KaTeX (Default)

```typescript
import { createKatexRenderer } from '@pie-element/math-typesetting';

// Create renderer (KaTeX and CSS loaded automatically)
const renderer = createKatexRenderer();

// Render math in an element
await renderer(document.body);
```

### Using Native MathML

```typescript
import { createMathMLRenderer } from '@pie-element/math-typesetting';

// Create MathML renderer (no dependencies, no CSS needed)
const renderer = createMathMLRenderer();

// Render math in an element (synchronous)
renderer(document.body);
```

## API Reference

### Core Types

#### `MathRenderer`

Function signature for math renderers:

```typescript
type MathRenderer = (element: HTMLElement) => void | Promise<void>;
```

### Adapters

#### `createKatexRenderer(options?): MathRenderer`

Creates a KaTeX-based math renderer with lazy loading.

**Options:**

- `loadCss` (boolean, default: `true`): Automatically load KaTeX CSS
- `trust` (boolean, default: `true`): Trust user LaTeX (allows `\includegraphics`, etc.)
- `throwOnError` (boolean, default: `false`): Throw on rendering errors

**Example:**

```typescript
const renderer = createKatexRenderer({
  loadCss: true,
  trust: true,
  throwOnError: false
});

await renderer(document.getElementById('math-container'));
```

#### `createMathMLRenderer(): MathRenderer`

Creates a native MathML renderer (uses browser's built-in support).

**Example:**

```typescript
const renderer = createMathMLRenderer();
renderer(document.body); // Synchronous, no await needed
```

### Utilities

#### `wrapMath(content, wrapType?): string`

Wraps content with LaTeX delimiters.

```typescript
import { wrapMath, BracketTypes } from '@pie-element/math-typesetting';

const wrapped = wrapMath('x^2 + y^2 = z^2', BracketTypes.ROUND_BRACKETS);
// Returns: "\\(x^2 + y^2 = z^2\\)"
```

#### `unWrapMath(content): { unwrapped: string; wrapType: BracketType }`

Unwraps content from LaTeX delimiters.

```typescript
import { unWrapMath } from '@pie-element/math-typesetting';

const result = unWrapMath('\\(x^2\\)');
// Returns: { unwrapped: "x^2", wrapType: "round_brackets" }
```

#### `mmlToLatex(mathml): string`

Converts MathML to LaTeX.

```typescript
import { mmlToLatex } from '@pie-element/math-typesetting';

const latex = mmlToLatex('<math><mi>x</mi></math>');
```

#### `loadCss(url, options?): Promise<void>`

Dynamically loads CSS (with caching).

```typescript
import { loadCss } from '@pie-element/math-typesetting';

await loadCss('https://example.com/style.css', {
  integrity: 'sha384-...',
  crossOrigin: 'anonymous'
});
```

## Integration Examples

### With PIE Element Player

```typescript
import { createKatexRenderer } from '@pie-element/math-typesetting';
import type { MathRenderer } from '@pie-element/math-typesetting';

// The element player accepts a math renderer prop
const player = document.querySelector('pie-element-player');
(player as any).mathRenderer = createKatexRenderer();
```

### With React Component

```typescript
import { useEffect, useRef } from 'react';
import { createKatexRenderer } from '@pie-element/math-typesetting';

function MathComponent({ content }) {
  const ref = useRef<HTMLDivElement>(null);
  const renderer = useRef(createKatexRenderer());

  useEffect(() => {
    if (ref.current) {
      renderer.current(ref.current);
    }
  }, [content]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: content }} />;
}
```

### With Svelte Component

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { createKatexRenderer } from '@pie-element/math-typesetting';

  let container: HTMLDivElement;
  const renderer = createKatexRenderer();

  onMount(() => {
    renderer(container);
  });

  $effect(() => {
    if (container) {
      renderer(container);
    }
  });
</script>

<div bind:this={container}>
  <span data-latex>x^2 + y^2 = z^2</span>
</div>
```

### Custom Renderer

You can create your own custom math renderer:

```typescript
import type { MathRenderer } from '@pie-element/math-typesetting';

const myCustomRenderer: MathRenderer = async (element) => {
  // Custom implementation
  const mathElements = element.querySelectorAll('[data-latex]');

  for (const el of mathElements) {
    const latex = el.textContent || '';
    // ... custom rendering logic
    el.innerHTML = await renderWithCustomEngine(latex);
  }
};

// Use it
await myCustomRenderer(document.body);
```

## Browser Support

### KaTeX Adapter
- All modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES2015+ support

### MathML Adapter
- Chrome 109+
- Firefox (all versions)
- Safari (all versions)
- **Not supported:** Internet Explorer

## Architecture

This package follows the pluggable architecture pattern from pie-qti's typesetting system:

1. **Simple Interface**: Just a function `(element: HTMLElement) => void | Promise<void>`
2. **Zero Coupling**: Consumers don't depend on specific math engines
3. **Lazy Loading**: Math engines loaded only when first used
4. **Graceful Degradation**: Missing renderer = raw LaTeX/MathML displayed

## Migration from @pie-element/shared-math-rendering-core

The new package provides a cleaner, pluggable API:

**Old (tightly coupled):**
```typescript
import { renderMath } from '@pie-element/shared-math-rendering-core';
renderMath(document.body);
```

**New (pluggable):**
```typescript
import { createKatexRenderer } from '@pie-element/math-typesetting';

const renderer = createKatexRenderer();
await renderer(document.body);
```

## Development

### Build

```bash
bun run build
```

### Test

```bash
bun test
```

### Dev Mode

```bash
bun run dev
```

## License

See the root LICENSE file.

## Related Packages

- `@pie-element/element-player` - PIE element player (uses this package)
- `@pie-element/shared-mathml-to-latex` - MathML to LaTeX conversion
- `@pie-qti/qti2-typeset-katex` - Similar implementation for QTI

## Contributing

Contributions are welcome! Please follow the monorepo contribution guidelines.
