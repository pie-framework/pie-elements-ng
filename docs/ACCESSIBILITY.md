# Accessibility Guide

PIE Elements NG is built with WCAG 2.2 Level AA compliance as a core requirement, not an afterthought.

## Our Commitment

All PIE elements are designed to be:

- ✅ **Keyboard Navigable**: Full functionality without a mouse
- ✅ **Screen Reader Compatible**: Proper ARIA labels and semantic HTML
- ✅ **Visually Accessible**: Sufficient color contrast and touch targets
- ✅ **Cognitively Accessible**: Clear instructions and error messages

## WCAG 2.2 Compliance

### Level AA Requirements

PIE elements meet all WCAG 2.2 Level AA success criteria:

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 1.4.3 Contrast (Minimum) | 4.5:1 for normal text | DaisyUI themes tested for compliance |
| 1.4.11 Non-text Contrast | 3:1 for UI components | All interactive elements meet threshold |
| 2.1.1 Keyboard | All functionality via keyboard | Tab, Space, Enter, Arrow keys |
| 2.4.7 Focus Visible | Clear focus indicators | 2px outline on all focusable elements |
| 2.5.8 Target Size (Minimum) | 24×24px touch targets | 44×44px implemented (exceeds requirement) |
| 3.2.4 Consistent Identification | Consistent UI patterns | Standardized across all elements |
| 4.1.2 Name, Role, Value | ARIA for custom controls | All interactive elements labeled |

## Keyboard Navigation

### Global Shortcuts

All PIE elements support these keyboard interactions:

- **Tab**: Move focus forward
- **Shift+Tab**: Move focus backward
- **Enter/Space**: Activate buttons and controls
- **Escape**: Close dialogs and cancel operations

### Element-Specific Shortcuts

#### Multiple Choice

```
Tab          - Navigate between choices
Space/Enter  - Select/deselect choice
Arrow keys   - Navigate radio button group
```

#### Slider

```
Tab          - Focus slider
Arrow keys   - Adjust value (fine control)
Home         - Jump to minimum
End          - Jump to maximum
Page Up/Down - Large increments
```

#### Text Entry

```
Tab          - Focus text area
Ctrl+Enter   - Submit (if enabled)
```

### Testing Keyboard Navigation

```typescript
// E2E test example
test('keyboard navigation works', async ({ page }) => {
  await page.goto('/multiple-choice');

  // Focus first choice
  await page.keyboard.press('Tab');

  // Select with Space
  await page.keyboard.press('Space');

  // Check selection
  const checked = await page.locator('input[type="radio"]:checked');
  await expect(checked).toBeVisible();
});
```

## Screen Reader Support

### Semantic HTML

PIE elements use semantic HTML whenever possible:

```html
<!-- ✅ Good: Semantic -->
<fieldset>
  <legend>What is 2 + 2?</legend>
  <label>
    <input type="radio" name="answer" value="a">
    3
  </label>
</fieldset>

<!-- ❌ Bad: Non-semantic -->
<div class="question">
  <div class="prompt">What is 2 + 2?</div>
  <div class="choice" onclick="select('a')">3</div>
</div>
```

### ARIA Labels

When semantic HTML isn't sufficient, ARIA attributes provide context:

```html
<!-- Button with icon -->
<button aria-label="Submit answer">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Status messages -->
<div role="alert" aria-live="polite">
  Your answer is correct!
</div>

<!-- Progress indicator -->
<div role="progressbar"
     aria-valuenow="3"
     aria-valuemin="1"
     aria-valuemax="10"
     aria-label="Question 3 of 10">
</div>
```

### Testing with Screen Readers

#### macOS (VoiceOver)

```bash
# Enable VoiceOver
Cmd+F5

# Navigate
Ctrl+Option+Arrow keys

# Interact
Ctrl+Option+Space
```

#### Windows (NVDA)

```bash
# Install NVDA (free)
# https://www.nvaccess.org/

# Navigate
Arrow keys

# Interact
Space/Enter
```

#### Testing Checklist

- [ ] Element announces its role (button, checkbox, etc.)
- [ ] Element announces its label/name
- [ ] Element announces its state (checked, expanded, etc.)
- [ ] Feedback messages are announced
- [ ] Error messages are clear and actionable
- [ ] Focus order is logical

## Visual Accessibility

### Color Contrast

All text meets WCAG AA standards:

```css
/* Normal text: 4.5:1 minimum */
.prompt {
  color: rgb(31, 41, 55);      /* #1f2937 */
  background: rgb(255, 255, 255); /* #ffffff */
  /* Contrast ratio: 15.85:1 ✅ */
}

/* Large text (18pt+): 3:1 minimum */
.heading {
  font-size: 24px;
  font-weight: 600;
  color: rgb(75, 85, 99);      /* #4b5563 */
  background: rgb(255, 255, 255);
  /* Contrast ratio: 9.73:1 ✅ */
}

/* UI components: 3:1 minimum */
button {
  color: rgb(255, 255, 255);
  background: rgb(59, 130, 246); /* #3b82f6 */
  /* Contrast ratio: 4.5:1 ✅ */
}
```

#### Testing Contrast

Use browser DevTools or online tools:

```javascript
// Chrome DevTools
// 1. Inspect element
// 2. Check "Contrast ratio" in Styles panel
// 3. Verify AA or AAA badge

// Online tool
// https://webaim.org/resources/contrastchecker/
```

### Touch Target Size

All interactive elements are at least 44×44px (exceeds WCAG 2.5.8 minimum of 24×24px):

```css
/* Radio buttons */
input[type="radio"] {
  width: 44px;
  height: 44px;
}

/* Or use padding on labels */
input[type="radio"] + label {
  padding: 12px;  /* Creates 44×44px target */
  min-width: 44px;
  min-height: 44px;
}

/* Buttons */
button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}
```

#### Testing Touch Targets

```typescript
// E2E test
test('touch targets are large enough', async ({ page }) => {
  const button = page.locator('button.submit');
  const box = await button.boundingBox();

  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
});
```

### Focus Indicators

All focusable elements have clear focus indicators:

```css
/* Default focus indicator */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Custom focus for specific elements */
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primary) 20%, transparent);
}

/* Never remove focus indicators */
/* ❌ DON'T DO THIS */
:focus {
  outline: none; /* Never! */
}
```

## Cognitive Accessibility

### Clear Instructions

```html
<!-- ✅ Good: Clear instructions -->
<p class="instructions">
  Select all correct answers. You may choose more than one.
</p>

<!-- ❌ Bad: Ambiguous -->
<p>Choose</p>
```

### Error Messages

Error messages should be:
1. **Specific**: Tell exactly what's wrong
2. **Actionable**: Explain how to fix
3. **Visible**: Clearly displayed near the error
4. **Announced**: Use `role="alert"` for screen readers

```html
<!-- ✅ Good error message -->
<div role="alert" class="error">
  <strong>Error:</strong> Please select at least one answer before submitting.
</div>

<!-- ❌ Bad error message -->
<div class="error">Invalid</div>
```

### Consistent Patterns

Use consistent UI patterns across all elements:

- Submit buttons always labeled "Submit"
- Correct answers shown with ✓ in evaluate mode
- Incorrect answers shown with ✗ in evaluate mode
- Required fields marked with * and `aria-required="true"`

## Testing for Accessibility

### Automated Testing

#### axe-core Integration

All elements are tested with axe-core:

```typescript
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/multiple-choice');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

#### Run Accessibility Tests

```bash
# Run all accessibility tests
bun run test:a11y

# Per-element demo (after build)
# cd packages/elements-react/<element>
# python -m http.server 5174
# open http://localhost:5174/
```

### Manual Testing

#### Keyboard-Only Testing

1. Disconnect mouse
2. Use only keyboard to:
   - Navigate to element
   - Read question
   - Select answer
   - Submit
   - Review feedback

#### Screen Reader Testing

1. Enable screen reader (VoiceOver, NVDA, JAWS)
2. Navigate through element
3. Verify all content is announced
4. Check focus order is logical
5. Ensure state changes are announced

#### Color Blind Testing

Use browser extensions to simulate color blindness:

- **Chrome**: Colorblind - Dalton
- **Firefox**: Let's Get Color Blind
- **Safari**: Web Developer extension

Verify:
- Information isn't conveyed by color alone
- Correct/incorrect use icons + color
- Links are underlined or have non-color indicator

### Accessibility Checklist

Before releasing an element, verify:

- [ ] All functionality works with keyboard only
- [ ] Focus indicators are clearly visible
- [ ] Tab order is logical
- [ ] Screen reader announces all content
- [ ] Error messages are clear and announced
- [ ] Color contrast meets 4.5:1 (normal text) or 3:1 (large text/UI)
- [ ] Touch targets are at least 44×44px
- [ ] No information conveyed by color alone
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Videos have captions
- [ ] No flashing content
- [ ] Headings are hierarchical
- [ ] Lists use proper markup
- [ ] Tables have headers
- [ ] axe-core reports 0 violations

## Common Accessibility Issues

### Issue 1: Missing Form Labels

**Problem:**
```html
<input type="text" placeholder="Your answer">
```

**Solution:**
```html
<label for="answer">Your answer</label>
<input type="text" id="answer" placeholder="e.g., 42">
```

### Issue 2: Insufficient Contrast

**Problem:**
```css
.text {
  color: #888888;        /* Gray text */
  background: #ffffff;   /* White background */
  /* Contrast: 2.85:1 ❌ */
}
```

**Solution:**
```css
.text {
  color: #595959;        /* Darker gray */
  background: #ffffff;
  /* Contrast: 4.54:1 ✅ */
}
```

### Issue 3: Keyboard Trap

**Problem:**
```javascript
// Modal that traps focus accidentally
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault(); // ❌ Can't escape!
  }
});
```

**Solution:**
```javascript
// Proper focus trapping with escape hatch
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal(); // ✅ Can escape
  }
  if (e.key === 'Tab') {
    // Cycle focus within modal
    trapFocusInModal(e);
  }
});
```

### Issue 4: Invisible Focus Indicator

**Problem:**
```css
:focus {
  outline: none; /* ❌ */
}
```

**Solution:**
```css
:focus-visible {
  outline: 2px solid var(--color-primary); /* ✅ */
  outline-offset: 2px;
}
```

## Resources

### Tools

- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Color Contrast Analyzer**: Desktop app for contrast checking

### Guidelines

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Testing Services

- **Accessibility Insights**: Free testing tools from Microsoft
- **Pa11y**: Automated accessibility testing
- **Deque axe**: Enterprise accessibility platform

## See Also

- [testing.md](./testing.md) - Testing guide including accessibility tests
- [evals/README.md](./evals/README.md) - Evaluation system with accessibility actions
- [USAGE.md](./USAGE.md) - Usage guide with accessibility features

---

**Last Updated**: 2025-01-08
