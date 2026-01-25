# @pie-element/lib-math

Math rendering utilities for PIE elements using MathJax 4.

## Installation

```bash
bun add @pie-element/lib-math
```

## Usage

### Math Component (Svelte)

Render HTML content with LaTeX math expressions:

```svelte
<script>
  import Math from '@pie-element/lib-math/Math.svelte';

  const mathContent = '<p>Solve for x: \\(x^2 + 2x + 1 = 0\\)</p>';
</script>

<Math html={mathContent} />

<!-- Optional: enable single dollar syntax (not recommended) -->
<Math html={mathContent} useSingleDollar={true} />
```

### Direct Rendering

Render math in DOM elements directly:

```typescript
import { renderMath } from '@pie-element/lib-math';

// Render math in a single element
const element = document.getElementById('math-content');
renderMath(element);

// Render math in multiple elements
const elements = document.querySelectorAll('.math');
renderMath(Array.from(elements));

// With options
renderMath(element, { useSingleDollar: false });
```

### Utility Functions

```typescript
import {
  containsMath,
  extractMathExpressions,
  wrapMath,
  unWrapMath,
  fixMathElement,
  BracketTypes,
} from '@pie-element/lib-math';

// Check if HTML contains math
if (containsMath('<p>\\(x^2\\)</p>')) {
  console.log('Contains math!');
}

// Extract math expressions
const expressions = extractMathExpressions('<p>\\(x^2\\) and \\[y = mx + b\\]</p>');
// ['x^2', 'y = mx + b']

// Wrap/unwrap math delimiters
const wrapped = wrapMath('x^2', BracketTypes.ROUND_BRACKETS);
// Returns: '\\(x^2\\)'

const { unwrapped, wrapType } = unWrapMath('\\(x^2\\)');
// unwrapped: 'x^2'
// wrapType: BracketTypes.ROUND_BRACKETS

// Fix math elements with data-latex attribute
const mathEl = document.querySelector('[data-latex]');
fixMathElement(mathEl);
```

## Supported Delimiters

- **Inline math**: `\(...\)` (recommended) or `$...$` (opt-in)
- **Display math**: `\[...\]` or `$$...$$`

**Note**: Single dollar sign (`$...$`) must be explicitly enabled with `useSingleDollar: true`, but this is not recommended as it can conflict with regular text containing dollar signs.

## Custom LaTeX Macros

The following custom macros are pre-configured:

- `\parallelogram` - Parallelogram symbol
- `\overarc` - Arc over expression (alias for `\overparen`)
- `\napprox` - Not approximately equal
- `\longdiv` - Long division notation

## Accessibility

MathJax automatically provides:

- **Assistive MathML** for screen readers
- **Speech text** generation (deep speech)
- **Menu system** for accessibility options
- **Keyboard navigation** (Tab to focus, then arrow keys)

## Configuration

```typescript
interface MathRenderOptions {
  /**
   * Enable single dollar sign for inline math (not recommended)
   * Default: false
   */
  useSingleDollar?: boolean;
}
```

## Implementation Details

This package uses **MathJax v4.1.0** loaded from CDN:

- TeX input processor (with all standard packages)
- CommonHTML output processor
- Fonts loaded from jsDelivr CDN
- Async rendering with `typesetPromise`
- Context menu and explorer enabled for accessibility

## Performance

- MathJax is **loaded once from CDN** and cached by the browser
- Subsequent renders use `typesetPromise` for async, non-blocking rendering
- Fonts are loaded once and cached
- Zero bundle size impact (CDN-based)

## Troubleshooting

### Math not rendering

1. Check console for errors
2. Ensure elements have proper delimiters: `\(...\)` or `\[...\]`
3. Try `fixMathElements()` if using `data-latex` attributes

### Accessibility issues

1. MathJax adds `data-mathml` attributes automatically
2. Speech text is generated on first render
3. Allow time for Speech Rule Engine to initialize

## Advanced Usage

### Custom line breaks in math

Use `\newline` for line breaks in math expressions:

```typescript
const latex = 'x = 1 \\newline y = 2';
```

### Handling math in dynamic content

```typescript
import { renderMath } from '@pie-element/lib-math';

// After adding dynamic content
const container = document.getElementById('dynamic-content');
container.innerHTML = '<p>New math: \\(e^{i\\pi} + 1 = 0\\)</p>';
renderMath(container);
```

## Credits

Inspired by [@pie-lib/math-rendering](https://github.com/pie-framework/pie-lib/tree/develop/packages/math-rendering), modernized for MathJax 4.

## Future Enhancements

- [ ] KaTeX option for faster rendering (lighter weight)
- [ ] Custom MathJax configuration options
- [ ] Math input component (MathQuill or similar)
- [ ] Copy/paste math expressions
- [ ] Server-side rendering support (for static generation)
