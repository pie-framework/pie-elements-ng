# Contributing to PIE Elements NG Evaluations

Thank you for contributing to the PIE Elements NG evaluation system! This guide will help you write effective, maintainable evaluation specs.

## Quick Start

1. **Copy the template:**
   ```bash
   cp docs/evals/evals.template.yaml docs/evals/elements-svelte/YOUR-ELEMENT/evals.yaml
   ```

2. **Update component metadata:**
   ```yaml
   component:
     element: "@pie-element/YOUR-ELEMENT"
     framework: "svelte"  # or "react"
   ```

3. **Create sample files** (if needed):
   ```bash
   mkdir docs/evals/elements-svelte/YOUR-ELEMENT/samples
   ```

4. **Write evaluation scenarios** following the patterns in the template

5. **Validate your YAML:**
   ```bash
   bun run validate:evals  # Coming soon
   ```

6. **Run your evaluations:**
   ```bash
   bun run evals
   ```

## Writing Effective Evaluations

### 1. Start with Intent

Every evaluation should have a clear intent statement that describes what behavior is being validated:

**Good:**
```yaml
intent: "Validates that selecting correct answer in gather mode yields score of 1.0"
```

**Bad:**
```yaml
intent: "Test scoring"
```

### 2. Use Severity Appropriately

#### Use `severity: error` for:
- Core functionality requirements
- WCAG 2.2 Level AA accessibility violations
- Critical user flows
- Behaviors that MUST work for element to be usable

#### Use `severity: warn` for:
- Planned but not yet implemented features
- Nice-to-have enhancements
- Edge cases under consideration
- Features that are documented but implementation is in progress

**Example:**
```yaml
- id: "mc/simple/correct-answer"
  severity: "error"  # Must work
  intent: "Validates correct answer selection and scoring"

- id: "mc/advanced/partial-credit-with-rationale"
  severity: "warn"  # Planned feature
  intent: "Validates partial credit with per-choice rationale display"
```

### 3. Write Descriptive Target Hints

Always provide both a human-readable description and a precise selector:

**Good:**
```yaml
target:
  description: "Submit answer button"
  hint: 'button[aria-label="Submit Answer"]'
```

**Acceptable:**
```yaml
target:
  description: "Choice B radio button"
  hint: 'input[type="radio"][value="B"]'
```

**Bad:**
```yaml
target:
  description: "Button"
  hint: 'button'  # Too vague
```

### 4. Include Contextual Notes

Add notes to explain special conditions, setup requirements, or expected behaviors:

```yaml
notes:
  - "Uses radio buttons for single selection mode"
  - "Expects immediate visual feedback on selection"
  - "Score should update after clicking Submit"
  - "Assumes default configuration with no partial credit"
```

### 5. Add Spirit Checks

Spirit checks document qualitative assessment criteria that can't be automated:

```yaml
spiritChecks:
  - "Prompt language is grade-appropriate for target audience"
  - "Distractors are plausible, not obviously wrong"
  - "No tricks or confusing language"
  - "Visual feedback is clear and immediate"
  - "Instructions are concise and unambiguous"
```

### 6. Test Multiple Scenarios

For each element, create evaluations covering:

#### Basic Functionality
- Correct answer selection
- Incorrect answer selection
- No answer (empty submission)
- Multiple attempts (if applicable)

#### Different Modes
- **Gather mode**: Student interaction
- **View mode**: Read-only display of previous answer
- **Evaluate mode**: Show correctness and feedback

#### Different Roles
- **Student**: Normal interaction flow
- **Instructor**: May see additional information (rationales, correct answers)

#### Accessibility
- Keyboard navigation
- Screen reader compatibility
- Focus indicators
- Touch target sizes
- Color contrast

#### Configuration Options
- Test each significant configuration option
- Test combinations when interactions are expected

#### Error Handling
- Invalid inputs
- Missing required data
- Edge cases

### 7. Use Appropriate Actions

Choose the right action for the interaction:

```yaml
# Navigation
- action: navigate
  path: "/docs/demo/demo.html"
  params:
    mode: "gather"

# Clicking elements
- action: click
  target:
    description: "Submit button"
    hint: 'button:has-text("Submit")'

# Typing text
- action: type
  target:
    description: "Answer input"
    hint: 'input[name="answer"]'
  text: "Hello World"

# Selecting from dropdown
- action: select
  target:
    description: "Grade level"
    hint: 'select[name="grade"]'
  value: "grade-3"

# Observing state
- action: observe
  target:
    description: "Score display"
    hint: '.score-display'
  expected:
    contains: "1 / 1"

# Accessibility scanning
- action: axe
  expected:
    maxViolations: 0
    wcagLevel: "AA"

# Waiting for conditions
- action: wait
  condition: "networkidle"
  timeout: 5000

# Element-specific actions
- action: clickAt  # For hotspot
  coordinates: {x: 150, y: 200}

- action: dragSlider  # For slider
  value: 75

- action: uploadFile  # For upload
  filePath: "./samples/test.pdf"
```

## Sample Files

Sample files provide reusable element configurations:

### Creating Samples

1. Create `samples/` directory in your element's eval folder
2. Name files descriptively: `simple-choice.json`, `multi-select.json`, etc.
3. Use realistic content when possible

### Sample Format

```json
{
  "id": "mc-simple-1",
  "element": "@pie-element/multiple-choice",
  "prompt": "<p>What is 2 + 2?</p>",
  "choices": [
    {"label": "3", "value": "A", "correct": false},
    {"label": "4", "value": "B", "correct": true},
    {"label": "5", "value": "C", "correct": false},
    {"label": "6", "value": "D", "correct": false}
  ],
  "choiceMode": "radio",
  "keyMode": "letters"
}
```

### Linking to Samples

Reference samples using `sampleId`:

```yaml
evals:
  - id: "mc/simple-choice/correct"
    sampleId: "simple-choice"  # Links to samples/simple-choice.json
```

## Testing Your Evaluations

### Run Locally

```bash
# All evaluations
bun run evals

# Specific framework
bun run evals:react

# With UI
bun run evals:ui

# Headed mode (see browser)
bun run evals:headed
```

### Debug Failures

1. **Check screenshots**: `apps/examples-react/tests/evals/` (and Playwright report output)
2. **Run headed mode**: See browser interactions in real-time
3. **Check selector hints**: Inspect element in browser DevTools
4. **Add explicit waits**: Some elements need time to render

### Common Issues

#### Element Not Found
```yaml
# Add explicit wait before interacting
- action: wait
  condition: "networkidle"

- action: click
  target:
    description: "Submit button"
    hint: 'button:has-text("Submit")'
```

#### Timing Issues
```yaml
# Use specific wait conditions
- action: wait
  timeout: 2000

- action: observe
  target:
    description: "Score"
    hint: '.score'
```

#### Flaky Selectors
```yaml
# Prefer stable selectors
hint: '[data-testid="submit-btn"]'  # Good
hint: '.MuiButton-root.css-xyz123'  # Bad - generated classes
```

## Coverage Goals

Aim for comprehensive coverage across 10 dimensions:

1. **Rendering**: Element displays correctly in all modes
2. **Interactions**: User inputs work as expected
3. **Accessibility**: WCAG 2.2 AA compliance
4. **State Management**: Session and model changes propagate
5. **Scoring**: Outcomes calculated correctly
6. **Browser Compatibility**: Works in all supported browsers
7. **Performance**: Acceptable load times and responsiveness
8. **Configuration**: All config options apply correctly
9. **Error Handling**: Graceful degradation for invalid inputs
10. **Testing**: Unit tests exist and pass

### Minimum Coverage Per Element

- 3+ rendering scenarios (gather, view, evaluate modes)
- 5+ interaction scenarios (correct, incorrect, empty, edge cases)
- 2+ accessibility scenarios (axe scan, keyboard navigation)
- 3+ configuration scenarios (key options)
- 2+ error handling scenarios

**Example: 15 evaluations for Multiple Choice**
1. Renders in gather mode
2. Renders in view mode with answer
3. Renders in evaluate mode with correctness
4. Correct answer selection yields score 1.0
5. Incorrect answer yields score 0.0
6. Empty submission handling
7. Multiple selection mode (checkboxes)
8. Keyboard navigation (Tab, Space, Enter)
9. Accessibility scan (0 violations)
10. Choice prefix configuration (letters, numbers, none)
11. Layout configuration (vertical, horizontal, grid)
12. Rationale display (instructor role)
13. Disabled state (view mode)
14. Choice randomization with lockChoiceOrder
15. Invalid configuration graceful degradation

## Pull Request Checklist

Before submitting your evaluation specs:

- [ ] All evaluations have clear intent statements
- [ ] Target hints are descriptive and precise
- [ ] Notes explain special conditions
- [ ] Spirit checks document qualitative criteria
- [ ] Sample files are in `samples/` directory
- [ ] Severity levels are appropriate (error vs warn)
- [ ] Evaluations run successfully locally
- [ ] Coverage spans multiple scenarios (happy path, error path, accessibility)
- [ ] YAML is valid (no syntax errors)
- [ ] Screenshots directory is in `.gitignore`

## Style Guide

### YAML Formatting

```yaml
# Use 2-space indentation
evals:
  - id: "element/sample/scenario"
    severity: "error"

    # Group related fields
    intent: "Clear description"

    notes:
      - "First note"
      - "Second note"

    # Steps in logical order
    steps:
      - action: navigate
        path: "/element"

      - action: click
        target:
          description: "Button"
          hint: 'button'
```

### Naming Conventions

```yaml
# ID format: element/sample/scenario
id: "multiple-choice/simple-choice/correct-answer"

# Sample IDs: kebab-case
sampleId: "multi-select-with-images"

# File names: kebab-case
samples/grid-layout-horizontal.json
```

### Comments

```yaml
# Use comments to section large eval files
# ============================================================================
# Basic Rendering
# ============================================================================
- id: "mc/simple/renders"
  ...

# ============================================================================
# User Interactions
# ============================================================================
- id: "mc/simple/correct"
  ...
```

## Getting Help

- **Documentation**: See [README.md](./README.md) for system overview
- **Examples**: Look at existing evaluations in `elements-svelte/` and `elements-react/`
- **Issues**: Report problems or ask questions on GitHub Issues
- **Discussions**: Use GitHub Discussions for design questions

## Advanced Topics

### Custom Actions

If you need element-specific actions not in the standard vocabulary, document them:

```yaml
notes:
  - "Uses custom 'dragToCanvas' action for hotspot placement"
  - "See test runner implementation for details"
```

### Performance Testing

```yaml
- id: "mc/performance/load-time"
  severity: "warn"
  intent: "Validates element loads within 2 seconds"

  steps:
    - action: navigate
      path: "/docs/demo/demo.html"

    - action: wait
      condition: "networkidle"

  # Performance validation in test runner
  # Checks page.metrics() or performance.timing
```

### Multi-Element Scenarios

For cross-element integration tests:

```yaml
# docs/evals/cross-element/integration/evals.yaml
- id: "integration/multi-element/state-isolation"
  severity: "error"
  intent: "Validates multiple elements on same page maintain separate state"
```

## Resources

- [Playwright Locators](https://playwright.dev/docs/locators)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [YAML Spec](https://yaml.org/spec/1.2.2/)
