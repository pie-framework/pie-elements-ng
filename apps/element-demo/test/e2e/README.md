# Element Demo E2E Tests

This directory contains end-to-end browser tests for the PIE Element Demo application using Playwright.

## Overview

The test suite validates critical functionality of the demo application, including:
- Demo selection and loading
- State management across mode and role switches
- Session state persistence
- Scoring in evaluate mode
- Tab navigation and synchronization
- Source and author panel changes propagating to delivery view

## Test Files

### [math-algebra-quadratic.spec.ts](./math-algebra-quadratic.spec.ts)

Comprehensive test suite for the `math-algebra-quadratic` demo (multiple-choice element with LaTeX math). Tests cover:

1. **Demo Selection** - Selecting a demo from the dropdown and verifying it loads correctly
2. **Session State** - User selections appearing in the session state panel
3. **Mode/Role Switching** - Selections persisting across gather/view/evaluate modes and student/instructor roles
4. **Correct Answer Display** - "Show correct answer" button functionality in evaluate mode
5. **Incorrect Answer Scoring** - Score of 0 when wrong answer is selected
6. **Correct Answer Scoring** - Score of 1 when correct answer is selected
7. **Tab Navigation** - Switching between author, print, source, and deliver tabs
8. **Source Changes** - Editing JSON in source tab and seeing changes in delivery
9. **Author Changes** - Editing in author tab and seeing changes in other views
10. **Complete Workflow** - End-to-end scenario combining multiple operations

### [test-helpers.ts](./test-helpers.ts)

Reusable utility functions for tests:

- `waitForMathRendering()` - Wait for MathJax LaTeX rendering to complete
- `selectDemo()` - Select a demo from the dropdown
- `switchMode()` - Switch between gather/view/evaluate modes
- `switchRole()` - Switch between student/instructor roles
- `getSessionState()` - Get current session state from panel
- `selectMultipleChoiceOption()` - Click a multiple choice option
- `getScore()` - Get score from scoring panel
- `switchTab()` - Switch between deliver/author/print/source tabs
- `getModelFromSource()` - Get model JSON from source editor
- `updateModelInSource()` - Edit model in source editor and apply
- `waitForElementReady()` - Wait for custom element to load
- `getMultipleChoiceOptions()` - Get all available options
- `getSelectedValue()` - Get currently selected option

## Running Tests

### Prerequisites

1. Ensure Playwright browsers are installed:
   ```bash
   bunx playwright install chromium
   ```

2. Build the demo app (if needed):
   ```bash
   bun run build
   ```

### Run All Tests

```bash
# From the element-demo directory
cd apps/element-demo

# Run all tests (headless)
bun run test:e2e

# Run with UI mode (interactive)
bun run test:e2e:ui

# Run in headed mode (see browser)
bun run test:e2e:headed

# Run in debug mode (step through)
bun run test:e2e:debug
```

### Run Specific Test File

```bash
bunx playwright test math-algebra-quadratic.spec.ts
```

### Run Specific Test

```bash
bunx playwright test -g "Demo selection works correctly"
```

## Configuration

Test configuration is in [playwright.config.ts](../../playwright.config.ts):

- **Base URL**: `http://localhost:5174`
- **Browsers**: Chromium (headless)
- **Timeout**: 30 seconds per test
- **Workers**: 1 (serial execution for state management tests)
- **Web Server**: Auto-starts dev server before tests
- **Screenshots**: Only on failure
- **Videos**: Retained on failure
- **Reports**: HTML report in `test-results/playwright/`

## Test Data

The tests use the `math-algebra-quadratic` demo configuration from:
```
packages/elements-react/multiple-choice/docs/demo/config.mjs
```

This demo features:
- Single-select radio buttons (choiceMode: 'radio')
- 4 options with LaTeX math formulas
- Correct answer: `opt2` (the standard quadratic formula)
- Incorrect answers: `opt1`, `opt3`, `opt4`

## Component Test IDs

The following `data-testid` attributes are used in components:

| Component | Test ID | Purpose |
|-----------|---------|---------|
| DemoSelector | `demo-selector-button` | Open demo dropdown |
| DemoSelector | `demo-selector-dropdown` | Demo list container |
| DemoSelector | `data-demo-id="{id}"` | Individual demo buttons |
| ModeSelector | `mode-gather` | Gather mode button |
| ModeSelector | `mode-view` | View mode button |
| ModeSelector | `mode-evaluate` | Evaluate mode button |
| DeliveryPlayerLayout | `role-student` | Student role button |
| DeliveryPlayerLayout | `role-instructor` | Instructor role button |
| SessionPanel | `session-panel-content` | Session state JSON |
| ScoringPanel | `scoring-panel` | Scoring panel container |
| ScoringPanel | `score-value` | Score display |
| ModelInspector | `source-editor` | JSON editor |
| ModelInspector | `apply-changes` | Apply button |
| Tabs | `tab-deliver` | Deliver tab button |
| Tabs | `tab-author` | Author tab button |
| Tabs | `tab-print` | Print tab button |
| Tabs | `tab-source` | Source tab button |

## Troubleshooting

### Tests are failing with "Element not found"

1. Check that the dev server is running on port 5174
2. Verify the demo ID exists in the element's config.mjs
3. Ensure custom elements are registered (wait for `customElements.get()`)
4. Add waits for math rendering if LaTeX content is involved

### Tests are flaky

1. Increase timeouts in helper functions
2. Add explicit waits after state changes (`page.waitForTimeout()`)
3. Wait for network idle (`page.waitForLoadState('networkidle')`)
4. Check for race conditions in state updates

### Math rendering issues

LaTeX math takes time to render. Always use `waitForMathRendering()` after:
- Page navigation
- Tab switches
- Demo selection
- Any content update that includes LaTeX

### Session state not updating

1. Ensure sufficient wait time after selection (1000ms recommended)
2. Check that element fires `session-changed` event
3. Verify session store is properly initialized
4. Look for console errors in browser

## Best Practices

1. **Always wait for elements to be ready** - Use `waitForElementReady()` after navigation
2. **Handle math rendering** - Use `waitForMathRendering()` for LaTeX content
3. **Use test IDs over selectors** - Prefer `data-testid` over CSS classes
4. **Test one thing at a time** - Keep tests focused and independent
5. **Add descriptive assertions** - Make failures easy to understand
6. **Handle async operations** - Always await promises
7. **Clean up state** - Reset to known state in `beforeEach()`
8. **Use helper functions** - Don't repeat selectors and waits

## CI/CD Integration

The tests are configured to run in CI with:
- 2 retries on failure
- Screenshot capture on failure
- Video recording on failure
- HTML report generation

To integrate in GitHub Actions:
```yaml
- name: Install Playwright Browsers
  run: bunx playwright install --with-deps chromium

- name: Run E2E Tests
  run: cd apps/element-demo && bun run test:e2e

- name: Upload Test Results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: apps/element-demo/test-results/
```

## Writing New Tests

When adding new tests:

1. Create a new `.spec.ts` file in this directory
2. Import helpers from `test-helpers.ts`
3. Follow the existing test structure
4. Add new helper functions to `test-helpers.ts` if needed
5. Update this README with new test descriptions
6. Ensure tests can run independently

Example:
```typescript
import { test, expect } from '@playwright/test';
import { selectDemo, waitForElementReady } from './test-helpers';

test.describe('My New Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/multiple-choice/deliver');
    await waitForElementReady(page, 'pie-multiple-choice');
  });

  test('should do something', async ({ page }) => {
    await selectDemo(page, 'my-demo');
    // ... test implementation
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Element Demo Architecture](../../README.md)
- [PIE Framework Documentation](https://github.com/pie-framework/pie-elements)
