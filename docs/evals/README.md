# PIE Elements NG - Evaluation System

## Overview

The PIE Elements NG evaluation system provides comprehensive, YAML-driven testing for all assessment elements. Inspired by [pie-qti](https://github.com/pie-framework/pie-qti) and [pie-players](https://github.com/pie-framework/pie-players), this system enables declarative test specifications that are easy to author, review, and maintain.

## Philosophy

### Intent-First Evaluation

Tests document **intended behavior** first, actual implementation second. This approach:

- Enables planning test scenarios before implementation
- Supports AI-assisted test authoring
- Makes test intent clear to non-developers
- Allows marking scenarios as `warn` severity when not yet implemented

### Event-Driven Validation

Tests validate **observable contracts** (DOM state, events, outcomes) rather than internal implementation details. This makes tests:

- More resilient to refactoring
- Framework-agnostic (works for both Svelte and React)
- Focused on user-visible behavior
- Aligned with PIE element architecture

### Accessibility-Native

Accessibility testing is built-in, not bolted on. Every evaluation can include:

- axe-core WCAG 2.2 Level AA scans
- Keyboard navigation validation
- Screen reader compatibility checks
- Touch target size verification

## System Architecture

### Directory Structure

```
docs/evals/
├── README.md                    # This file
├── schema.json                  # JSON schema for YAML validation
├── evals.template.yaml          # Template for authoring new evals
├── CONTRIBUTING.md              # Guide for writing evals
│
├── elements-svelte/             # Svelte element evaluations
│   ├── multiple-choice/
│   │   ├── evals.yaml
│   │   └── samples/
│   │       ├── simple-choice.json
│   │       └── multi-select.json
│   ├── slider/
│   ├── media/
│   └── upload/
│
├── elements-react/              # React element evaluations
│   ├── multiple-choice/
│   ├── hotspot/
│   └── number-line/
│
└── cross-element/               # Cross-cutting concerns
    ├── accessibility/
    ├── performance/
    └── integration/
```

### Test Runners

Playwright test runners execute YAML specifications:

- `apps/examples-react/tests/evals/evals-runner.spec.ts` - React elements

### YAML Format (Version 1)

Evaluation files use a declarative YAML format:

```yaml
version: 1

component:
  element: "@pie-element/multiple-choice"
  framework: "svelte"
  tagName: "pie-multiple-choice"

examplesApp:
  app: "@pie-demos/sveltekit"
  routeTemplate: "/demos/<tagName>"

evals:
  - id: "mc-svelte/simple-choice/correct"
    sampleId: "simple-choice"
    severity: "error"

    intent: "Validates correct answer selection yields score of 1.0"

    notes:
      - "Uses radio buttons for single selection"
      - "Expects immediate visual feedback"

    steps:
      - action: navigate
        path: "/demos/multiple-choice"
        params:
          sampleId: "simple-choice"
          mode: "gather"

      - action: click
        target:
          description: "Choice A (correct answer)"
          hint: 'input[type="radio"][value="A"]'

      - action: click
        target:
          description: "Submit button"
          hint: 'button:has-text("Submit")'

      - action: axe
        expected:
          maxViolations: 0
          wcagLevel: "AA"

    expected:
      session:
        value:
          equals: "A"
      outcome:
        score:
          equals: 1.0
```

## Action Vocabulary

### Core Actions

#### `navigate`
Navigate to a route with optional query parameters.

```yaml
- action: navigate
  path: "/demos/multiple-choice"
  params:
    sampleId: "simple-choice"
    mode: "gather"
    role: "student"
```

#### `click`
Click on an element using description and selector hint.

```yaml
- action: click
  target:
    description: "Submit button"
    hint: 'button:has-text("Submit")'
```

#### `type`
Type text into an input field.

```yaml
- action: type
  target:
    description: "Answer input"
    hint: 'input[name="answer"]'
  text: "Hello World"
```

#### `select`
Select an option from a dropdown.

```yaml
- action: select
  target:
    description: "Grade level dropdown"
    hint: 'select[name="grade"]'
  value: "grade-3"
```

#### `observe`
Assert that an element exists and optionally matches expected content.

```yaml
- action: observe
  target:
    description: "Score display"
    hint: '.score-display'
  expected:
    contains: "1 / 1"
```

#### `wait`
Wait for a condition or duration.

```yaml
- action: wait
  condition: "networkidle"  # or "load", "domcontentloaded"
  timeout: 5000
```

#### `axe`
Run accessibility scan with axe-core.

```yaml
- action: axe
  expected:
    maxViolations: 0
    wcagLevel: "AA"  # or "A", "AAA"
```

#### `dispatchEvent`
Dispatch a custom event on an element.

```yaml
- action: dispatchEvent
  target:
    description: "Element container"
    hint: '#element-root'
  eventName: "session-changed"
  detail:
    value: "new-answer"
```

### Element-Specific Actions

#### `clickAt` (Hotspot)
Click at specific coordinates on canvas.

```yaml
- action: clickAt
  target:
    description: "Hotspot canvas"
    hint: 'canvas'
  coordinates:
    x: 150
    y: 200
```

#### `dragSlider` (Slider)
Change slider value by dragging.

```yaml
- action: dragSlider
  target:
    description: "Slider handle"
    hint: 'input[type="range"]'
  value: 75
```

#### `uploadFile` (Upload)
Select file for upload.

```yaml
- action: uploadFile
  target:
    description: "File input"
    hint: 'input[type="file"]'
  filePath: "./samples/test-image.png"
```

#### `playMedia` (Media)
Control media playback.

```yaml
- action: playMedia
  target:
    description: "Video player"
    hint: 'video'
  command: "play"  # or "pause", "seekTo"
  seekTime: 30  # optional, for seekTo
```

### Style and Visual Regression Actions

#### `screenshot`

Capture screenshot for visual regression testing.

```yaml
- action: screenshot
  target:
    description: "Multiple choice element"
    hint: '.pie-multiple-choice'
  name: "mc-gather-mode-default"
  fullPage: false
```

#### `compareScreenshot`

Compare current screenshot against baseline.

```yaml
- action: compareScreenshot
  target:
    description: "Element container"
    hint: '#element-root'
  name: "mc-evaluate-correct"
  threshold: 0.1  # 10% difference tolerance
```

#### `checkStyle`

Assert computed CSS properties.

```yaml
- action: checkStyle
  target:
    description: "Choice radio button"
    hint: 'input[type="radio"]'
  property: "width"
  expected:
    greaterThanOrEqual: 44  # WCAG 2.2 touch target
```

#### `checkLayout`

Validate responsive layout properties.

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

#### `checkColorContrast`

Verify color contrast ratios meet WCAG standards.

```yaml
- action: checkColorContrast
  target:
    description: "Prompt text"
    hint: '.prompt-text'
  expected:
    ratio:
      greaterThanOrEqual: 4.5  # WCAG AA for normal text
```

#### `checkFont`

Validate typography properties.

```yaml
- action: checkFont
  target:
    description: "Prompt text"
    hint: '.prompt'
  expected:
    fontSize:
      greaterThanOrEqual: 16  # Minimum readable size
    lineHeight:
      greaterThanOrEqual: 1.5  # WCAG recommendation
    fontFamily:
      contains: "sans-serif"
```

## Matchers

Expected values use matchers for flexible assertions:

### `equals`
Exact equality check.

```yaml
expected:
  score:
    equals: 1.0
```

### `contains`
String or array contains check.

```yaml
expected:
  text:
    contains: "Correct"
```

### `exists`
Element or property existence.

```yaml
expected:
  element:
    exists: true
```

### `greaterThan` / `lessThan`
Numeric comparisons.

```yaml
expected:
  score:
    greaterThan: 0.5
```

### `matches`
Regular expression match.

```yaml
expected:
  text:
    matches: "^Score: \\d+$"
```

## Severity Levels

### `error`
Test must pass. Failure blocks acceptance.

Use for:
- Core functionality requirements
- Accessibility violations
- Critical user flows

### `warn`
Test documents intent but failure doesn't block.

Use for:
- Planned but not yet implemented features
- Nice-to-have enhancements
- Edge cases under consideration

## Coverage Dimensions

Evaluations should cover these 11 dimensions:

1. **Rendering** - Component displays correctly in all modes
2. **Interactions** - User inputs work as expected
3. **Accessibility** - WCAG 2.2 AA compliance (keyboard nav, screen readers, ARIA)
4. **Style & Visual** - Typography, layout, color contrast, responsive design, visual regression
5. **State Management** - Session and model changes propagate
6. **Scoring** - Outcomes calculated correctly
7. **Browser Compatibility** - Works in Chrome, Firefox, Safari
8. **Performance** - Load time, memory usage, responsiveness
9. **Configuration** - All config options apply correctly
10. **Error Handling** - Graceful degradation for invalid inputs
11. **Testing** - Unit tests exist and pass

## Sample Files

Sample files provide reusable element configurations:

**`docs/evals/elements-svelte/multiple-choice/samples/simple-choice.json`**
```json
{
  "id": "mc-simple-1",
  "element": "@pie-element/multiple-choice",
  "prompt": "<p>What is 2 + 2?</p>",
  "choices": [
    { "label": "3", "value": "A", "correct": false },
    { "label": "4", "value": "B", "correct": true },
    { "label": "5", "value": "C", "correct": false },
    { "label": "6", "value": "D", "correct": false }
  ],
  "choiceMode": "radio",
  "keyMode": "letters"
}
```

Link to samples using `sampleId` in eval specs:

```yaml
evals:
  - id: "mc-svelte/simple-choice/correct"
    sampleId: "simple-choice"  # References simple-choice.json
```

## Running Evaluations

### All Elements

```bash
bun run evals
```

### Specific Framework

```bash
bun run evals:react
```

### With UI

```bash
bun run evals:ui
```

### Headed Mode

```bash
bun run evals:headed
```

### Filter by Severity

```bash
# Only run error-level tests
bun run evals -- --grep "@error"

# Run all including warnings
bun run evals -- --grep "@error|@warn"
```

### Specific Element

```bash
cd apps/examples-react
bun run test:evals tests/evals/evals-runner.spec.ts -g "multiple-choice"
```

## CI Integration

Evaluations run on-demand via GitHub Actions:

```bash
# Trigger manually from Actions tab
# Or via CLI:
gh workflow run evals.yml
```

Evaluation reports are uploaded as artifacts and accessible from workflow runs.

## Writing New Evaluations

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guide.

Quick start:

1. Copy `evals.template.yaml` to your element directory
2. Fill in component metadata
3. Create sample JSON files if needed
4. Write evaluation scenarios with clear intent
5. Start with `severity: warn` until implementation complete
6. Run locally to validate YAML and test logic
7. Mark `severity: error` when ready to enforce

## Best Practices

### Write Clear Intent Statements

Good:
```yaml
intent: "Validates that selecting correct answer yields score of 1.0"
```

Bad:
```yaml
intent: "Test scoring"
```

### Use Descriptive Target Hints

Good:
```yaml
target:
  description: "Submit button"
  hint: 'button:has-text("Submit")'
```

Bad:
```yaml
target:
  description: "Button"
  hint: 'button'
```

### Include Notes for Context

```yaml
notes:
  - "Uses radio buttons for single selection"
  - "Expects SCORE = 1.0 for correct choice"
  - "Should show green checkmark in evaluate mode"
```

### Add Spirit Checks

Spirit checks document qualitative assessment criteria:

```yaml
spiritChecks:
  - "Prompt is grade-appropriate for target audience"
  - "Distractors are plausible, not obviously wrong"
  - "No tricks or confusing language"
  - "Clear visual feedback on selection"
```

### Test Both Happy and Error Paths

Include scenarios for:
- Correct answers
- Incorrect answers
- No answer submitted
- Invalid inputs
- Edge cases

### Validate Accessibility

Every eval should include at least one axe scan:

```yaml
- action: axe
  expected:
    maxViolations: 0
    wcagLevel: "AA"
```

## Troubleshooting

### YAML Validation Errors

Validate against JSON schema:

```bash
bun run validate:evals
```

### Flaky Tests

Use explicit waits:

```yaml
- action: wait
  condition: "networkidle"
```

Avoid brittle selectors - prefer text content over class names.

### Element Not Found

Check that:
1. Route is correct in `navigate` action
2. Element has rendered (may need `wait` action)
3. Selector hint is accurate (inspect in browser)

### Accessibility Violations

Review axe-core output in test report:
- Identify specific violation
- Check WCAG reference
- Fix in element implementation
- Re-run eval

## Schema Validation

All YAML files are validated against [`schema.json`](./schema.json). This ensures:

- Required fields are present
- Action vocabulary is followed
- Matchers are valid
- Severity levels are correct

## Further Reading

- [pie-qti Evaluation System](https://github.com/pie-framework/pie-qti/tree/main/docs/evals)
- [pie-players Evaluation Docs](https://github.com/pie-framework/pie-players/tree/main/docs/evals)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
