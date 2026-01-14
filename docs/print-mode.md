# Print Mode - Implementation Guide

## Overview

Print mode provides static rendering of PIE elements for paper-based assessments, answer keys, and PDF exports. Unlike the original pie-elements which used separate print components, pie-elements-ng integrates print mode into the unified component architecture.

**Status:** Optional but recommended for feature parity with original pie-elements

## Architecture Decision

### Original pie-elements Approach

- Separate print components (Web Components + React)
- Separate build process and npm publishing
- Duplicated component logic
- Located in `src/print.js` per element

### pie-elements-ng Approach (Recommended)

**Add `print` as a mode** to the unified component architecture:

```typescript
interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate' | 'authoring' | 'print';
  role: 'student' | 'instructor';
}
```

**Benefits:**
- Single component handles all modes including print
- No separate build process
- Consistent with existing architecture
- Easier maintenance
- Mode switching already implemented

## Implementation Pattern

### 1. Controller: Print Model Transformation

Add print transformation logic to the controller's model function:

```typescript
// packages/{element}/src/controller/index.ts

function preparePrintModel(model: ComponentModel, role: Role): ComponentModel {
  return {
    ...model,
    disabled: true,              // Disable all interactions
    animationsDisabled: true,    // Disable animations
    lockChoiceOrder: true,       // Lock randomization/shuffling
    alwaysShowCorrect: role === 'instructor',  // Show answers for instructors
    showRationale: role === 'instructor',      // Show rationale for instructors
    showFeedback: false,         // Hide interactive feedback
    mode: role === 'instructor' ? 'evaluate' : 'view',
  };
}

export function model(
  question: ComponentModel,
  session: SessionData | null,
  env: PieEnvironment
): ViewModel {
  // Apply print transformations if in print mode
  if (env.mode === 'print') {
    question = preparePrintModel(question, env.role);
  }

  // Continue with normal model transformation
  // ...
}
```

### 2. Component: Print Mode Rendering

Update the Svelte component to handle print mode:

```svelte
<!-- packages/{element}/src/delivery/{Element}.svelte -->
<script lang="ts">
  let { model, session, env } = $props<Props>();

  // Derived states
  const isPrintMode = $derived(env.mode === 'print');
  const isDisabled = $derived(
    env.mode === 'view' ||
    env.mode === 'evaluate' ||
    env.mode === 'print'
  );

  // Apply print-specific styling
  const containerClass = $derived(
    isPrintMode ? 'print-mode' : 'interactive-mode'
  );
</script>

<div class={containerClass} class:print={isPrintMode}>
  {#if isPrintMode}
    <!-- Print-optimized layout -->
    <div class="print-content">
      <Prompt prompt={model.prompt} />

      {#if env.role === 'instructor'}
        <!-- Show answers and rationale for instructors -->
        <AnswerKey model={model} />
        {#if model.rationale}
          <Rationale rationale={model.rationale} />
        {/if}
      {:else}
        <!-- Show questions only for students -->
        <Choices choices={model.choices} disabled={true} />
      {/if}
    </div>
  {:else}
    <!-- Normal interactive rendering -->
    <!-- ... -->
  {/if}
</div>
```

### 3. Styling: Print CSS

Create print-specific styles:

```css
/* packages/{element}/src/delivery/{Element}.css */

/* Print mode styles */
.print-mode {
  background: white;
  color: black;
  font-size: 12pt;
  line-height: 1.5;
}

/* Browser print dialog styles */
@media print {
  .print-mode {
    page-break-inside: avoid;
  }

  /* Remove interactive elements */
  .print-mode button,
  .print-mode input[type="radio"]:not(:checked),
  .print-mode input[type="checkbox"]:not(:checked) {
    display: none;
  }

  /* Show checked answers with visible indicators */
  .print-mode input[type="radio"]:checked::before,
  .print-mode input[type="checkbox"]:checked::before {
    content: '✓';
    display: inline-block;
    margin-right: 0.5em;
  }

  /* Instructor-specific print styles */
  .print-mode.role-instructor .correct-answer {
    font-weight: bold;
    text-decoration: underline;
  }

  .print-mode.role-instructor .rationale {
    margin-top: 1em;
    padding: 0.5em;
    background: #f0f0f0;
    border-left: 3px solid #333;
  }

  /* Remove unnecessary elements */
  .print-mode .toolbar,
  .print-mode .reset-button,
  .print-mode .mode-switcher {
    display: none !important;
  }
}

/* Print preview mode (for UI print preview) */
.print-mode:not(@media print) {
  border: 1px solid #ccc;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

## Use Cases

### 1. Student Worksheets

**Configuration:**
```typescript
const env: PieEnvironment = {
  mode: 'print',
  role: 'student'
};
```

**Output:**
- Questions only
- No answers visible
- No feedback
- Clean, readable layout for paper

### 2. Answer Keys

**Configuration:**
```typescript
const env: PieEnvironment = {
  mode: 'print',
  role: 'instructor'
};
```

**Output:**
- Questions with correct answers highlighted
- Rationale explanations
- Scoring information
- Full feedback

### 3. Assessment Documentation

Print for archival/compliance purposes with complete item information.

## Demo Page Integration

Add print mode controls to demo pages:

```svelte
<!-- apps/example/src/routes/{element}/+page.svelte -->
<script lang="ts">
  let env = $state<PieEnvironment>({
    mode: 'gather',
    role: 'student'
  });

  function printPreview() {
    env = { ...env, mode: 'print' };
  }

  function printToPDF() {
    env = { ...env, mode: 'print' };
    setTimeout(() => window.print(), 100);
  }
</script>

<div class="controls">
  <label>
    Mode:
    <select bind:value={env.mode}>
      <option value="gather">Gather</option>
      <option value="view">View</option>
      <option value="evaluate">Evaluate</option>
      <option value="authoring">Authoring</option>
      <option value="print">Print</option>
    </select>
  </label>

  <label>
    Role:
    <select bind:value={env.role}>
      <option value="student">Student</option>
      <option value="instructor">Instructor</option>
    </select>
  </label>

  <button onclick={printPreview}>Print Preview</button>
  <button onclick={printToPDF}>Print to PDF</button>
</div>

<ComponentElement {model} {session} {env} />
```

## Testing

### Unit Tests

```typescript
// packages/{element}/src/controller/index.test.ts

describe('Print mode', () => {
  it('disables interactions in print mode', () => {
    const model = createDefaultModel();
    const env: PieEnvironment = { mode: 'print', role: 'student' };

    const viewModel = model(model, null, env);

    expect(viewModel.disabled).toBe(true);
    expect(viewModel.lockChoiceOrder).toBe(true);
  });

  it('shows answers for instructor role', () => {
    const model = createDefaultModel();
    const env: PieEnvironment = { mode: 'print', role: 'instructor' };

    const viewModel = model(model, null, env);

    expect(viewModel.alwaysShowCorrect).toBe(true);
    expect(viewModel.showRationale).toBe(true);
  });

  it('hides answers for student role', () => {
    const model = createDefaultModel();
    const env: PieEnvironment = { mode: 'print', role: 'student' };

    const viewModel = model(model, null, env);

    expect(viewModel.alwaysShowCorrect).toBe(false);
    expect(viewModel.showRationale).toBe(false);
  });
});
```

### E2E Tests

```typescript
// packages/{element}/tests/{element}.e2e.test.ts

test('renders in print mode for students', async ({ page }) => {
  await page.goto('/{element}?mode=print&role=student');

  // Should show questions
  await expect(page.locator('.prompt')).toBeVisible();

  // Should not show answers
  await expect(page.locator('.correct-answer')).not.toBeVisible();
  await expect(page.locator('.rationale')).not.toBeVisible();

  // Should be disabled
  const input = page.locator('input').first();
  await expect(input).toBeDisabled();
});

test('renders answer key for instructors', async ({ page }) => {
  await page.goto('/{element}?mode=print&role=instructor');

  // Should show questions
  await expect(page.locator('.prompt')).toBeVisible();

  // Should show answers
  await expect(page.locator('.correct-answer')).toBeVisible();

  // Should show rationale
  await expect(page.locator('.rationale')).toBeVisible();
});

test('prints to PDF correctly', async ({ page }) => {
  await page.goto('/{element}?mode=print&role=instructor');

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: false
  });

  expect(pdf.byteLength).toBeGreaterThan(0);
});
```

## Migration from Original pie-elements

### Comparison

| Aspect | Original | pie-elements-ng |
|--------|----------|-----------------|
| **Architecture** | Separate print component | Unified component with print mode |
| **Build** | Separate build process | Same build as main component |
| **Publishing** | Separate npm package | Included in main package |
| **Maintenance** | Duplicate logic | Single source of truth |
| **Integration** | Import separate component | Pass mode='print' |

### Migration Steps

If porting from original pie-elements:

1. **Extract print transformations** from `src/print.js`
2. **Add to controller** as `preparePrintModel()` function
3. **Update component** to handle print mode rendering
4. **Port print CSS** from `esm/print.css`
5. **Update tests** to cover print mode
6. **Remove** separate print.js file

## Best Practices

### 1. Keep Print Logic Simple

```typescript
// ✅ Good: Simple, clear transformations
function preparePrintModel(model: Model, role: Role): Model {
  return {
    ...model,
    disabled: true,
    lockChoiceOrder: true,
    alwaysShowCorrect: role === 'instructor'
  };
}

// ❌ Bad: Complex, print-specific business logic
function preparePrintModel(model: Model, role: Role): Model {
  // Don't add new business logic here
  // Use existing model transformations
}
```

### 2. Role-Based Rendering

Always respect the role when showing answers:

```svelte
{#if isPrintMode && env.role === 'instructor'}
  <AnswerKey />
{/if}
```

### 3. Accessibility in Print

Ensure print output is accessible:
- Use semantic HTML
- Provide alt text for images
- Maintain logical reading order
- Use sufficient contrast

### 4. Test Both Print Modes

Always test both student and instructor print modes:
- Student: Questions only
- Instructor: Questions + answers + rationale

## Implementation Checklist

Per element:

- [ ] Add `preparePrintModel()` to controller
- [ ] Update `model()` function to handle print mode
- [ ] Add print mode rendering to component
- [ ] Create print-specific CSS
- [ ] Add `@media print` styles
- [ ] Implement role-based rendering
- [ ] Add print controls to demo page
- [ ] Write unit tests for print transformations
- [ ] Write E2E tests for print rendering
- [ ] Test browser print dialog
- [ ] Test PDF export
- [ ] Document print mode in element README

## Effort Estimate

Per element: **3-5 days**

**Breakdown:**
- Controller changes: 0.5 days
- Component updates: 1-2 days
- CSS styling: 1 day
- Testing: 1-1.5 days
- Documentation: 0.5 days

## Priority

**Medium-High** - Optional but recommended for feature parity

Print mode is expected in educational assessment platforms and provides significant value for:
- Paper-based testing
- Teacher answer keys
- Assessment documentation
- PDF exports

---

**Document Version:** 1.0
**Last Updated:** 2025-01-02
**Status:** Implementation Guide
