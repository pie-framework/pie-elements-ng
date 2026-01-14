# @pie-elements-ng/test-utils

Testing utilities for PIE element development.

## Installation

```bash
bun add -D @pie-elements-ng/test-utils
```

## Usage

### Controller Testing

```typescript
import { testController, testEnvironments } from '@pie-elements-ng/test-utils';
import { myController } from './controller';

const testCases = [
  {
    name: 'returns correct view model in gather mode',
    question: { id: '1', element: '@pie-element/my-element' },
    session: null,
    env: testEnvironments.studentGather,
    expectedViewModel: {
      disabled: false,
      mode: 'gather',
    },
  },
];

const results = await testController(myController, testCases);
console.log(results); // [{ passed: true, testCase: '...', errors: [] }]
```

### Fixtures

```typescript
import { createTestModel, createTestSession, testPrompts } from '@pie-elements-ng/test-utils';

const model = createTestModel({ prompt: testPrompts.withMath });
const session = createTestSession({ value: ['answer1'] });
```

### Web Component Testing

```typescript
import {
  mountComponent,
  waitForEvent,
  simulateClick,
  querySelector,
} from '@pie-elements-ng/test-utils';

// Mount a component
const element = await mountComponent('my-element', {
  model: myModel,
  session: mySession,
});

// Wait for events
const sessionData = await waitForEvent(element, 'pie.session_changed');

// Simulate interactions
const button = querySelector(element, 'button');
simulateClick(button);
```

## API Reference

See [TypeScript definitions](./src/index.ts) for complete API documentation.
