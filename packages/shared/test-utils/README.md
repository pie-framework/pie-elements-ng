# @pie-element/shared-test-utils

Testing utilities for PIE element development.

## Installation

```bash
bun add -D @pie-element/shared-test-utils
```

## Usage

### Controller Testing

```typescript
import { testController, testEnvironments } from '@pie-element/shared-test-utils';
import { myController } from './controller';

const testCases = [
  {
    name: 'returns correct view model in gather mode',
    question: { id: '1', element: 'my-element' },
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
import { createTestModel, createTestSession, testPrompts } from '@pie-element/shared-test-utils';

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
} from '@pie-element/shared-test-utils';

// Mount a component
const element = await mountComponent('my-element', {
  model: myModel,
  session: mySession,
});

// Wait for events: resolves with the event's detail
const { complete } = await waitForEvent<{ complete: boolean; component: string }>(
  element,
  'session-changed'
);

// Simulate interactions
const button = querySelector(element, 'button');
simulateClick(button);
```

### Author Element Contract

`assertAuthorModelUpdate` mounts an author element, sets `model` and `configuration` as a player does, makes one edit, and throws unless the edit's `model.updated` meets the [Authoring Contract](https://github.com/pie-framework/pie-elements-ng/blob/develop/docs/PIE_ELEMENT_CONTRACT.md#authoring-contract). `assertAuthorElementProperties` checks only that the element declares both properties.

```typescript
import { assertAuthorModelUpdate } from '@pie-element/shared-test-utils';

const { event, cleanup } = await assertAuthorModelUpdate({
  tag: 'my-element-config',
  model: { id: '1', element: 'my-element', prompt: '<p>Q</p>' },
  settle: async () => {
    await new Promise((r) => setTimeout(r, 0));
    flushSync(); // Svelte
  },
  edit: (element) => typeInto(element.querySelector('input'), 'edited'),
});
expect(event.detail.update).toMatchObject({ prompt: '<p>Q</p>' });
cleanup();
```

## API Reference

See [TypeScript definitions](./src/index.ts) for complete API documentation.
