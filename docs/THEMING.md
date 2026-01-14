# Theming and Customization

PIE Elements NG uses DaisyUI for theming, providing 32 built-in themes and full customization via CSS variables.

## Quick Start

### Using Built-in Themes

```html
<!DOCTYPE html>
<html data-theme="light">
<head>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@latest/dist/full.css" rel="stylesheet">
</head>
<body>
  <pie-multiple-choice></pie-multiple-choice>
</body>
</html>
```

### Switching Themes Dynamically

```javascript
// Toggle between light and dark
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
}

// Or use a theme selector
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('theme', themeName);
}

// Restore saved theme on load
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

## Available Themes

DaisyUI provides 32 themes out of the box:

### Light Themes
- `light` - Default light theme
- `cupcake` - Sweet pastel colors
- `bumblebee` - Yellow accents
- `emerald` - Green tones
- `corporate` - Professional blues
- `retro` - Vintage warm colors
- `cyberpunk` - Neon highlights
- `valentine` - Pink and romantic
- `garden` - Nature greens
- `lofi` - Calm minimalist
- `pastel` - Soft colors
- `fantasy` - Purple magical
- `wireframe` - Monochrome sketch
- `cmyk` - Print colors
- `autumn` - Warm orange
- `acid` - Lime green
- `lemonade` - Yellow citrus
- `winter` - Cool blues

### Dark Themes
- `dark` - Default dark theme
- `synthwave` - Retro neon
- `halloween` - Orange and purple
- `forest` - Deep greens
- `aqua` - Blue underwater
- `black` - Pure black background
- `luxury` - Gold accents
- `dracula` - Purple vampire
- `business` - Professional dark
- `night` - Deep blue
- `coffee` - Brown tones

### Demo Themes

```html
<select onchange="setTheme(this.value)">
  <option value="light">Light</option>
  <option value="dark">Dark</option>
  <option value="cupcake">Cupcake</option>
  <option value="corporate">Corporate</option>
  <option value="synthwave">Synthwave</option>
  <option value="halloween">Halloween</option>
</select>
```

## CSS Variables

### Color Variables

PIE elements use these CSS custom properties from DaisyUI:

```css
:root {
  /* Base colors */
  --color-primary: /* Main brand color */
  --color-secondary: /* Secondary brand color */
  --color-accent: /* Accent highlights */
  --color-neutral: /* Neutral grays */

  /* Background colors */
  --color-base-100: /* Page background */
  --color-base-200: /* Component background */
  --color-base-300: /* Borders and dividers */
  --color-base-content: /* Text on base colors */

  /* Semantic colors */
  --color-info: /* Information messages */
  --color-success: /* Success states */
  --color-warning: /* Warning states */
  --color-error: /* Error states */

  /* Border radius */
  --rounded-box: 1rem;
  --rounded-btn: 0.5rem;
  --rounded-badge: 1.9rem;

  /* Other */
  --animation-btn: 0.25s;
  --animation-input: 0.2s;
  --btn-focus-scale: 0.95;
  --border-btn: 1px;
  --tab-border: 1px;
}
```

### Component-Specific Variables

PIE elements also use custom variables:

```css
:root {
  /* Touch targets */
  --pie-target-size: 44px;

  /* Spacing */
  --pie-spacing-xs: 0.25rem;  /* 4px */
  --pie-spacing-sm: 0.5rem;   /* 8px */
  --pie-spacing-md: 1rem;     /* 16px */
  --pie-spacing-lg: 1.5rem;   /* 24px */
  --pie-spacing-xl: 2rem;     /* 32px */

  /* Typography */
  --pie-font-family: system-ui, -apple-system, sans-serif;
  --pie-font-size-sm: 0.875rem;  /* 14px */
  --pie-font-size-base: 1rem;    /* 16px */
  --pie-font-size-lg: 1.125rem;  /* 18px */
  --pie-line-height: 1.5;

  /* Transitions */
  --pie-transition-fast: 150ms ease;
  --pie-transition-base: 200ms ease;
  --pie-transition-slow: 300ms ease;
}
```

## Customization Examples

### Custom Brand Colors

Override primary color to match your brand:

```css
:root {
  --color-primary: #your-brand-color;
  --color-primary-focus: #darker-shade;
  --color-primary-content: #ffffff;
}

/* Or in data-theme */
[data-theme="my-brand"] {
  --color-primary: #ff6b35;
  --color-secondary: #004e89;
  --color-accent: #f77f00;
}
```

### Custom Dark Theme

```css
[data-theme="my-dark"] {
  color-scheme: dark;

  --color-primary: #60a5fa;
  --color-secondary: #a78bfa;
  --color-accent: #fb923c;

  --color-base-100: #1e1e2e;
  --color-base-200: #181825;
  --color-base-300: #11111b;
  --color-base-content: #cdd6f4;

  --color-success: #a6e3a1;
  --color-warning: #f9e2af;
  --color-error: #f38ba8;
  --color-info: #89dceb;
}
```

### Corporate Theme

```css
[data-theme="my-corporate"] {
  /* Muted professional colors */
  --color-primary: #0f4c81;
  --color-secondary: #5c6f82;
  --color-accent: #ee6c4d;

  --color-base-100: #ffffff;
  --color-base-200: #f8f9fa;
  --color-base-300: #dee2e6;
  --color-base-content: #212529;

  /* Subtle rounded corners */
  --rounded-box: 0.375rem;
  --rounded-btn: 0.25rem;

  /* Professional font */
  --pie-font-family: 'Inter', system-ui, sans-serif;
}
```

### Educational Theme

```css
[data-theme="my-edu"] {
  /* Bright, friendly colors */
  --color-primary: #4299e1;
  --color-secondary: #48bb78;
  --color-accent: #ed8936;

  --color-base-100: #f7fafc;
  --color-base-200: #edf2f7;
  --color-base-content: #2d3748;

  /* Playful rounded corners */
  --rounded-box: 1rem;
  --rounded-btn: 2rem;

  /* Legible font */
  --pie-font-family: 'Open Sans', sans-serif;
  --pie-font-size-base: 1.125rem; /* Larger for readability */
  --pie-line-height: 1.6;
}
```

## Styling Specific Elements

### Multiple Choice

```css
/* Choice items */
pie-multiple-choice .choice {
  padding: var(--pie-spacing-md);
  border-radius: var(--rounded-box);
  transition: background-color var(--pie-transition-base);
}

pie-multiple-choice .choice:hover {
  background-color: var(--color-base-200);
}

pie-multiple-choice .choice.selected {
  background-color: color-mix(in oklab, var(--color-primary) 10%, transparent);
  border-color: var(--color-primary);
}

/* Radio buttons */
pie-multiple-choice input[type="radio"] {
  width: var(--pie-target-size);
  height: var(--pie-target-size);
  accent-color: var(--color-primary);
}

/* Feedback in evaluate mode */
pie-multiple-choice .feedback.correct {
  color: var(--color-success);
  background: color-mix(in oklab, var(--color-success) 10%, transparent);
}

pie-multiple-choice .feedback.incorrect {
  color: var(--color-error);
  background: color-mix(in oklab, var(--color-error) 10%, transparent);
}
```

### Slider

```css
/* Slider track */
pie-slider input[type="range"] {
  height: 8px;
  border-radius: 4px;
  background: var(--color-base-300);
}

/* Slider thumb */
pie-slider input[type="range"]::-webkit-slider-thumb {
  width: var(--pie-target-size);
  height: var(--pie-target-size);
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Value display */
pie-slider .value-display {
  font-size: var(--pie-font-size-lg);
  font-weight: 600;
  color: var(--color-primary);
}
```

### Rich Text Editor

```css
/* Editor container */
.tiptap-editor-container {
  background: var(--color-base-100);
  border: 1px solid var(--color-base-300);
  border-radius: var(--rounded-box);
  transition: border-color var(--pie-transition-base);
}

.tiptap-editor-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 15%, transparent);
}

/* Editor content */
.pie-tiptap {
  color: var(--color-base-content);
  font-family: var(--pie-font-family);
  font-size: var(--pie-font-size-base);
  line-height: var(--pie-line-height);
}

/* Toolbar */
.tiptap-toolbar button {
  padding: var(--pie-spacing-sm);
  border-radius: var(--rounded-btn);
  transition: background-color var(--pie-transition-fast);
}

.tiptap-toolbar button:hover {
  background: var(--color-base-200);
}

.tiptap-toolbar button.active {
  background: var(--color-primary);
  color: var(--color-primary-content);
}
```

## Responsive Design

### Mobile Optimizations

```css
/* Increase touch targets on mobile */
@media (max-width: 767px) {
  :root {
    --pie-target-size: 48px; /* Larger for fingers */
    --pie-font-size-base: 1.0625rem; /* Slightly larger */
  }

  /* Stack choices vertically */
  pie-multiple-choice .choices {
    flex-direction: column;
  }

  /* Full-width buttons */
  pie-multiple-choice button {
    width: 100%;
  }
}
```

### Tablet Adjustments

```css
@media (min-width: 768px) and (max-width: 1023px) {
  :root {
    --pie-spacing-md: 1.25rem;
    --pie-spacing-lg: 2rem;
  }

  /* Two-column layout for choices */
  pie-multiple-choice .choices {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--pie-spacing-md);
  }
}
```

### Desktop Enhancements

```css
@media (min-width: 1024px) {
  /* Hover effects only on desktop */
  pie-multiple-choice .choice:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* More generous spacing */
  :root {
    --pie-spacing-lg: 2rem;
    --pie-spacing-xl: 3rem;
  }
}
```

## Print Styles

### Print Mode Styling

```css
@media print {
  /* Remove interactive elements */
  pie-multiple-choice button,
  pie-multiple-choice input[type="radio"]:not(:checked) {
    display: none;
  }

  /* Show selected answers */
  pie-multiple-choice input[type="radio"]:checked::before {
    content: '✓';
    display: inline-block;
    margin-right: 0.5em;
  }

  /* Black and white for printing */
  * {
    background: white !important;
    color: black !important;
  }

  /* Highlight correct answers (instructor) */
  pie-multiple-choice[data-role="instructor"] .choice.correct {
    font-weight: bold;
    text-decoration: underline;
  }
}
```

## Accessibility Considerations

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    --color-primary: #0000ff;
    --color-base-content: #000000;
    --color-base-100: #ffffff;
  }

  /* Stronger borders */
  pie-multiple-choice .choice {
    border: 2px solid currentColor;
  }

  /* Clearer focus indicators */
  :focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Disable hover animations */
  pie-multiple-choice .choice:hover {
    transform: none;
  }
}
```

### Dark Mode Preference

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* Auto dark mode if no theme set */
    --color-base-100: #1e1e2e;
    --color-base-200: #181825;
    --color-base-content: #cdd6f4;
    /* ... other dark colors */
  }
}
```

## Custom Theme Configuration

### Tailwind Config

If using Tailwind CSS with DaisyUI:

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      'light',
      'dark',
      {
        'my-theme': {
          primary: '#0f4c81',
          secondary: '#5c6f82',
          accent: '#ee6c4d',
          neutral: '#2a2e37',
          'base-100': '#ffffff',
          info: '#3abff8',
          success: '#36d399',
          warning: '#fbbd23',
          error: '#f87272',
        },
      },
    ],
  },
};
```

### Theme Generator

Use DaisyUI's theme generator:

1. Visit [daisyui.com/theme-generator](https://daisyui.com/theme-generator/)
2. Customize colors
3. Copy generated CSS
4. Add to your stylesheet

## Best Practices

### Do's

✅ Use CSS variables for consistency
✅ Test themes in both light and dark modes
✅ Verify color contrast meets WCAG AA (4.5:1)
✅ Provide fallbacks for older browsers
✅ Use semantic color names (primary, not blue)
✅ Test with accessibility preferences enabled

### Don'ts

❌ Hardcode color values
❌ Rely on color alone to convey information
❌ Ignore user's color scheme preference
❌ Use low contrast for decorative purposes
❌ Forget to test print styles
❌ Override user's font size preferences

## Examples

### Complete Custom Theme

```html
<!DOCTYPE html>
<html data-theme="my-edu">
<head>
  <style>
    [data-theme="my-edu"] {
      --color-primary: #4299e1;
      --color-secondary: #48bb78;
      --color-accent: #ed8936;
      --color-base-100: #f7fafc;
      --color-base-200: #edf2f7;
      --color-base-300: #cbd5e0;
      --color-base-content: #2d3748;
      --rounded-box: 1rem;
      --pie-font-family: 'Open Sans', sans-serif;
    }

    /* Element-specific overrides */
    pie-multiple-choice .choice {
      font-size: 1.125rem;
      padding: 1.25rem;
    }
  </style>
</head>
<body>
  <pie-multiple-choice></pie-multiple-choice>
</body>
</html>
```

## See Also

- [ACCESSIBILITY.md](./ACCESSIBILITY.md) - Accessibility requirements
- [USAGE.md](./USAGE.md) - Usage examples
- [DaisyUI Themes](https://daisyui.com/docs/themes/) - Official theme docs
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors) - Color reference

---

**Last Updated**: 2025-01-08
