# @pie-element/shared-mathquill

MathQuill for PIE - Desmos fork with Khan patches, Learnosity features, and PIE extensions.

## Features

This package provides a **PIE-specific wrapper** around MathQuill that:

- ✅ **Direct PIE API** - Consumers use `MathField`/`StaticMath` directly
- ✅ **All PIE extensions pre-loaded** - Matrix support, recurring decimals, LRN exponents
- ✅ **Khan Academy patches** - Mobile keyboard fixes, i18n ARIA support
- ✅ **Learnosity features** - Not-symbols (≮, ≯), empty detection
- ✅ **Simple import** - Just `import MathQuill from '@pie-element/shared-mathquill'`

## Installation

```bash
bun add @pie-element/shared-mathquill
```

## Usage

### Basic Import

```typescript
import MathQuill from '@pie-element/shared-mathquill';
import '@pie-element/shared-mathquill/mathquill.css';

// MathQuill is ready to use - no need to call getInterface()!
const mathField = MathQuill.MathField(element, {
  handlers: {
    edit: () => console.log('edited!')
  }
});
```

### Named Exports

```typescript
import { MathField, StaticMath } from '@pie-element/shared-mathquill';

// Create a math field
const field = MathField(element, config);

// Create static math
const static = StaticMath(element);
```

### Register Custom Embeds

```typescript
import MathQuill from '@pie-element/shared-mathquill';

MathQuill.registerEmbed('myEmbed', (data) => ({
  htmlString: '<span class="my-embed">Custom</span>',
  text: () => 'Custom',
  latex: () => `\\embed{myEmbed}[${data}]`
}));
```

## Important: jQuery is an internal runtime dependency

`mathquill/build/mathquill.js` is still a legacy UMD/global bundle and expects `window.jQuery` at
module evaluation time. This package sets up jQuery globals internally, so consumers do not need to
manage that manually.

**For PIE elements:** Do NOT call `getInterface(2)` - this wrapper exports direct APIs:

```typescript
// ❌ OLD (requires jQuery)
import MathQuill from '@pie-element/shared-mathquill';
const MQ = MathQuill.getInterface(2);

// ✅ NEW (direct API)
import MathQuill from '@pie-element/shared-mathquill';
const MQ = MathQuill;
```

The wrapper provides these APIs:
- `MathQuill.MathField()`
- `MathQuill.StaticMath()`
- `MathQuill.registerEmbed()`

## PIE Extensions

### Matrix Support

Create matrices with LaTeX commands:

```typescript
// Create different matrix types
mathField.write('\\pmatrix{a&b\\\\c&d}');  // Parentheses ( )
mathField.write('\\bmatrix{a&b\\\\c&d}');  // Brackets [ ]
mathField.write('\\vmatrix{a&b\\\\c&d}');  // Bars | |
mathField.write('\\Bmatrix{a&b\\\\c&d}');  // Braces { }
mathField.write('\\Vmatrix{a&b\\\\c&d}');  // Double bars ‖ ‖
```

**Keyboard shortcuts:**
- `Shift-Enter` - Add row
- `Shift-Space` - Add column
- Arrow keys - Navigate cells
- Auto-cleanup empty rows/columns

### Recurring Decimals

```typescript
mathField.write('0.\\dot{3}');  // 0.3̇
```

### LRN Exponents

```typescript
mathField.write('\\lrnexponent{x}{2}');        // x² (proper superscript)
mathField.write('\\lrnsquaredexponent{x}');    // x² (shorthand)
mathField.write('\\lrnsubscript{x}{1}');       // x₁ (subscript)
```

### Not Symbols (Learnosity)

```typescript
mathField.write('\\nless');   // ≮ (not less than)
mathField.write('\\ngtr');    // ≯ (not greater than)
```

## API Compatibility

This package exports a **v3 MathQuillInterface** which is compatible with all PIE elements:

```typescript
interface MathQuillInterface {
  MathField(element: HTMLElement, config?: MathFieldConfig): MathFieldInterface;
  StaticMath(element: HTMLElement): StaticMathInterface;
  registerEmbed(name: string, fn: (data: string) => EmbedDefinition): void;
}
```

All methods are exposed through the wrapper in a stable ESM package API.

## Migration from jQuery Version

If you have code using `getInterface(2)`:

```typescript
// Before
import MathQuill from '@pie-element/shared-mathquill';
let MQ;
if (typeof window !== 'undefined') {
  MQ = MathQuill.getInterface(2);
}

// After
import MathQuill from '@pie-element/shared-mathquill';
let MQ;
if (typeof window !== 'undefined') {
  MQ = MathQuill;  // Direct use, no getInterface() needed
}
```

## Bundle Size

- **346KB** (63KB gzipped) - MathQuill + all extensions, no jQuery
- Includes all PIE extensions pre-configured
- CSS: 0.82KB (0.34KB gzipped)

## Dependency Source and Version Policy

- Runtime dependency is currently pinned to `mathquill@0.10.1`.
- Migration provenance is tracked in `package.json` (`mathquillMigration`) and
  `migration-config.json` (Desmos base + PIE/Khan/Learnosity patch layering).
- Prefer fixed package versions for reproducible workspace builds. Avoid switching to floating fork
  refs unless there is a specific, documented need.

## Testing

```bash
# Run tests
bun test

# Run tests in watch mode
bun test --watch
```

**Test coverage:** 53 tests covering:
- Matrix implementation (40 tests)
- Extension functionality (13 tests)
- All edge cases and limits

## CSS Import

Always import the MathQuill CSS in your application:

```typescript
import '@pie-element/shared-mathquill/mathquill.css';
```

Or in your CSS file:

```css
@import '@pie-element/shared-mathquill/mathquill.css';
```

## License

MPL-2.0 (inherited from Desmos MathQuill fork)

## Base Package

Built on [Desmos MathQuill](https://github.com/desmosinc/mathquill) - a TypeScript fork of the original MathQuill with modern improvements.
