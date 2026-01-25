# @pie-element/shared-math-rendering

Framework-agnostic math rendering using KaTeX.

## Overview

This package provides utilities for rendering LaTeX and MathML mathematical expressions in the browser. It uses [KaTeX](https://katex.org/) for fast, high-quality rendering without the overhead of MathJax.

## Features

- **Framework-agnostic**: Works with React, Svelte, Vue, or vanilla JavaScript
- **Fast rendering**: KaTeX is ~100x faster than MathJax
- **Small bundle**: ~100KB vs several MB for MathJax
- **Browser-native ESM**: Works with import maps and modern build tools
- **LaTeX support**: Renders LaTeX expressions via `data-latex` attributes
- **MathML support**: Converts and renders MathML elements

## Installation

```bash
bun add @pie-element/shared-math-rendering
```

## Usage

### Basic Rendering

```typescript
import { renderMath } from '@pie-element/shared-math-rendering';

// Render math in an element
renderMath(document.querySelector('.math-container'));

// Render math in the entire document
renderMath();
```

### LaTeX Elements

Add a `data-latex` attribute to any element:

```html
<div data-latex>x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}</div>
```

Then call `renderMath()` to render it.

### MathML Support

MathML elements are automatically converted to LaTeX and rendered:

```html
<math>
  <mrow>
    <mi>x</mi>
    <mo>=</mo>
    <mn>5</mn>
  </mrow>
</math>
```

### String Utilities

```typescript
import { wrapMath, unWrapMath } from '@pie-element/shared-math-rendering';

// Wrap LaTeX content
const wrapped = wrapMath('x^2 + y^2'); // Returns: \(x^2 + y^2\)

// Unwrap LaTeX content
const { unwrapped, wrapType } = unWrapMath('\\(x^2 + y^2\\)');
```

## API

### `renderMath(el?, options?)`

Render math in a DOM element or HTML string.

- **Parameters**:
  - `el` (optional): DOM element, HTML string, or `undefined` (defaults to `document.body`)
  - `options` (optional): Rendering options (reserved for future use)
- **Returns**: If `el` is a string, returns rendered HTML. Otherwise renders in place.

### `fixMathElement(element)`

Normalize a single math element by wrapping/unwrapping its content.

### `fixMathElements(container)`

Normalize all `[data-latex]` elements in a container.

### `wrapMath(content, wrapType?)`

Wrap math content with LaTeX delimiters.

### `unWrapMath(content)`

Unwrap math content from LaTeX delimiters.

### `mmlToLatex(mathml)`

Convert MathML to LaTeX.

## Trade-offs vs MathJax

**Advantages**:

- ✅ Much faster rendering (KaTeX is ~100x faster)
- ✅ Smaller bundle size (~100KB vs several MB)
- ✅ Works with production-like ESM import maps
- ✅ No global state conflicts

**Limitations**:

- ❌ Slightly less complete LaTeX support (95% coverage vs 99%)
- ❌ No speech-rule-engine accessibility features (yet)
  - accessibility features will be part of the pie-players project; if we need to add features in here to support that, we'll do that when proven.

## Dependencies

- `katex` - Math rendering engine
- `@pie-framework/mathml-to-latex` - MathML conversion
- `debug` - Debug logging

## License

See the root LICENSE file.
