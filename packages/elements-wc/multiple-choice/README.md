# @pie-wc/multiple-choice

Framework-agnostic multiple choice assessment element as a web component.

## Installation

```bash
npm install @pie-wc/multiple-choice
```

## Usage

### Vanilla JavaScript

```html
<script type="module">
  import '@pie-wc/multiple-choice';

  const element = document.querySelector('pie-multiple-choice');
  element.model = {
    prompt: 'What is 2 + 2?',
    choices: [
      { label: '3', value: 'a' },
      { label: '4', value: 'b' },
      { label: '5', value: 'c' }
    ],
    choiceMode: 'radio'
  };
  element.session = { value: [] };
</script>

<pie-multiple-choice></pie-multiple-choice>
```

### React

```jsx
import { useRef, useEffect } from 'react';
import '@pie-wc/multiple-choice';

function Assessment() {
  const elementRef = useRef();

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.model = model;
      elementRef.current.session = session;
    }
  }, [model, session]);

  return <pie-multiple-choice ref={elementRef} />;
}
```

### Vue

```vue
<template>
  <pie-multiple-choice ref="element" />
</template>

<script>
import '@pie-wc/multiple-choice';

export default {
  mounted() {
    this.$refs.element.model = this.model;
    this.$refs.element.session = this.session;
  }
}
</script>
```

### Angular

```typescript
import '@pie-wc/multiple-choice';

@Component({
  selector: 'app-assessment',
  template: '<pie-multiple-choice #element></pie-multiple-choice>'
})
export class AssessmentComponent implements AfterViewInit {
  @ViewChild('element') element: ElementRef;

  ngAfterViewInit() {
    this.element.nativeElement.model = this.model;
    this.element.nativeElement.session = this.session;
  }
}
```

## API

### Properties

- **model**: `MultipleChoiceModel` - The question model
  - `prompt`: string - The question text
  - `choices`: Array - Available answer choices
  - `choiceMode`: 'radio' | 'checkbox' - Single or multiple selection
  - `mode`: 'gather' | 'view' | 'evaluate' - Interaction mode

- **session**: `MultipleChoiceSession` - The response session
  - `value`: string[] - Selected choice IDs

- **options**: `Options` - Additional configuration options

### Methods

- **isComplete()**: boolean - Check if response is complete

### Events

- **model-set** - Fired when model is set
  - `detail`: { complete: boolean, hasModel: boolean }

- **session-changed** - Fired when session changes
  - `detail`: { complete: boolean }

## TypeScript Support

This package includes TypeScript type definitions for the web component and its properties.

```typescript
import '@pie-wc/multiple-choice';

declare global {
  interface HTMLElementTagNameMap {
    'pie-multiple-choice': MultipleChoiceElement;
  }
}
```

## Bundle Size

The bundled web component includes React, ReactDOM, and all required dependencies. Approximate size:
- Uncompressed: ~800KB
- Gzipped: ~250KB

## License

ISC
