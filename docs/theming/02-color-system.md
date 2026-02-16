# Color System

PIE elements use a centralized color system via `@pie-lib/render-ui` that exposes 45+ colors through CSS custom properties.

## Using Colors in Components

All colors are accessed through helper functions that return CSS variables with fallbacks:

```typescript
import { color } from '@pie-lib/render-ui';

const MyComponent = styled('div')({
  color: color.text(),                    // var(--pie-text, black)
  backgroundColor: color.background(),     // var(--pie-background, transparent)
  borderColor: color.border(),            // var(--pie-border, #9A9A9A)

  '&:hover': {
    backgroundColor: color.primaryLight(), // var(--pie-primary-light, #9FA8DA)
  },
});
```

## Complete Color Reference

### Core Colors

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `text()` | `--pie-text` | `black` | Primary text color |
| `background()` | `--pie-background` | `transparent` | Component background |
| `primary()` | `--pie-primary` | `#3F51B5` | Primary brand color |
| `primaryLight()` | `--pie-primary-light` | `#9FA8DA` | Light variant of primary |
| `primaryDark()` | `--pie-primary-dark` | `#283593` | Dark variant of primary |
| `secondary()` | `--pie-secondary` | `#FF1493` | Secondary brand color |
| `secondaryLight()` | `--pie-secondary-light` | `#FF80AB` | Light variant of secondary |
| `secondaryDark()` | `--pie-secondary-dark` | `#C51162` | Dark variant of secondary |

### Semantic State Colors

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `correct()` | `--pie-correct` | `#4CAF50` | Correct answers, success states |
| `correctSecondary()` | `--pie-correct-secondary` | `#E8F5E9` | Subtle correct backgrounds |
| `correctTertiary()` | `--pie-correct-tertiary` | `#43A047` | Darker correct variant |
| `correctIcon()` | `--pie-correct-icon` | `#388E3C` | Icons indicating correct |
| `incorrect()` | `--pie-incorrect` | `#FF9800` | Incorrect answers |
| `incorrectSecondary()` | `--pie-incorrect-secondary` | `#FFEBEE` | Subtle incorrect backgrounds |
| `incorrectIcon()` | `--pie-incorrect-icon` | `#E65100` | Icons indicating incorrect |
| `missing()` | `--pie-missing` | `#D32F2F` | Missing or unanswered |
| `missingIcon()` | `--pie-missing-icon` | `#B71C1C` | Icons for missing responses |

### Disabled States

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `disabled()` | `--pie-disabled` | `grey` | Disabled elements |
| `disabledSecondary()` | `--pie-disabled-secondary` | `#ABABAB` | Lighter disabled state |

### Borders

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `border()` | `--pie-border` | `#9A9A9A` | Standard borders |
| `borderLight()` | `--pie-border-light` | `#C5C5C5` | Light borders |
| `borderDark()` | `--pie-border-dark` | `#6B6B6B` | Dark/prominent borders |
| `borderGray()` | `--pie-border-gray` | `#9A9A9A` | Gray borders |

### Backgrounds

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `background()` | `--pie-background` | `transparent` | Primary background |
| `backgroundDark()` | `--pie-background-dark` | `#F5F5F5` | Darker background variant |
| `secondaryBackground()` | `--pie-secondary-background` | `#F5F5F5` | Secondary backgrounds |
| `dropdownBackground()` | `--pie-dropdown-background` | `#EFEFEF` | Dropdown/select backgrounds |

### Focus States

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `focusChecked()` | `--pie-focus-checked` | `rgba(63,81,181,0.2)` | Focus ring for checked items |
| `focusCheckedBorder()` | `--pie-focus-checked-border` | `#283593` | Border for focused checked |
| `focusUnchecked()` | `--pie-focus-unchecked` | `rgba(0,0,0,0.12)` | Focus ring for unchecked |
| `focusUncheckedBorder()` | `--pie-focus-unchecked-border` | `#9A9A9A` | Border for focused unchecked |

### Tertiary Colors

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `tertiary()` | `--pie-tertiary` | `#E91E63` | Tertiary brand color |
| `tertiaryLight()` | `--pie-tertiary-light` | `rgba(233,30,99,0.2)` | Light tertiary variant |

### Accent & Faded

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `accent()` | `--pie-accent` | `#FF1493` | Accent color |
| `fadedPrimary()` | `--pie-faded-primary` | `rgba(63,81,181,0.15)` | Faded primary for backgrounds |

### Blue-Grey Palette

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `blueGrey100()` | `--pie-blue-grey-100` | `#CFD8DC` | Lightest blue-grey |
| `blueGrey300()` | `--pie-blue-grey-300` | `#90A4AE` | Light blue-grey |
| `blueGrey600()` | `--pie-blue-grey-600` | `#546E7A` | Medium blue-grey |
| `blueGrey900()` | `--pie-blue-grey-900` | `#263238` | Darkest blue-grey |

### Pure Colors

| Function | CSS Variable | Default | Usage |
|----------|--------------|---------|-------|
| `black()` | `--pie-black` | `#000000` | Pure black |
| `white()` | `--pie-white` | `#ffffff` | Pure white |

## Color Derivation

When using adapter packages (DaisyUI, MUI), extended colors are automatically derived from base colors:

```typescript
// Base theme (12 colors)
const baseTheme = {
  primary: '#3F51B5',
  success: '#4CAF50',
  error: '#FF9800',
  neutral: '#9E9E9E',
  'base-content': '#000000',
  'base-100': '#FFFFFF',
  // ... etc
};

// Extended theme (45+ colors automatically derived)
const extendedTheme = daisyUiToPieTheme(baseTheme);
// Now includes:
// - primary-light: lighten(primary, 0.3)
// - primary-dark: darken(primary, 0.3)
// - faded-primary: rgba(primary, 0.15)
// - correct-icon: darken(success, 0.2)
// - etc...
```

### Derivation Rules

- **Light variants**: `lighten(base, 0.3)` - Move 30% toward white
- **Dark variants**: `darken(base, 0.3)` - Move 30% toward black
- **Faded/transparent**: `rgba(base, 0.15)` - 15% opacity
- **Icons**: `darken(base, 0.2)` - Slightly darker for better visibility
- **Borders**: Based on neutral color with light/dark variants

## Theme Switching

Colors automatically adapt when CSS variables change:

```typescript
// Light theme
document.documentElement.style.setProperty('--pie-text', 'black');
document.documentElement.style.setProperty('--pie-background', 'white');

// Dark theme
document.documentElement.style.setProperty('--pie-text', 'white');
document.documentElement.style.setProperty('--pie-background', '#1a1a1a');
```

Or use the helper functions:

```typescript
import { generateCssVariables, injectCssVariables } from '@pie-element/theming';

const darkTheme = { /* ... */ };
const cssVars = generateCssVariables(darkTheme);
injectCssVariables(cssVars); // Injects to document root
```

## Fallback Values

All color functions include fallback values for graceful degradation:

```typescript
// If --pie-text is not set, falls back to 'black'
color: color.text() // → var(--pie-text, black)

// In CSS, this resolves to:
// 1. Use --pie-text if defined
// 2. Otherwise use 'black'
```

This ensures elements always have reasonable colors even without theming.

## Best Practices

### DO: Use Semantic Names

```typescript
// Good - clear semantic meaning
const Feedback = styled('div')(({ isCorrect }) => ({
  backgroundColor: isCorrect ? color.correctSecondary() : color.incorrectSecondary(),
  borderLeft: `4px solid ${isCorrect ? color.correct() : color.incorrect()}`,
}));
```

### DON'T: Use Arbitrary Colors

```typescript
// Bad - unclear purpose
const Feedback = styled('div')({
  backgroundColor: '#E8F5E9',  // What does this represent?
  borderLeft: '4px solid #4CAF50',
});
```

### DO: Use Appropriate Variants

```typescript
// Good - uses icon variant for icons
const CorrectIcon = styled(CheckIcon)({
  color: color.correctIcon(), // Darker for better visibility
});

const CorrectBackground = styled('div')({
  backgroundColor: color.correctSecondary(), // Subtle for backgrounds
});
```

## Next Steps

- [**Using Themes**](./03-using-themes.md) - Apply themes to your application
- [**Creating Elements**](./06-creating-elements.md) - Use colors in element development
- [**API Reference**](./08-api-reference.md) - Complete function signatures
