# API Reference

Complete API documentation for PIE Elements NG.

For the normative PIE element JavaScript and npm packaging contract, see
[`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md). This page provides
examples and element-specific reference detail.

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
  mode: 'gather' | 'view' | 'evaluate' | 'configure';
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
- **`configure`**: Rich editing interface for content creation (authoring mode)

**Roles:**

- **`student`**: Standard learner view
- **`instructor`**: May see additional information like rationales and answer keys

### PieModel

Base interface that all element models extend.

```typescript
// `catalog` is the QTI `support=` token and the card's only discriminant.
// QTI's single content slot is exactly one of `content` or `payload`.
interface CatalogCard {
  catalog: string;                  // e.g., "spoken", "sign-language", "braille"
  language?: string;                // BCP 47 language tag, e.g., "en-US"
  content?: string;                 // String form — SSML for "spoken", plain text
  payload?: CatalogCardPayload;     // Structured form, for what a string cannot express
}

// One generic slot, not a field per accommodation: `catalog` says how to read it.
type CatalogCardPayload = SignLanguageCardPayload;

interface SignLanguageCardPayload {
  signLang: string;                 // Adaptation language, e.g., "ase" for ASL
  media: MediaAssetRef;             // Sources, MIME types, dimensions
  fragment?: MediaFragmentRange;    // Optional time slice of a longer recording
}

// Narrowing for the write side; `isSignLanguageCard` is the runtime guard.
interface SignLanguageCatalogCard extends CatalogCard {
  catalog: 'sign-language';
  payload: SignLanguageCardPayload;
  content?: never;
}

interface AccessibilityCatalog {
  identifier: string;               // Stable ID referenced by visible content
  cards: CatalogCard[];
}

interface PieModel {
  id: string;                     // Unique identifier
  element: string;                // Element type (e.g., "@pie-element/multiple-choice")
  accessibilityCatalogs?: AccessibilityCatalog[];
}
```

Element-specific models extend this with additional properties.

`accessibilityCatalogs` is an optional, QTI-aligned contract for authored
accessibility alternatives. PIE players/toolkits can use spoken catalog entries
to replace visible model content during text-to-speech playback, for example
when visible math or abbreviated text needs a clearer spoken representation.
Individual elements are not expected to render this field directly, and default
models should omit it unless authored content provides catalog entries.

A `sign-language` card carries a signed video translation of the content node it
is docked to, as an alternate representation *alongside* the written English
rather than a replacement for it. `signLang` is the language of the adaptation
(a Spanish item's signed alternate is LSM, not ASL), so it must never be
inferred from the item's content language. Narrow a card with the exported
`isSignLanguageCard` guard; the open catalog vocabulary means TypeScript cannot
statically rule out a bare URL in `content` on a `sign-language` card, and that
legacy form is not supported. Rendering, resolution, and PNP gating belong to
the player, not to elements — see `sign-language-asl-support.md` in pie-players.

The card shape is pie-players' contract (`packages/players-shared`), restated
here structurally rather than imported, since all three repos in the chain
(this one, the Learnosity importer in pie-api-aws, and the player) read the same
authored JSON. Keep them identical: when they diverged — the payload under
`signLanguage` here and under `payload` in the player — an imported signing card
rendered in the player and was simultaneously reported as having no alternate by
the player's enumeration path.

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

Fired when model is modified (`configure` mode only).

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

Import shared types from `@pie-element/shared-types`:

```typescript
import type {
  PieEnvironment,
  PieModel,
  PieSession,
  ViewModel,
  OutcomeResult,
  PieController
} from '@pie-element/shared-types';
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
import { isEmpty, sessionsEqual } from '@pie-element/shared-utils';

// Check if a session holds no response
const empty = isEmpty(session);

// Cheap equality check, for guarding reactive effects
const unchanged = sessionsEqual(previousSession, session);
```

### Element Utilities

`assignProps` is the preferred way to pass values into PIE custom elements —
camelCase props do not map cleanly via HTML attributes, particularly for Svelte
custom elements.

```typescript
import { assignProps } from '@pie-element/shared-utils';

assignProps(element, { model, session, env });
```

`@pie-element/shared-utils` also exports `showFeedback`, `showRationale`,
`clamp`, `shuffle`, `debounce`, `uuid`, and `debug`.

### Controller Utilities

```typescript
import { getShuffledChoices, lockChoices, partialScoring } from '@pie-element/shared-controller-utils';

// Should choice order stay ordinal? Honours model.lockChoiceOrder, env, and role
if (!lockChoices(model, session, env)) {
  // Shuffle once and persist the order in the session, so it is stable across renders
  model.choices = await getShuffledChoices(model.choices, session, updateSession, 'value');
}

// Whether partial credit applies, given the model and env
const usePartial = partialScoring.enabled(model, env);
```

## Best Practices

### Type Safety

Always use TypeScript and import types:

```typescript
import type { PieEnvironment, PieSession } from '@pie-element/shared-types';
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

- [README.md](../README.md) - Getting started guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [TypeScript Definitions](../packages/shared/types/src/types.ts) - Source types

---

**Last Updated**: 2025-01-08
