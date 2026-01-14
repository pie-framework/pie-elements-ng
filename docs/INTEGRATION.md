# Integration Guide

This guide explains how to integrate PIE elements into your application.

## Installation

### NPM/Yarn/Bun

```bash
# Install a specific element
npm install @pie-element/multiple-choice

# Install multiple elements
npm install @pie-element/multiple-choice @pie-element/slider @pie-element/hotspot
```

### CDN (Development)

```html
<script type="module">
  import { MultipleChoice } from 'https://esm.sh/@pie-element/multiple-choice';
</script>
```

### Local ESM CDN (Development, no publishing)

If you're working on `pie-elements-ng` locally and want to test browser-native ESM loading **without publishing packages**, you can run the local ESM CDN server:

```bash
# From pie-elements-ng repo root
bun run local-esm-cdn
```

Then load packages via:

```js
import { MultipleChoice } from 'http://localhost:5179/@pie-element/multiple-choice@latest';
```

Notes:

- The server serves built artifacts from `packages/*/dist/` and rewrites external imports to `https://esm.sh/...`.
- It exposes `GET /health` for auto-detection from sibling repos (see `apps/local-esm-cdn/README.md`).
- By default it runs a targeted build first; set `LOCAL_ESM_CDN_SKIP_BUILD=1` to skip.
- Set `LOCAL_ESM_CDN_BUILD_SCOPE=all` to run the full monorepo build instead.

## Framework Integration

### Svelte / SvelteKit

Direct import and use:

```svelte
<script lang="ts">
  import { MultipleChoice } from '@pie-element/multiple-choice';

  let model = $state({
    id: '1',
    element: 'multiple-choice',
    prompt: '<p>What is 2 + 2?</p>',
    choices: [
      { label: '3', value: 'A', correct: false },
      { label: '4', value: 'B', correct: true },
      { label: '5', value: 'C', correct: false }
    ],
    choiceMode: 'radio'
  });

  let session = $state({ value: null });
  let env = $state({ mode: 'gather', role: 'student' });

  function handleSessionChange(newSession) {
    session = newSession;
    // Persist session to backend
    saveSession(newSession);
  }
</script>

<MultipleChoice
  {model}
  bind:session
  {env}
  onSessionChange={handleSessionChange}
/>
```

### React

Use React element variants:

```tsx
import { MultipleChoice } from '@pie-element/multiple-choice';
import { useState } from 'react';

export function AssessmentItem() {
  const [session, setSession] = useState({ value: null });
  const [env] = useState({ mode: 'gather', role: 'student' });

  const model = {
    id: '1',
    element: 'multiple-choice',
    prompt: '<p>What is 2 + 2?</p>',
    choices: [
      { label: '3', value: 'A', correct: false },
      { label: '4', value: 'B', correct: true },
      { label: '5', value: 'C', correct: false }
    ],
    choiceMode: 'radio'
  };

  const handleSessionChange = (newSession) => {
    setSession(newSession);
    // Persist session to backend
  };

  return (
    <MultipleChoice
      model={model}
      session={session}
      env={env}
      onSessionChange={handleSessionChange}
    />
  );
}
```

### Web Components

Standard custom elements:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@pie-element/multiple-choice-wc';

    // Get reference to element
    const element = document.getElementById('mc-1');

    // Set model
    element.model = {
      id: '1',
      element: 'multiple-choice',
      prompt: '<p>What is 2 + 2?</p>',
      choices: [
        { label: '3', value: 'A', correct: false },
        { label: '4', value: 'B', correct: true },
        { label: '5', value: 'C', correct: false }
      ],
      choiceMode: 'radio'
    };

    // Set environment
    element.env = { mode: 'gather', role: 'student' };

    // Listen for session changes
    element.addEventListener('session-change', (e) => {
      console.log('Session changed:', e.detail.session);
    });
  </script>
</head>
<body>
  <pie-multiple-choice id="mc-1"></pie-multiple-choice>
</body>
</html>
```

### Vue

```vue
<script setup>
import { MultipleChoice } from '@pie-element/multiple-choice';
import { ref } from 'vue';

const session = ref({ value: null });
const env = ref({ mode: 'gather', role: 'student' });

const model = {
  id: '1',
  element: 'multiple-choice',
  prompt: '<p>What is 2 + 2?</p>',
  choices: [
    { label: '3', value: 'A', correct: false },
    { label: '4', value: 'B', correct: true },
    { label: '5', value: 'C', correct: false }
  ],
  choiceMode: 'radio'
};

function handleSessionChange(newSession) {
  session.value = newSession;
}
</script>

<template>
  <MultipleChoice
    :model="model"
    v-model:session="session"
    :env="env"
    @session-change="handleSessionChange"
  />
</template>
```

### Angular

```typescript
import { Component } from '@angular/core';
import { MultipleChoice } from '@pie-element/multiple-choice';

@Component({
  selector: 'app-assessment',
  template: `
    <pie-multiple-choice
      [model]="model"
      [session]="session"
      [env]="env"
      (sessionChange)="handleSessionChange($event)"
    ></pie-multiple-choice>
  `
})
export class AssessmentComponent {
  model = {
    id: '1',
    element: 'multiple-choice',
    prompt: '<p>What is 2 + 2?</p>',
    choices: [
      { label: '3', value: 'A', correct: false },
      { label: '4', value: 'B', correct: true },
      { label: '5', value: 'C', correct: false }
    ],
    choiceMode: 'radio'
  };

  session = { value: null };
  env = { mode: 'gather', role: 'student' };

  handleSessionChange(newSession: any) {
    this.session = newSession;
  }
}
```

## Using Controllers

Controllers provide server-side or client-side logic for scoring and transformations.

### Scoring on Client

```typescript
import { outcome } from '@pie-element/multiple-choice/controller';

const question = {
  id: '1',
  element: 'multiple-choice',
  prompt: '<p>What is 2 + 2?</p>',
  choices: [
    { label: '3', value: 'A', correct: false },
    { label: '4', value: 'B', correct: true }
  ]
};

const session = { value: 'B' };
const env = { mode: 'evaluate', role: 'student' };

const result = await outcome(question, session, env);
console.log(result.score); // 1.0
```

### Scoring on Server (Node.js/Bun)

```typescript
import { outcome } from '@pie-element/multiple-choice/controller';

// In API endpoint
app.post('/api/score', async (req, res) => {
  const { question, session } = req.body;
  const env = { mode: 'evaluate', role: 'student' };

  const result = await outcome(question, session, env);

  res.json({
    score: result.score,
    feedback: result.feedback
  });
});
```

## Configuration Options

### Environment Modes

```typescript
interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate' | 'authoring' | 'print';
  role: 'student' | 'instructor';
}
```

**Modes**:

- `gather` - Student can interact and answer
- `view` - Read-only display, no interaction
- `evaluate` - Show score, feedback, correct answers
- `authoring` - Authoring/configuration UI
- `print` - Static rendering for paper/PDF

**Roles**:

- `student` - Learner perspective
- `instructor` - Teacher/author perspective (may show additional info)

### Element-Specific Configuration

Each element has specific model properties. See element documentation for details:

```typescript
// Example: Multiple Choice
interface MultipleChoiceModel {
  id: string;
  element: 'multiple-choice';
  prompt: string;
  choices: Array<{
    label: string;
    value: string;
    correct: boolean;
  }>;
  choiceMode: 'radio' | 'checkbox';
  keyMode?: 'numbers' | 'letters';
  shuffle?: boolean;
  feedback?: {
    correct?: string;
    incorrect?: string;
  };
}
```

## Styling and Theming

### CSS Variables

Elements use CSS variables for theming:

```css
:root {
  /* Primary colors */
  --color-primary: #3b82f6;
  --color-primary-focus: #2563eb;

  /* Base colors */
  --color-base-100: #ffffff;
  --color-base-200: #f3f4f6;
  --color-base-300: #d1d5db;
  --color-base-content: #1f2937;

  /* Semantic colors */
  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;
}
```

### Custom Theme

```css
/* Override variables for dark mode */
:root[data-theme="dark"] {
  --color-base-100: #1f2937;
  --color-base-200: #111827;
  --color-base-300: #374151;
  --color-base-content: #f3f4f6;
}
```

### DaisyUI Integration

Elements are compatible with DaisyUI themes:

```html
<html data-theme="dracula">
  <!-- Elements automatically use dracula theme -->
</html>
```

## Best Practices

### 1. Persist Sessions

Always persist session data so users don't lose answers:

```typescript
function handleSessionChange(session) {
  // Save to backend
  await fetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ itemId: model.id, session })
  });

  // Or save to localStorage for offline
  localStorage.setItem(`session-${model.id}`, JSON.stringify(session));
}
```

### 2. Handle Loading States

Show loading indicators while fetching data:

```svelte
<script>
  let loading = $state(true);
  let model = $state(null);

  onMount(async () => {
    model = await fetchQuestion();
    loading = false;
  });
</script>

{#if loading}
  <LoadingSpinner />
{:else}
  <MultipleChoice {model} ... />
{/if}
```

### 3. Error Handling

Gracefully handle errors:

```typescript
try {
  const result = await outcome(question, session, env);
  showResult(result);
} catch (error) {
  console.error('Scoring failed:', error);
  showError('Unable to score answer. Please try again.');
}
```

### 4. Accessibility

Ensure your integration maintains accessibility:

```html
<!-- Provide labels for screen readers -->
<div aria-label="Assessment Item 1">
  <MultipleChoice ... />
</div>

<!-- Announce dynamic updates -->
<div role="status" aria-live="polite">
  {#if scored}
    Your score: {score}
  {/if}
</div>
```

### 5. Performance

Lazy-load elements not immediately visible:

```typescript
// Dynamic import
const { MultipleChoice } = await import('@pie-element/multiple-choice');

// Or with Svelte lazy loading
import { lazy } from 'svelte';
const MultipleChoice = lazy(() => import('@pie-element/multiple-choice'));
```

## Troubleshooting

### Element Not Rendering

1. Check that the package is installed
2. Verify import path is correct
3. Ensure `model` has required properties
4. Check browser console for errors

### Session Not Updating

1. Verify `onSessionChange` callback is provided
2. Check that session is bound correctly (`bind:session` in Svelte)
3. Ensure session object structure is correct

### Styling Issues

1. Verify CSS is loaded (import styles if needed)
2. Check for CSS conflicts with your app's styles
3. Inspect computed styles in browser DevTools
4. Ensure CSS variables are defined

### TypeScript Errors

1. Install type definitions: `@pie-element/multiple-choice` includes types
2. Check TypeScript version (minimum 5.0)
3. Verify `tsconfig.json` has `"moduleResolution": "bundler"`

## Examples

See the demo host and examples apps for complete working examples:

- [SvelteKit demos](../apps/demos-sveltekit) - Per-element demos, theming, session flows
- [React examples](../apps/examples-react) - React integration examples

## Support

- **Documentation**: [docs/](../docs/)
- **Issues**: [GitHub Issues](https://github.com/REPO/issues)
- **Discussions**: [GitHub Discussions](https://github.com/REPO/discussions)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
