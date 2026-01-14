# Testing Guide

This project uses Vitest with happy-dom for unit and component testing, and Playwright for end-to-end testing.

## Test Commands

### Unit & Component Tests (Vitest)

```bash
# Run all unit/component tests once
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage report
bun run test:coverage

# Run tests in a specific package
cd packages/elements-svelte/multiple-choice
bun run test
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
bun run test:e2e

# Run E2E tests in UI mode
cd apps/demos-sveltekit
bun run test:e2e:ui

# Run accessibility tests only
cd apps/demos-sveltekit
bun run test:a11y
```

## Test Environment

### happy-dom vs jsdom

This project uses **happy-dom** instead of jsdom for the following reasons:

- ✅ **Pure JavaScript** - No Node.js-specific dependencies
- ✅ **Browser-compatible** - Can run in actual browser environments
- ✅ **Faster** - Lightweight DOM implementation
- ✅ **Modern** - Better support for modern Web APIs
- ✅ **Web Components** - Works well with Custom Elements and Shadow DOM

**Important:** PIE elements are designed to run in browsers, so happy-dom is the perfect choice as it has no Node.js dependencies and can be bundled for browser use if needed.

### Configuration

The test environment is configured in:
- `vitest.config.ts` - Root Vitest configuration with happy-dom environment
- `vitest.setup.ts` - Test setup file with global test utilities

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',  // Uses happy-dom for DOM simulation
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

## Writing Tests

### Controller Tests (Pure Logic)

Controller tests test the PIE controller interface implementation without rendering components:

```typescript
import { describe, expect, it } from 'vitest';
import { model, outcome } from './controller';

describe('Multiple Choice Controller', () => {
  it('returns correct view model', async () => {
    const question = createDefaultModel();
    const session = { value: ['a'] };
    const env = { mode: 'gather', role: 'student' };

    const viewModel = await model(question, session, env);

    expect(viewModel.disabled).toBe(false);
  });
});
```

### Component Tests (Svelte + DOM)

Component tests use @testing-library/svelte with happy-dom:

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Feedback from './Feedback.svelte';

describe('Feedback', () => {
  it('renders correct feedback', () => {
    render(Feedback, { correct: true });
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

E2E tests run in real browsers via Playwright:

```typescript
import { expect, test } from '@playwright/test';

test('multiple choice element works', async ({ page }) => {
  await page.goto('/multiple-choice');
  await page.getByRole('radio', { name: 'Choice A' }).click();
  await expect(page.getByRole('radio', { name: 'Choice A' })).toBeChecked();
});
```

## Test Organization

```
packages/
├── elements-svelte/
│   └── multiple-choice/
│       ├── src/
│       │   ├── controller/
│       │   │   └── index.test.ts          # Controller logic tests
│       │   └── student/
│       │       └── MultipleChoice.test.ts # Component tests
│       └── tests/
│           └── integration.test.ts        # Integration tests
├── lib-svelte/
│   └── ui/
│       └── src/
│           ├── Feedback.test.ts           # Component tests
│           └── Prompt.test.ts             # Component tests
└── apps/
    └── demos-sveltekit/
        └── tests/
            └── e2e/
                ├── basic.spec.ts          # E2E tests
                └── accessibility.spec.ts  # A11y tests
```

## Best Practices

1. **Controller tests** should focus on business logic and PIE spec compliance
2. **Component tests** should verify rendering, accessibility, and user interactions
3. **E2E tests** should test full user workflows and cross-element interactions
4. Use **happy-dom** for unit/component tests (fast, browser-compatible)
5. Use **Playwright** for E2E tests (real browser environment)
6. All PIE elements must be **browser-compatible** - avoid Node.js-only APIs

## Continuous Integration

Tests are automatically run in CI on:
- Every pull request
- Every push to main
- Before publishing packages

The CI pipeline runs:
1. Unit/component tests via Vitest
2. E2E tests via Playwright (Chromium, Firefox, WebKit)
3. Accessibility audits via axe-core

## Troubleshooting

### Tests fail with "document is not defined"

Make sure you're using Vitest, not Bun's test runner:
```bash
# ✅ Correct - uses Vitest with happy-dom
bun run test

# ❌ Wrong - uses Bun's test runner
bun test
```

### Component tests timeout

Increase the test timeout in your test file:
```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('renders', { timeout: 10000 }, () => {
    // test code
  });
});
```

### E2E tests fail locally

Make sure Playwright browsers are installed:
```bash
cd apps/demos-sveltekit
bun playwright install
```
