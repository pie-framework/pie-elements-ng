# @pie-element/shared-feedback

Feedback utilities for PIE elements. Provides utilities for getting feedback messages based on correctness levels.

## Installation

```bash
bun add @pie-element/shared-feedback
```

## Usage

### Basic Usage

```typescript
import { getActualFeedbackForCorrectness } from '@pie-element/shared-feedback';

// Get feedback for a correct answer
const message = getActualFeedbackForCorrectness('correct');
// Returns: 'Correct'

// Get feedback with custom configuration
const customMessage = getActualFeedbackForCorrectness('correct', {
  correct: {
    type: 'custom',
    default: 'Correct',
    custom: 'Excellent work!',
  },
});
// Returns: 'Excellent work!'
```

### Feedback Types

- `default` - Use the default feedback message
- `custom` - Use a custom feedback message
- `none` - Don't show any feedback (returns `undefined`)

### Correctness Levels

- `correct` - The answer is completely correct
- `incorrect` - The answer is completely incorrect
- `partial` - The answer is partially correct
- `unanswered` - No answer was provided

### API

#### `getActualFeedbackForCorrectness(correctness, feedback?)`

Get the feedback message for a specific correctness level (synchronous).

**Parameters:**
- `correctness`: `'correct' | 'incorrect' | 'partial' | 'unanswered' | 'partially-correct'`
- `feedback`: `Partial<Feedback>` (optional) - Custom feedback configuration

**Returns:** `string | undefined`

#### `getFeedbackForCorrectness(correctness, feedback?)`

Async version of `getActualFeedbackForCorrectness`.

**Parameters:**
- `correctness`: `'correct' | 'incorrect' | 'partial' | 'unanswered' | 'partially-correct'`
- `feedback`: `Partial<Feedback>` (optional) - Custom feedback configuration

**Returns:** `Promise<string | undefined>`

## TypeScript

This package is written in TypeScript and includes type definitions.

```typescript
import type { Feedback, FeedbackConfig, Correctness } from '@pie-element/shared-feedback';
```

## Default Feedback Messages

- **Correct**: "Correct"
- **Incorrect**: "Incorrect"
- **Partial**: "Nearly"
- **Unanswered**: "You have not entered a response"

## License

MIT
