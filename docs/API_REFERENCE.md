# API Reference

Complete API documentation for PIE Elements NG.

## Table of Contents

- [Core Interfaces](#core-interfaces)
- [Component Props](#component-props)
- [Controller Interface](#controller-interface)
- [Events](#events)
- [Element-Specific APIs](#element-specific-apis)

## Core Interfaces

### PieEnvironment

Defines the interaction mode and user role for element rendering.

```typescript
interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate' | 'authoring';
  role: 'student' | 'instructor';

  // Optional configuration
  lockChoiceOrder?: boolean;      // Prevent choice randomization
  partialScoring?: boolean;       // Enable partial credit scoring
}
```

**Modes:**

- **`gather`**: Interactive mode where students can answer questions
- **`view`**: Read-only mode displaying previous answers
- **`evaluate`**: Shows correctness, scoring, and feedback
- **authoring`**: Rich editing interface for content creation

**Roles:**

- **`student`**: Standard learner view
- **`instructor`**: May see additional information like rationales and answer keys

### PieModel

Base interface that all element models extend.

```typescript
interface PieModel {
  id: string;                     // Unique identifier
  element: string;                // Element type (e.g., "@pie-element/multiple-choice")
}
```

Element-specific models extend this with additional properties.

### PieSession

Represents student response data.

```typescript
interface PieSession {
  id?: string;                    // Optional session identifier
  [key: string]: unknown;         // Element-specific session data
}
```

Session structure varies by element type:

```typescript
// Multiple Choice (single)
{ value: 'a' }

// Multiple Choice (multi)
{ value: ['a', 'c'] }

// Text Entry
{ value: 'student answer' }
```

### ViewModel

Output from controller's `model()` function, ready for rendering.

```typescript
interface ViewModel {
  disabled: boolean;              // Whether interaction is disabled
  mode: PieEnvironment['mode'];   // Current mode
  [key: string]: unknown;         // Element-specific view properties
}
```

### OutcomeResult

Result from controller's `outcome()` function.

```typescript
interface OutcomeResult {
  score: number;                  // Score from 0.0 to 1.0
  empty: boolean;                 // True if no response provided
  feedback?: FeedbackConfig;      // Optional feedback messages
}
```

**Score Scale:**
- `0.0`: Completely incorrect
- `0.5`: Partially correct (if partial credit enabled)
- `1.0`: Completely correct

## Component Props

### Common Props

All PIE elements accept these props:

```typescript
interface CommonElementProps {
  model: ElementModel;            // Element configuration
  session: PieSession;            // Student response
  env: PieEnvironment;            // Interaction mode and role

  // Optional callbacks
  onSessionChange?: (session: PieSession) => void;
  onModelChange?: (model: ElementModel) => void;
}
```

### Svelte Components

```svelte
<script lang="ts">
  import { MultipleChoice } from '@pie-element/multiple-choice';

  let model = $state({...});
  let session = $state({...});
  let env = { mode: 'gather', role: 'student' };
</script>

<MultipleChoice
  {model}
  {session}
  {env}
  on:session-change={(e) => session = e.detail}
  on:model-change={(e) => model = e.detail}
/>
```

### React Components

```tsx
import { MultipleChoice } from '@pie-element/multiple-choice';

<MultipleChoice
  model={model}
  session={session}
  env={env}
  onSessionChange={setSession}
  onModelChange={setModel}
/>
```

### Web Components

```javascript
const element = document.querySelector('pie-multiple-choice');

// Set properties
element.model = {...};
element.session = {...};
element.env = {...};

// Listen to events
element.addEventListener('session-change', (e) => {
  console.log('New session:', e.detail);
});
```

## Controller Interface

Controllers handle server-side or client-side transformations and scoring.

### PieController

```typescript
interface PieController {
  model(
    question: PieModel,
    session: PieSession | null,
    env: PieEnvironment,
    updateSession?: (session: PieSession) => void
  ): Promise<ViewModel>;

  outcome(
    model: PieModel,
    session: PieSession,
    env: PieEnvironment
  ): Promise<OutcomeResult>;

  createDefaultModel(partial?: Partial<PieModel>): PieModel;

  validate(
    model: PieModel,
    config: CommonConfigSettings
  ): ValidationErrors;

  createCorrectResponseSession(
    question: PieModel,
    env: PieEnvironment
  ): PieSession;
}
```

### Controller Methods

#### `model()`

Transforms the question model into a view model based on environment.

```typescript
import { model } from '@pie-element/multiple-choice/controller';

const viewModel = await model(
  question,    // Question configuration
  session,     // Student response (or null)
  env         // Environment (mode, role)
);

// viewModel includes:
// - disabled: boolean
// - choices: transformed choice list
// - feedback: correctness indicators (in evaluate mode)
// - etc.
```

**Use cases:**
- Hide correct answers in gather mode
- Show feedback in evaluate mode
- Apply configuration options
- Randomize choices (if not locked)

#### `outcome()`

Calculate score and feedback for a session.

```typescript
import { outcome } from '@pie-element/multiple-choice/controller';

const result = await outcome(question, session, env);

console.log(result);
// {
//   score: 1.0,
//   empty: false
// }
```

**Returns:**
- `score`: 0.0 to 1.0
- `empty`: true if no answer provided
- `feedback`: optional feedback messages

#### `createDefaultModel()`

Generate a default model for a new question.

```typescript
import { createDefaultModel } from '@pie-element/multiple-choice/controller';

const model = createDefaultModel({
  id: 'q1',
  prompt: '<p>New question</p>'
});

// Returns model with sensible defaults:
// - Empty choices array
// - Default configuration
// - Required fields populated
```

#### `validate()`

Validate a model for errors.

```typescript
import { validate } from '@pie-element/multiple-choice/controller';

const errors = validate(model, config);

if (Object.keys(errors).length > 0) {
  console.error('Validation errors:', errors);
  // {
  //   'prompt': 'Prompt is required',
  //   'choices': 'At least 2 choices required'
  // }
}
```

#### `createCorrectResponseSession()`

Generate a session with the correct answer(s).

```typescript
import { createCorrectResponseSession } from '@pie-element/multiple-choice/controller';

const correctSession = createCorrectResponseSession(question, env);

// Use for testing or answer keys
const result = await outcome(question, correctSession, env);
console.log(result.score); // 1.0
```

## Events

### session-change

Fired when student response changes.

```typescript
interface SessionChangeEvent {
  detail: PieSession;
}
```

**Example:**
```javascript
element.addEventListener('session-change', (event) => {
  const session = event.detail;
  console.log('Student answered:', session.value);

  // Save to database
  saveSession(session);
});
```

### model-change

Fired when model is modified (authoring mode only).

```typescript
interface ModelChangeEvent {
  detail: ElementModel;
}
```

**Example:**
```javascript
element.addEventListener('model-change', (event) => {
  const model = event.detail;
  console.log('Model updated:', model);

  // Auto-save
  saveModel(model);
});
```

## Element-Specific APIs

### Multiple Choice

#### Model

```typescript
interface MultipleChoiceModel extends PieModel {
  prompt: string;                 // Question text (HTML)
  choices: Choice[];              // Answer choices
  choiceMode: 'radio' | 'checkbox'; // Single or multi-select
  keyMode?: 'letters' | 'numbers' | 'none'; // Choice labels

  // Feedback
  feedback?: FeedbackConfig;
  rationale?: string;             // Instructor explanation

  // Configuration
  shuffle?: boolean;              // Randomize choice order
  partialScoring?: boolean;       // Enable partial credit
  lockChoiceOrder?: boolean;      // Prevent randomization
}

interface Choice {
  label: string;                  // Choice text (HTML)
  value: string;                  // Unique identifier
  correct: boolean;               // Is this a correct answer?
  feedback?: string;              // Choice-specific feedback
}
```

#### Session

```typescript
// Single select
interface MultipleChoiceSession extends PieSession {
  value: string;                  // Selected choice value
}

// Multi-select
interface MultipleChoiceSession extends PieSession {
  value: string[];                // Array of selected values
}
```

#### Example

```typescript
const model: MultipleChoiceModel = {
  id: 'mc1',
  element: '@pie-element/multiple-choice',
  prompt: '<p>What is 2 + 2?</p>',
  choices: [
    { label: '3', value: 'a', correct: false },
    { label: '4', value: 'b', correct: true },
    { label: '5', value: 'c', correct: false }
  ],
  choiceMode: 'radio',
  keyMode: 'letters'
};
```

### Slider

#### Model

```typescript
interface SliderModel extends PieModel {
  prompt: string;                 // Question text (HTML)
  min: number;                    // Minimum value
  max: number;                    // Maximum value
  step: number;                   // Increment step
  correctAnswer: number;          // Correct value
  tolerance?: number;             // Acceptable range
}
```

#### Session

```typescript
interface SliderSession extends PieSession {
  value: number;                  // Current slider value
}
```

### Text Entry

#### Model

```typescript
interface TextEntryModel extends PieModel {
  prompt: string;                 // Question text (HTML)
  expectedLines?: number;         // Rows in textarea
  maxLength?: number;             // Character limit
  validation?: {
    allowedCharacters?: string;   // Regex pattern
    errorMessage?: string;        // Validation error text
  };
}
```

#### Session

```typescript
interface TextEntrySession extends PieSession {
  value: string;                  // Student's text input
}
```

### Hotspot

#### Model

```typescript
interface HotspotModel extends PieModel {
  prompt: string;                 // Question text (HTML)
  imageUrl: string;               // Background image
  hotspots: Hotspot[];            // Clickable areas
  multipleCorrect?: boolean;      // Allow multiple selections
}

interface Hotspot {
  id: string;
  shape: 'circle' | 'rect' | 'polygon';
  coords: number[];               // Shape coordinates
  correct: boolean;
}
```

#### Session

```typescript
interface HotspotSession extends PieSession {
  value: string[];                // IDs of selected hotspots
}
```

## Common Configuration

### ConfigSettings

```typescript
interface CommonConfigSettings {
  settingsPanelDisabled?: boolean;
  spellCheck?: ConfigureProp;
  maxImageWidth?: ConfigureProp;
  maxImageHeight?: ConfigureProp;
  withRubric?: ConfigureProp;
  language?: ConfigureProp;
  languageChoices?: ConfigureLanguageOptions;
}

interface ConfigureProp {
  settings?: boolean;             // Show in settings UI
  label?: string;                 // UI label
  enabled?: boolean;              // Currently enabled
}
```

## Type Exports

Import types from the core package:

```typescript
import type {
  PieEnvironment,
  PieModel,
  PieSession,
  ViewModel,
  OutcomeResult,
  PieController
} from '@pie-element/core';
```

Or from element-specific packages:

```typescript
import type {
  MultipleChoiceModel,
  MultipleChoiceSession,
  Choice
} from '@pie-element/multiple-choice';
```

## Utility Functions

### Session Utilities

```typescript
import { isEmptySession, validateSession } from '@pie-element/core';

// Check if session is empty
const isEmpty = isEmptySession(session);

// Validate session structure
const isValid = validateSession(session, model);
```

### Model Utilities

```typescript
import { cloneModel, mergeModels } from '@pie-element/core';

// Deep clone a model
const copy = cloneModel(model);

// Merge partial updates
const updated = mergeModels(model, { prompt: 'New prompt' });
```

## Best Practices

### Type Safety

Always use TypeScript and import types:

```typescript
import type { PieEnvironment, PieSession } from '@pie-element/core';
import type { MultipleChoiceModel } from '@pie-element/multiple-choice';

const env: PieEnvironment = { mode: 'gather', role: 'student' };
const model: MultipleChoiceModel = {...};
const session: PieSession = { value: null };
```

### Controller Usage

Use controllers for transformations and scoring:

```typescript
// ✅ Good: Use controller for scoring
import { outcome } from '@pie-element/multiple-choice/controller';
const result = await outcome(model, session, env);

// ❌ Bad: Don't calculate scores manually
const score = session.value === model.correctAnswer ? 1.0 : 0.0;
```

### Event Handling

Always handle session changes:

```typescript
// ✅ Good: Persist session changes
element.addEventListener('session-change', (e) => {
  saveSession(e.detail);
});

// ❌ Bad: Ignore session changes (data loss)
```

## See Also

- [USAGE.md](./USAGE.md) - Getting started guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [INTEGRATION.md](./INTEGRATION.md) - Framework integration
- [TypeScript Definitions](../packages/core/src/types.ts) - Source types

---

**Last Updated**: 2025-01-08
