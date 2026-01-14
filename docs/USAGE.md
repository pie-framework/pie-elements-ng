# Usage Guide

Get started with PIE Elements NG in minutes. This guide covers installation, basic usage, and common integration patterns.

## Quick Start

### Installation

```bash
# Using npm
npm install @pie-element/multiple-choice

# Using bun
bun add @pie-element/multiple-choice

# Using yarn
yarn add @pie-element/multiple-choice
```

### Basic Usage

#### Svelte

```svelte
<script lang="ts">
  import { MultipleChoice } from '@pie-element/multiple-choice';

  let model = {
    prompt: '<p>What is 2 + 2?</p>',
    choices: [
      { label: '3', value: 'a', correct: false },
      { label: '4', value: 'b', correct: true },
      { label: '5', value: 'c', correct: false }
    ],
    choiceMode: 'radio'
  };

  let session = $state({ value: null });
  let env = { mode: 'gather', role: 'student' };

  function handleSessionChange(event) {
    session = event.detail;
  }
</script>

<MultipleChoice
  {model}
  {session}
  {env}
  on:session-change={handleSessionChange}
/>
```

#### React

```tsx
import { MultipleChoice } from '@pie-element/multiple-choice';
import { useState } from 'react';

function App() {
  const [session, setSession] = useState({ value: null });

  const model = {
    prompt: '<p>What is 2 + 2?</p>',
    choices: [
      { label: '3', value: 'a', correct: false },
      { label: '4', value: 'b', correct: true },
      { label: '5', value: 'c', correct: false }
    ],
    choiceMode: 'radio'
  };

  const env = { mode: 'gather', role: 'student' };

  return (
    <MultipleChoice
      model={model}
      session={session}
      env={env}
      onSessionChange={setSession}
    />
  );
}
```

#### Web Components

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '@pie-element/multiple-choice';
  </script>
</head>
<body>
  <pie-multiple-choice id="q1"></pie-multiple-choice>

  <script type="module">
    const element = document.getElementById('q1');

    element.model = {
      prompt: '<p>What is 2 + 2?</p>',
      choices: [
        { label: '3', value: 'a', correct: false },
        { label: '4', value: 'b', correct: true },
        { label: '5', value: 'c', correct: false }
      ],
      choiceMode: 'radio'
    };

    element.session = { value: null };
    element.env = { mode: 'gather', role: 'student' };

    element.addEventListener('session-change', (e) => {
      console.log('Answer:', e.detail);
    });
  </script>
</body>
</html>
```

## Understanding the PIE Architecture

### Three Core Concepts

1. **Model**: The question configuration (prompt, choices, correct answers)
2. **Session**: The student's current answer/response
3. **Environment**: The interaction mode and user role

### Environment Modes

PIE elements support different modes for different use cases:

#### `gather` Mode (Student Interaction)
Student can interact and submit answers.

```typescript
const env = { mode: 'gather', role: 'student' };
```

#### `view` Mode (Read-Only Preview)
Display a previously submitted answer without interaction.

```typescript
const env = { mode: 'view', role: 'student' };
```

#### `evaluate` Mode (Show Results)
Display correctness, feedback, and scoring.

```typescript
const env = { mode: 'evaluate', role: 'student' };
```

#### `authoring` Mode (Content Creation)
Rich editing interface for educators to create/modify questions.

```typescript
const env = { mode: 'authoring', role: 'instructor' };
```

### Roles

- **`student`**: Normal learner interaction
- **`instructor`**: May see additional information (rationales, answer keys)

## Common Patterns

### Pattern 1: Assessment Flow

```typescript
// 1. Start with gather mode
let env = $state({ mode: 'gather', role: 'student' });
let session = $state({ value: null });

// 2. Student answers
function handleAnswer(newSession) {
  session = newSession;
}

// 3. Submit for evaluation
async function submitAnswer() {
  const outcome = await evaluateAnswer(session);
  env = { mode: 'evaluate', role: 'student' };
}

// 4. Show results with feedback
```

### Pattern 2: Review Mode

```typescript
// Display previously completed questions
const env = { mode: 'view', role: 'student' };
const session = { value: 'b' }; // Previously submitted answer
```

### Pattern 3: Authoring New Content

```typescript
// Content creation interface
const env = { mode: 'authoring', role: 'instructor' };
let model = $state(createDefaultModel());

function handleModelChange(newModel) {
  model = newModel;
  // Save to database
}
```

### Pattern 4: Using the Controller

For server-side or client-side transformations:

```typescript
import { model as transformModel, outcome } from '@pie-element/multiple-choice/controller';

// Transform model based on environment
const viewModel = await transformModel(question, session, env);

// Calculate score
const result = await outcome(question, session, env);
console.log('Score:', result.score); // 0.0 to 1.0
```

## Working with Sessions

### Session Structure

Each element type has its own session structure:

```typescript
// Multiple Choice (single select)
{ value: 'b' }

// Multiple Choice (multi-select)
{ value: ['a', 'c'] }

// Text Entry
{ value: 'student answer text' }

// Number Line
{ value: [{ type: 'point', position: 5 }] }
```

### Persisting Sessions

```typescript
// Save to local storage
function saveSession(itemId: string, session: Session) {
  localStorage.setItem(`session-${itemId}`, JSON.stringify(session));
}

// Load from local storage
function loadSession(itemId: string): Session | null {
  const saved = localStorage.getItem(`session-${itemId}`);
  return saved ? JSON.parse(saved) : null;
}
```

### Session Validation

```typescript
import { validateSession } from '@pie-element/multiple-choice/controller';

const isValid = validateSession(session, model);
if (!isValid) {
  console.error('Invalid session data');
}
```

## Scoring and Outcomes

### Basic Scoring

```typescript
import { outcome } from '@pie-element/multiple-choice/controller';

const result = await outcome(model, session, env);

console.log(result);
// {
//   score: 1.0,        // 0.0 = wrong, 1.0 = correct
//   complete: true,    // Was the question answered?
//   feedback: {...}    // Optional feedback messages
// }
```

### Partial Credit

Some elements support partial credit:

```typescript
// Multi-select with partial credit enabled
const model = {
  choices: [...],
  partialScoring: true,
  scoringType: 'auto' // or 'weighted'
};

const result = await outcome(model, session, env);
// result.score might be 0.5, 0.75, etc.
```

## Theming and Styling

### Using DaisyUI Themes

PIE elements integrate with DaisyUI themes:

```html
<html data-theme="light">
  <!-- Elements automatically use theme colors -->
</html>

<html data-theme="dark">
  <!-- Dark theme applied -->
</html>
```

### Custom CSS Variables

Override specific colors:

```css
:root {
  --color-primary: #your-brand-color;
  --color-base-100: #your-background;
  --color-base-content: #your-text-color;
}
```

See [THEMING.md](./THEMING.md) for complete customization options.

## Accessibility

All PIE elements are WCAG 2.2 Level AA compliant:

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Proper ARIA labels
- ✅ Focus indicators
- ✅ Color contrast compliance

### Keyboard Shortcuts

- **Tab**: Navigate between interactive elements
- **Space/Enter**: Select choices, activate buttons
- **Arrow keys**: Navigate radio button groups
- **Escape**: Cancel dialogs

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for testing and validation.

## Available Elements

### Core Elements (Svelte)

- `@pie-element/multiple-choice` - Single/multi-select questions
- `@pie-element/slider` - Numeric input with slider
- `@pie-element/media` - Audio/video players
- `@pie-element/upload` - File upload questions

### Additional Elements (React)

- `@pie-element/hotspot` - Click areas on images
- `@pie-element/number-line` - Interactive number line
- ...and more (see [API_REFERENCE.md](./API_REFERENCE.md))

## Framework Integration

### SvelteKit

```typescript
// +page.svelte
<script lang="ts">
  import { MultipleChoice } from '@pie-element/multiple-choice';

  // SSR-safe: Element only renders on client
  let mounted = $state(false);

  $effect(() => {
    mounted = true;
  });
</script>

{#if mounted}
  <MultipleChoice {model} {session} {env} />
{/if}
```

### Next.js

```tsx
// Use dynamic import to prevent SSR
import dynamic from 'next/dynamic';

const MultipleChoice = dynamic(
  () => import('@pie-element/multiple-choice'),
  { ssr: false }
);

export default function Question() {
  return <MultipleChoice model={model} session={session} env={env} />;
}
```

### Angular

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-question',
  template: '<pie-multiple-choice [model]="model"></pie-multiple-choice>',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class QuestionComponent {
  model = { /* ... */ };
}
```

### Vue

```vue
<template>
  <pie-multiple-choice
    :model="model"
    :session="session"
    :env="env"
    @session-change="handleChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import '@pie-element/multiple-choice';

const session = ref({ value: null });
const model = { /* ... */ };
const env = { mode: 'gather', role: 'student' };

function handleChange(event) {
  session.value = event.detail;
}
</script>
```

## TypeScript Support

All packages include full TypeScript definitions:

```typescript
import type {
  Model,
  Session,
  Environment,
  Outcome
} from '@pie-element/multiple-choice';

const model: Model = {
  prompt: '<p>Question text</p>',
  choices: [/* ... */],
  choiceMode: 'radio'
};

const session: Session = { value: null };
const env: Environment = { mode: 'gather', role: 'student' };
```

## Next Steps

- [API Reference](./API_REFERENCE.md) - Complete interface documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the design
- [INTEGRATION.md](./INTEGRATION.md) - Advanced integration patterns
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [Demos](../apps/demos-sveltekit/) - Per-element demos (demo data synced from upstream)

## Getting Help

- **Documentation**: Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions in GitHub Discussions
- **Demos**: Review and run per-element demos in `apps/demos-sveltekit` (demo data is generated into `apps/demos-data`)

---

**Last Updated**: 2025-01-08
