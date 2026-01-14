# @pie-elements-ng/multiple-choice

Multiple choice assessment element for PIE.

## Features

- **Choice Modes**: Radio (single select) or checkbox (multi-select)
- **Choice Prefixes**: Letters (A, B, C), numbers (1, 2, 3), or none
- **Layouts**: Vertical, horizontal, or grid
- **Shuffling**: Randomize choice order with session locking
- **Feedback**: Choice-level and overall feedback
- **Rationale**: Instructor-only rationale display
- **Partial Scoring**: Award partial credit for checkbox mode
- **Accessibility**: WCAG 2.2 Level AA compliant

## Installation

```bash
bun add @pie-elements-ng/multiple-choice
```

## Usage

### With Controller

```typescript
import { model, outcome } from '@pie-elements-ng/multiple-choice/controller';

const question = {
  id: '1',
  element: '@pie-elements-ng/multiple-choice',
  prompt: '<p>What is 2 + 2?</p>',
  promptEnabled: true,
  choices: [
    { value: 'a', label: '3', correct: false },
    { value: 'b', label: '4', correct: true },
    { value: 'c', label: '5', correct: false },
  ],
  choiceMode: 'radio',
  choicePrefix: 'letters',
  choicesLayout: 'vertical',
  feedbackEnabled: true,
  rationaleEnabled: true,
  rationale: '<p>2 + 2 = 4 by basic arithmetic.</p>',
};

const session = { value: ['b'] };
const env = { mode: 'evaluate', role: 'student' };

// Get view model for rendering
const viewModel = await model(question, session, env);

// Calculate score
const result = await outcome(question, session, env);
console.log(result.score); // 1 (100%)
```

### With Svelte Component

```svelte
<script>
  import MultipleChoice from '@pie-elements-ng/multiple-choice/MultipleChoice.svelte';
  import { model } from '@pie-elements-ng/multiple-choice/controller';

  let session = $state({ value: [] });
  let viewModel = $state(null);

  $effect(async () => {
    viewModel = await model(question, session, env);
  });

  function handleChange(newValue) {
    session = { ...session, value: newValue };
  }
</script>

{#if viewModel}
  <MultipleChoice
    model={viewModel}
    {session}
    onChange={handleChange}
  />
{/if}
```

## API

### Controller Functions

#### `model(question, session, env, updateSession?): Promise<ViewModel>`

Transform question model into view model for rendering.

- **question**: `MultipleChoiceModel` - The question configuration
- **session**: `MultipleChoiceSession | null` - Student response data
- **env**: `PieEnvironment` - Environment (mode, role, settings)
- **updateSession**: `(session) => void` - Optional callback for session updates

Returns view model with:
- Shuffled choices (if enabled)
- Choice states (checked, feedback visibility)
- Evaluation results (if in evaluate mode)
- Correct response (for instructors)

#### `outcome(question, session, env): Promise<OutcomeResult>`

Calculate score for the student's response.

Returns:
- **score**: `number` - Score from 0 to 1
- **empty**: `boolean` - True if no response provided

Scoring modes:
- **Binary** (default): 1 if all correct and no incorrect, else 0
- **Partial** (checkbox only): `(correct - incorrect) / total correct`, minimum 0

#### `createDefaultModel(partial?): MultipleChoiceModel`

Create a default question model with optional overrides.

#### `validate(model, config): ValidationErrors`

Validate the question configuration.

Checks:
- At least 2 choices
- At least 1 correct choice
- Radio mode has exactly 1 correct choice

#### `createCorrectResponseSession(question, env): Session`

Generate a session with the correct response.

## Component Props

### MultipleChoice.svelte

```typescript
interface Props {
  model: MultipleChoiceViewModel;
  session: { value?: string[] };
  onChange: (value: string[]) => void;
}
```

- **model**: View model from controller
- **session**: Current session state
- **onChange**: Callback when selection changes

## Types

### MultipleChoiceModel

```typescript
interface MultipleChoiceModel {
  id: string;
  element: '@pie-elements-ng/multiple-choice';
  prompt?: string;
  promptEnabled?: boolean;
  choices: Choice[];
  choiceMode: 'radio' | 'checkbox';
  choicePrefix: 'letters' | 'numbers' | 'none';
  choicesLayout: 'vertical' | 'horizontal' | 'grid';
  lockChoiceOrder?: boolean;
  partialScoring?: boolean;
  feedbackEnabled: boolean;
  rationaleEnabled: boolean;
  rationale?: string;
  teacherInstructions?: string;
}
```

### Choice

```typescript
interface Choice {
  value: string;
  label: string;
  correct: boolean;
  feedback?: string;
}
```

### MultipleChoiceSession

```typescript
interface MultipleChoiceSession {
  id?: string;
  value?: string[]; // Selected choice values
  shuffledValues?: string[]; // Locked shuffle order
}
```

## Accessibility

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader announcements
- Focus management
- High contrast mode support
- Respects reduced motion preferences

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## License

MIT
