# @pie-elements-ng/lib-a11y

Accessibility utilities and helpers for PIE elements. Ensures WCAG 2.1 AA compliance.

## Installation

```bash
bun add @pie-elements-ng/lib-a11y
```

## Usage

### Screen Reader Announcements

```typescript
import { announceToScreenReader } from '@pie-elements-ng/lib-a11y';

// Polite announcement (doesn't interrupt)
announceToScreenReader('Your answer has been saved');

// Assertive announcement (interrupts current reading)
announceToScreenReader('Error: Please answer all required questions', true);
```

### ARIA Labels

```typescript
import { getScoreAriaLabel, getFeedbackAriaLabel } from '@pie-elements-ng/lib-a11y';

const scoreLabel = getScoreAriaLabel(8, 10);
// "Score: 8 out of 10 points (80 percent)"

const feedbackLabel = getFeedbackAriaLabel(true);
// "Correct answer"
```

### Keyboard Navigation

```typescript
import { makeKeyboardNavigable, trapFocus } from '@pie-elements-ng/lib-a11y';

// Make an element keyboard accessible
const div = document.querySelector('.interactive-element');
makeKeyboardNavigable(div, () => {
  console.log('Activated via keyboard!');
});

// Trap focus within a modal
const modal = document.querySelector('.modal');
const cleanup = trapFocus(modal);
// Call cleanup() when modal closes
```

### Screen Reader Only Content

```typescript
import { createScreenReaderOnly } from '@pie-elements-ng/lib-a11y';

const srOnly = createScreenReaderOnly('This is only for screen readers');
document.body.appendChild(srOnly);
```

### Visibility Checks

```typescript
import { isVisibleToScreenReader } from '@pie-elements-ng/lib-a11y';

const element = document.querySelector('.my-element');
if (isVisibleToScreenReader(element)) {
  console.log('Element is accessible to screen readers');
}
```

### Skip Links

```typescript
import { addSkipLink } from '@pie-elements-ng/lib-a11y';

// Add a skip link to main content
const skipLink = addSkipLink('main-content', 'Skip to question');
document.body.prepend(skipLink);
```

### Keyboard Shortcuts

```typescript
import { getKeyboardShortcutLabel } from '@pie-elements-ng/lib-a11y';

const shortcut = getKeyboardShortcutLabel('S', ['ctrl', 'shift']);
// "Control + Shift + S" (Windows/Linux)
// "Command + Shift + S" (Mac)
```

### ARIA Roles

```typescript
import { getAriaRole } from '@pie-elements-ng/lib-a11y';

const role = getAriaRole('button');
element.setAttribute('role', role);
```

## CSS Classes

The library expects a `.sr-only` class for screen reader only content:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Best Practices

1. Always provide text alternatives for images and icons
2. Use semantic HTML elements when possible
3. Ensure keyboard navigation for all interactive elements
4. Provide clear focus indicators
5. Test with actual screen readers (NVDA, JAWS, VoiceOver)
6. Maintain proper heading hierarchy
7. Use ARIA labels when native labels aren't sufficient
8. Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text)

## Future Enhancements

- Automatic accessibility testing
- Color contrast calculation and validation
- Live region management
- Focus restoration utilities
- ARIA live region helpers
- Accessibility audit tools
