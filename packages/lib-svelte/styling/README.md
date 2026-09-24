# @pie-lib/styling-svelte

PIE styling utilities for Svelte components. This package mirrors the functionality of `@pie-lib/render-ui` for React components, providing consistent theming across PIE elements.

## Installation

```bash
bun add @pie-lib/styling-svelte
```

## Usage

### In Svelte Components

Use PIE color variables directly in your component styles:

```svelte
<script lang="ts">
  import { color } from '@pie-lib/styling-svelte';

  let isDarkMode = $state(false);
</script>

<div class="container">
  <p>This uses PIE theming!</p>
</div>

<style>
  .container {
    color: var(--pie-text, black);
    background-color: var(--pie-background, rgba(255, 255, 255, 0));
    border: 1px solid var(--pie-border-light, #D1D1D1);
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
  import { color } from '@pie-lib/styling-svelte';

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
- `disabled()`, `disabledSecondary()` - Disabled state colors
- `disabledText()` - Disabled text that must stay readable, such as a non-editable label
- `border()`, `borderLight()`, `borderDark()`, `borderGray()` - Border colors
- `black()`, `white()`, `transparent()`

### Status Colors
- `correct()`, `correctSecondary()`, `correctTertiary()`, `correctWithIcon()` - Correct answer states
- `incorrect()`, `incorrectSecondary()`, `incorrectWithIcon()` - Incorrect answer states
- `missing()`, `missingWithIcon()` - Missing/unanswered states

### Theme Colors
- `primary()`, `primaryLight()`, `primaryDark()`, `primaryText()`, `fadedPrimary()` - Primary theme color
- `secondary()`, `secondaryLight()`, `secondaryDark()`, `secondaryText()` - Secondary theme color
- `tertiary()`, `tertiaryLight()` - Tertiary theme color

### Special Colors
- `backgroundDark()`, `secondaryBackground()`, `dropdownBackground()`
- `surface()` - Raised surface for cards, answer pools and menus
- `tableGrid()`, `tableGridLight()`, `tableStripe()` - Authored tables
- `focusChecked()`, `focusCheckedBorder()`, `focusUnchecked()`, `focusUncheckedBorder()` - Focus states
- `buttonFocusOutline()` - Keyboard focus ring on a button or toolbar control
- `blueGrey100()`, `blueGrey300()`, `blueGrey600()`, `blueGrey900()` - Blue-grey scale
- `keypadButton()`, `keypadButtonOperator()`, `keypadEmptyPlaceholder()`, `keypadButtonHover()`, `keypadButtonOperatorHover()`, `keyBoardFocusIndicator()` - Math keypad
- `buttonBorder()`, `buttonHoverBg()` - Graphing controls
- `visualElementsColors` - Fixed charting and graphing colors, including `SHAPES_FILL_COLOR`

## How It Works

Each color function generates a CSS variable reference with a fallback:

```typescript
color.primary() // Returns: var(--pie-primary, #3f51b5)
color.text()    // Returns: var(--pie-text, black)
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
  import { color } from '@pie-lib/styling-svelte';
</script>

<style>
  div {
    color: var(--pie-text, black);
    background-color: var(--pie-background, rgba(255, 255, 255, 0));
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

MIT, as the rest of the pie-elements-ng monorepo. Published to npm as `@pie-lib/styling-svelte`.
