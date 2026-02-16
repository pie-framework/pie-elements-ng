# @pie-lib-svelte/styling

PIE styling utilities for Svelte components. This package mirrors the functionality of `@pie-lib/render-ui` for React components, providing consistent theming across PIE elements.

## Installation

```bash
bun add @pie-lib-svelte/styling
```

## Usage

### In Svelte Components

Use PIE color variables directly in your component styles:

```svelte
<script lang="ts">
  import { color } from '@pie-lib-svelte/styling';

  let isDarkMode = $state(false);
</script>

<div class="container">
  <p>This uses PIE theming!</p>
</div>

<style>
  .container {
    color: var(--pie-text, rgba(0, 0, 0, 0.87));
    background-color: var(--pie-background, white);
    border: 1px solid var(--pie-border-light, #ccc);
    padding: 1rem;
  }

  .container:hover {
    border-color: var(--pie-primary, #3f51b5);
  }
</style>
```

### Programmatic Access

You can also use the color functions programmatically:

```svelte
<script lang="ts">
  import { color } from '@pie-lib-svelte/styling';

  let buttonStyle = $state('');

  function updateStyle() {
    buttonStyle = `
      background-color: ${color.primary()};
      color: ${color.white()};
      border: 1px solid ${color.primaryDark()};
    `;
  }
</script>

<button style={buttonStyle} onclick={updateStyle}>
  Click me
</button>
```

## Available Colors

All color functions return CSS variable references with fallback values:

### Basic Colors
- `text()` - Main text color
- `background()` - Background color
- `disabled()` - Disabled state color
- `border()`, `borderLight()`, `borderDark()` - Border colors
- `black()`, `white()`, `transparent()`

### Status Colors
- `correct()`, `correctSecondary()`, `correctWithIcon()` - Correct answer states
- `incorrect()`, `incorrectSecondary()`, `incorrectWithIcon()` - Incorrect answer states
- `missing()`, `missingWithIcon()` - Missing/unanswered states

### Theme Colors
- `primary()`, `primaryLight()`, `primaryDark()` - Primary theme color
- `secondary()`, `secondaryLight()`, `secondaryDark()` - Secondary theme color
- `tertiary()`, `tertiaryLight()` - Tertiary theme color

### Special Colors
- `backgroundDark()`, `secondaryBackground()`, `dropdownBackground()`
- `focusChecked()`, `focusUnchecked()` - Focus states
- `blueGrey100()`, `blueGrey300()`, `blueGrey600()`, `blueGrey900()` - Blue-grey scale

## How It Works

Each color function generates a CSS variable reference with a fallback:

```typescript
color.primary() // Returns: var(--pie-primary, #3f51b5)
color.text()    // Returns: var(--pie-text, rgba(0, 0, 0, 0.87))
```

This allows:
1. **Theme consistency** - All PIE elements use the same color system
2. **Runtime theming** - Colors can be overridden via CSS custom properties
3. **Graceful fallbacks** - Default colors work even without theme provider
4. **Framework agnostic** - Works with any CSS-based styling approach

## Comparison with React

This package mirrors `@pie-lib/render-ui/color`:

**React:**
```tsx
import { color } from '@pie-lib/render-ui';

const StyledDiv = styled('div')({
  color: color.text(),
  backgroundColor: color.background(),
});
```

**Svelte:**
```svelte
<script>
  import { color } from '@pie-lib-svelte/styling';
</script>

<style>
  div {
    color: var(--pie-text, rgba(0, 0, 0, 0.87));
    background-color: var(--pie-background, white);
  }
</style>
```

## Best Practices

1. **Always use CSS variables in styles** - Reference `--pie-*` variables directly in `<style>` blocks
2. **Use color functions for dynamic styles** - Use the imported functions when building style strings programmatically
3. **Provide fallbacks** - The library includes sensible defaults, but you can override them
4. **Match React conventions** - When porting React components, use equivalent color variables

## Example: EditableHtml Component

See [packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte](../editable-html-tiptap-svelte/src/EditableHtml.svelte) for a complete example of using PIE variables throughout a component.

## Architecture

- **No runtime overhead** - Pure TypeScript functions that return strings
- **Type-safe** - Full TypeScript support with auto-completion
- **Tree-shakeable** - Import only what you need
- **Zero dependencies** - No external dependencies beyond TypeScript

## License

Private package for PIE Elements monorepo.
