# Style and Visual Regression Testing

## Overview

The PIE Elements NG evaluation system includes comprehensive style and visual regression testing capabilities to ensure consistent, accessible, and professional appearance across all assessment elements.

## Why Style Testing Matters

### Consistency
- Maintain unified visual language across elements
- Ensure brand cohesion in assessment interfaces
- Prevent visual regressions during refactoring

### Accessibility
- Verify WCAG 2.2 Level AA compliance for visual elements
- Validate color contrast ratios
- Ensure touch target sizes meet standards
- Check typography readability

### Quality
- Catch layout breaks responsive designs
- Detect CSS specificity conflicts
- Validate spacing and alignment
- Ensure cross-browser visual consistency

## Testing Approaches

### 1. Computed Style Assertions

Test actual rendered CSS properties using `checkStyle` action.

**Use for:**
- Touch target sizes (WCAG 2.2: 44x44px minimum)
- Specific spacing values
- Color values
- Font properties

**Example:**
```yaml
- action: checkStyle
  target:
    description: "Radio button input"
    hint: 'input[type="radio"]'
  property: "width"
  expected:
    greaterThanOrEqual: 44  # WCAG 2.2 touch target
```

### 2. Layout Validation

Verify responsive layout behavior using `checkLayout` action.

**Use for:**
- Responsive breakpoints
- Container dimensions
- Spacing consistency
- Element positioning

**Example:**
```yaml
- action: checkLayout
  target:
    description: "Element container"
    hint: '.element-wrapper'
  expected:
    boundingBox:
      minWidth: 300
      maxWidth: 1200
    spacing:
      margin: 16
      padding: 24
```

### 3. Color Contrast Testing

Ensure text readability using `checkColorContrast` action.

**WCAG 2.2 Requirements:**
- Normal text: 4.5:1 minimum (Level AA)
- Large text (18pt+ or 14pt+ bold): 3:1 minimum
- UI components and graphics: 3:1 minimum

**Example:**
```yaml
- action: checkColorContrast
  target:
    description: "Prompt text"
    hint: '.prompt-text'
  expected:
    ratio:
      greaterThanOrEqual: 4.5  # WCAG AA for normal text
```

### 4. Typography Validation

Check font properties using `checkFont` action.

**Best Practices:**
- Font size: 16px minimum for body text
- Line height: 1.5 minimum for readability
- Font families: Use system font stacks

**Example:**
```yaml
- action: checkFont
  target:
    description: "Prompt text"
    hint: '.prompt'
  expected:
    fontSize:
      greaterThanOrEqual: 16
    lineHeight:
      greaterThanOrEqual: 1.5
    fontFamily:
      contains: "sans-serif"
```

### 5. Visual Regression Testing

Capture and compare screenshots using `screenshot` and `compareScreenshot` actions.

**Use for:**
- Detecting unintended visual changes
- Validating mode transitions (gather → view → evaluate)
- Cross-browser rendering differences
- Responsive design breakpoints

**Workflow:**

1. **Capture Baseline:**
```yaml
- action: screenshot
  target:
    description: "Element in gather mode"
    hint: '#element-root'
  name: "mc-gather-default"
```

2. **Compare Against Baseline:**
```yaml
- action: compareScreenshot
  target:
    description: "Element after changes"
    hint: '#element-root'
  name: "mc-gather-default"
  threshold: 0.05  # 5% difference tolerance
```

## Style Testing Checklist

For each PIE element, verify:

### Typography
- [ ] Font sizes are 16px minimum for body text
- [ ] Line height is 1.5 or greater
- [ ] Headings use appropriate hierarchy (h1-h6)
- [ ] Font weights provide sufficient contrast
- [ ] Text is left-aligned (or right for RTL)

### Color & Contrast
- [ ] Text/background contrast ≥ 4.5:1
- [ ] UI component contrast ≥ 3:1
- [ ] Links are distinguishable without color alone
- [ ] Error states use color + icons/text
- [ ] Success states use color + icons/text

### Spacing & Layout
- [ ] Consistent margin/padding scale (4px, 8px, 16px, 24px, 32px)
- [ ] Touch targets are 44x44px minimum
- [ ] Adequate white space between interactive elements
- [ ] Content is readable within 300-1200px width
- [ ] No horizontal scrolling at standard viewports

### Responsive Design
- [ ] Mobile: 320px - 767px
- [ ] Tablet: 768px - 1023px
- [ ] Desktop: 1024px+
- [ ] Text reflows properly at all breakpoints
- [ ] Interactive elements remain usable at all sizes

### Interactive States
- [ ] Hover states are visually distinct
- [ ] Focus indicators are clearly visible (2px minimum)
- [ ] Active/pressed states provide feedback
- [ ] Disabled states are visually muted
- [ ] Selected states are clearly indicated

### Mode-Specific Rendering
- [ ] **Gather mode:** Editable, clear interaction affordances
- [ ] **View mode:** Read-only, submitted answers visible
- [ ] **Evaluate mode:** Correct/incorrect indicators, feedback display
- [ ] **Configure mode:** Authoring UI clearly distinct

## Integration with Existing Tests

Style tests complement other evaluation dimensions:

### With Accessibility Tests
```yaml
steps:
  - action: axe
    expected:
      maxViolations: 0
      wcagLevel: "AA"

  - action: checkColorContrast
    target:
      description: "Prompt text"
      hint: '.prompt'
    expected:
      ratio:
        greaterThanOrEqual: 4.5

  - action: checkStyle
    target:
      description: "Radio button"
      hint: 'input[type="radio"]'
    property: "width"
    expected:
      greaterThanOrEqual: 44
```

### With Interaction Tests
```yaml
steps:
  - action: click
    target:
      description: "Choice A"
      hint: 'input[value="A"]'

  - action: screenshot
    target:
      description: "Element after selection"
      hint: '#element-root'
    name: "mc-choice-selected"

  - action: checkStyle
    target:
      description: "Selected choice"
      hint: 'input[value="A"]:checked + label'
    property: "backgroundColor"
    expected:
      exists: true
```

## Baseline Management

### Creating Baselines

Run tests with `UPDATE_SNAPSHOTS=true` to create/update baselines:

```bash
UPDATE_SNAPSHOTS=true bun run evals:react
```

Baselines stored in:
- `apps/examples-react/tests/evals/__screenshots__/`
 

### Reviewing Changes

When tests fail due to visual differences:

1. Review diff images in test reports
2. Determine if change is intentional
3. Update baseline if approved
4. Commit new screenshots with descriptive message

### Baseline Naming Convention

```
{element}-{sample}-{mode}-{scenario}.png
```

Examples:
- `mc-simple-choice-gather-default.png`
- `mc-simple-choice-evaluate-correct.png`
- `hotspot-default-gather-selected.png`

## Browser-Specific Testing

Run visual tests across browsers:

```yaml
- id: "mc-svelte/simple-choice/visual-chrome"
  severity: "error"
  intent: "Validates consistent rendering in Chrome"
  # ... steps

- id: "mc-svelte/simple-choice/visual-firefox"
  severity: "warn"  # Less strict for Firefox differences
  intent: "Validates acceptable rendering in Firefox"
  # ... steps

- id: "mc-svelte/simple-choice/visual-safari"
  severity: "warn"  # Less strict for Safari differences
  intent: "Validates acceptable rendering in Safari"
  # ... steps
```

## Performance Considerations

### Screenshot Best Practices

- Use element-level screenshots (not full page) when possible
- Set reasonable thresholds (5-10%) for anti-aliasing differences
- Skip visual regression for rapidly changing UI areas
- Run visual tests in headed mode for consistency

### Optimization

```yaml
# Fast: Computed style check
- action: checkStyle
  target:
    description: "Button"
    hint: 'button'
  property: "backgroundColor"
  expected:
    equals: "rgb(59, 130, 246)"

# Slow: Screenshot comparison
- action: compareScreenshot
  target:
    description: "Button"
    hint: 'button'
  name: "button-baseline"
  threshold: 0.1
```

## Common Style Issues and Fixes

### Issue: Touch Targets Too Small

**Test:**
```yaml
- action: checkStyle
  target:
    description: "Radio button"
    hint: 'input[type="radio"]'
  property: "width"
  expected:
    greaterThanOrEqual: 44
```

**Fix:**
```css
input[type="radio"] {
  width: 44px;
  height: 44px;
  /* Or use padding on label */
}
```

### Issue: Insufficient Color Contrast

**Test:**
```yaml
- action: checkColorContrast
  target:
    description: "Prompt text"
    hint: '.prompt'
  expected:
    ratio:
      greaterThanOrEqual: 4.5
```

**Fix:**
- Use color contrast checker tools
- Darken text or lighten background
- Aim for 7:1 for AAA compliance

### Issue: Inconsistent Spacing

**Test:**
```yaml
- action: checkStyle
  target:
    description: "Choice item"
    hint: '.choice-item'
  property: "marginBottom"
  expected:
    equals: "16px"
```

**Fix:**
- Define spacing scale (4, 8, 16, 24, 32px)
- Use CSS custom properties
- Apply consistently across elements

## Next Steps

1. **Implement test runner support** for new style actions
2. **Create baseline screenshots** for all React examples
3. **Add style tests** to Multiple Choice Svelte evals
4. **Run and fix** any discovered style issues
5. **Document patterns** for other elements to follow
