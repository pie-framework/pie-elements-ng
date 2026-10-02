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
  mode: 'gather' | 'view' | 'evaluate';
  role: 'student' | 'instructor';

  // Optional configuration
  partialScoring?: boolean;       // false disables partial credit scoring
  '@pie-element'?: {
    lockChoiceOrder?: boolean;    // true keeps the authored choice order
  };
}
```

**Modes:**

- **`gather`**: Interactive mode where students can answer questions
- **`view`**: Read-only mode displaying previous answers
- **`evaluate`**: Shows correctness, scoring, and feedback

Authoring uses a separate custom element, the author view ([Authoring Contract](PIE_ELEMENT_CONTRACT.md#authoring-contract)).

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
  signLang?: string;                // Adaptation language; redundant when it equals card `language`
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
  element: string;                // Element tag, the key in the item config's `elements` map (e.g., "multiple-choice")
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
rather than a replacement for it. Tag it with the adaptation language on the
card's `language` — a Spanish item's signed alternate is LSM, not ASL, so it must
never be inferred from the item's content language. That is the only field
pie-players resolves a card on, since resolution runs before anything knows the
card is a signing card. The payload's optional `signLang` names the same code and
is worth authoring only where the two differ, as in a card tagged with the item's
content language so resolution reaches it by the default-language rung; the
pie-api-aws importer emits `language` alone. Narrow a card with the exported
`isSignLanguageCard` guard; the open catalog vocabulary means TypeScript cannot
statically rule out a bare URL in `content` on a `sign-language` card, and that
legacy form is not supported. Rendering, resolution, and PNP gating belong to
the player, not to elements — see `sign-language-asl-support.md` in pie-players.

The card shape is pie-players' contract (`packages/players-shared`), restated
here structurally rather than imported, since all three repos in the chain
(this one, the item importer in pie-api-aws, and the player) read the same
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
// Multiple Choice (single): still an array, with one value
{ value: ['a'] }

// Multiple Choice (multi)
{ value: ['a', 'c'] }

// Hotspot
{ answers: [{ id: 'shape-1' }] }
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

All PIE elements accept these props, which hosts set as element properties:

```typescript
interface CommonElementProps {
  model: ElementModel;            // Delivery: the controller's view model for the env; author: the authored model
  session: PieSession;            // Student response; the element writes each change into it
}
```

Elements declare no `env` property: the environment reaches an element through the view model its controller returns.

Elements report changes as events: a delivery element dispatches `session-changed` ([Delivery Contract](PIE_ELEMENT_CONTRACT.md#delivery-contract)) and an author element dispatches `model.updated` ([Authoring Contract](PIE_ELEMENT_CONTRACT.md#authoring-contract)).

### Svelte Components

```svelte
<script lang="ts">
  import SimpleCloze from '@pie-element/simple-cloze/delivery';

  if (!customElements.get('simple-cloze')) customElements.define('simple-cloze', SimpleCloze);

  let { model, session } = $props(); // model: the controller's view model for the env
</script>

<!-- The element writes each change into `session`; the event only says it happened. -->
<simple-cloze
  {model}
  {session}
  onsession-changed={(e) => saveSession(session, { complete: e.detail.complete })}
></simple-cloze>
```

### React Components

React 18 passes JSX props to a custom element as attributes, so a ref sets the properties:

```jsx
import MultipleChoice from '@pie-element/multiple-choice/delivery';
import { useEffect, useRef } from 'react';

if (!customElements.get('pie-multiple-choice')) {
  customElements.define('pie-multiple-choice', MultipleChoice);
}

function Item({ model, session, onSave }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current.model = model;
    ref.current.session = session;
  }, [model, session]);

  useEffect(() => {
    const element = ref.current;
    // The element has written the change into `session`.
    const handler = (e) => onSave(session, { complete: e.detail.complete });
    element.addEventListener('session-changed', handler);
    return () => element.removeEventListener('session-changed', handler);
  }, [session, onSave]);

  return <pie-multiple-choice ref={ref} />;
}
```

### Web Components

```javascript
const element = document.querySelector('pie-multiple-choice');

// Set properties: `model` is the view model the controller returned for the environment
element.model = {...};
element.session = {...};

// Listen to events: the element has written the change into `element.session`.
element.addEventListener('session-changed', (e) => {
  console.log('Session:', element.session, 'complete:', e.detail.complete);
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
    updateSession?: (
      id: string,
      element: string,
      properties: Partial<PieSession>
    ) => Promise<void>
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

The optional fourth argument, `updateSession(id, element, properties)`, persists `properties` into the stored session and resolves when it is saved. A controller that shuffles choices calls it with `{ shuffledValues }` to keep the order it drew, so a host that implements it with another signature loses that order. `id` and `element` come from the session and can be `undefined`, for a session without them or for an element that shuffles each of its parts separately, so a host keys the write by the model it called `model()` for. `PieUpdateSession` in `@pie-element/shared-types` types it.

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

### session-changed

Fired by the delivery element after it writes a learner change into the session object the player set. The event carries metadata only, so read the response off that object. [`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md#delivery-contract) sets out the full contract.

```typescript
interface SessionChangedEvent extends CustomEvent<{ complete: boolean; component: string }> {
  complete: boolean; // whether the session is a complete response
  component: string; // the tag the element is registered under
}
```

**Example:**
```javascript
element.session = session;

element.addEventListener('session-changed', (event) => {
  // The element has written the change into `session`.
  saveSession(session, { complete: event.detail.complete });
});
```

### model.updated

Fired by the author element on each edit, as a bubbling `ModelUpdatedEvent` from `@pie-element/shared-configure-events`. [`PIE_ELEMENT_CONTRACT.md`](PIE_ELEMENT_CONTRACT.md#authoring-contract) sets out the full contract.

```typescript
interface ModelUpdatedEvent extends CustomEvent<{ update: ElementModel; reset: boolean }> {
  update: ElementModel; // the whole model, id and element included
  reset: boolean; // true: the item player replaces the stored model; legacy pie-author always merges
}
```

**Example:**
```javascript
authorElement.addEventListener('model.updated', (event) => {
  const { update, reset } = event.detail;

  // Auto-save
  saveModel(update, { replace: reset });
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
  choicePrefix?: 'letters' | 'numbers' | 'none'; // Choice labels

  // Feedback
  feedbackEnabled?: boolean;      // Show choice feedback in evaluate mode
  rationale?: string;             // Instructor explanation

  // Configuration
  partialScoring?: boolean;       // Enable partial credit
  lockChoiceOrder?: boolean;      // Default true; false lets the controller shuffle the choices once per session
}

interface Choice {
  label: string;                  // Choice text (HTML)
  value: string;                  // Unique identifier
  correct?: boolean;              // Is this a correct answer?
  feedback?: {                    // Shown in evaluate mode when feedbackEnabled is true
    type: 'none' | 'default' | 'custom';
    value?: string;               // Text for 'custom'
  };
  rationale?: string;             // Instructor explanation for this choice
}
```

#### Session

```typescript
// Single and multi-select both store an array of choice values
interface MultipleChoiceSession extends PieSession {
  value: string[];
}
```

#### Example

```typescript
const model: MultipleChoiceModel = {
  id: 'mc1',
  element: 'multiple-choice',
  prompt: '<p>What is 2 + 2?</p>',
  choices: [
    { label: '3', value: 'a', correct: false },
    { label: '4', value: 'b', correct: true },
    { label: '5', value: 'c', correct: false }
  ],
  choiceMode: 'radio',
  choicePrefix: 'letters'
};
```

### Hotspot

#### Model

```typescript
interface HotspotModel extends PieModel {
  prompt: string;                 // Question text (HTML)
  imageUrl: string;               // Background image
  dimensions: { width: number; height: number }; // Image size the shapes are drawn against
  multipleCorrect?: boolean;      // Allow multiple selections
  partialScoring?: boolean;       // Enable partial credit
  shapes: {
    rectangles?: (Shape & { x: number; y: number; width: number; height: number })[];
    polygons?: (Shape & { points: { x: number; y: number }[] })[];
    circles?: (Shape & { x: number; y: number; radius: number })[];
  };
}

interface Shape {
  id: string;
  correct?: boolean;
}
```

#### Session

```typescript
interface HotspotSession extends PieSession {
  answers: { id: string }[];      // Selected shapes
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

Element packages export no model or session types. The interfaces under [Element-Specific APIs](#element-specific-apis) describe the JSON shapes.

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

// The view model from the controller's model(), and the session the player owns
assignProps(element, { model: viewModel, session });
```

`@pie-element/shared-utils` also exports `showFeedback`, `showRationale`,
`clamp`, `shuffle`, `debounce`, `uuid`, and `debug`.

### Controller Utilities

```typescript
import { getShuffledChoices, lockChoices, partialScoring } from '@pie-element/shared-controller-utils';

// Should choice order stay ordinal? Honours model.lockChoiceOrder and env['@pie-element'].lockChoiceOrder
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
import type { PieEnvironment, PieModel, PieSession } from '@pie-element/shared-types';

const env: PieEnvironment = { mode: 'gather', role: 'student' };
const model: PieModel = { id: 'mc1', element: 'multiple-choice' /* ... */ };
const session: PieSession = { id: 'mc1', value: [] };
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
element.addEventListener('session-changed', () => {
  saveSession(session); // the object set as `element.session`
});

// ❌ Bad: Ignore session changes (data loss)
```

## See Also

- [README.md](../README.md) - Getting started guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [TypeScript Definitions](../packages/shared/types/src/types.ts) - Source types

---

**Last Updated**: 2026-09-27
