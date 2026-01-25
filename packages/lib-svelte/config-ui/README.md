# @pie-element/lib-config-ui

Reusable configuration UI components for PIE element authoring interfaces built with Svelte 5.

## Installation

```bash
bun add @pie-element/lib-config-ui
```

## Components

### TextInput

Text input field for configuration forms.

```svelte
<script>
  import TextInput from '@pie-element/lib-config-ui/TextInput.svelte';
  let promptText = $state('');
</script>

<TextInput
  label="Prompt"
  bind:value={promptText}
  placeholder="Enter the question prompt"
  required={true}
  help="The main question text shown to students"
/>
```

### NumberInput

Number input field with min/max/step controls.

```svelte
<script>
  import NumberInput from '@pie-element/lib-config-ui/NumberInput.svelte';
  let maxScore = $state(1);
</script>

<NumberInput
  label="Maximum Score"
  bind:value={maxScore}
  min={0}
  max={10}
  step={0.5}
  help="The maximum points for this question"
/>
```

### Checkbox

Checkbox input for boolean options.

```svelte
<script>
  import Checkbox from '@pie-element/lib-config-ui/Checkbox.svelte';
  let shuffleChoices = $state(false);
</script>

<Checkbox
  label="Shuffle Choices"
  bind:checked={shuffleChoices}
  help="Randomize the order of answer choices"
/>
```

### Select

Dropdown select component.

```svelte
<script>
  import Select from '@pie-element/lib-config-ui/Select.svelte';
  let mode = $state('single');
  const options = [
    { value: 'single', label: 'Single Answer' },
    { value: 'multiple', label: 'Multiple Answers' },
  ];
</script>

<Select
  label="Answer Mode"
  bind:value={mode}
  {options}
  help="Choose single or multiple answer mode"
/>
```

### RichTextEditor

Rich text editor for HTML content (currently a textarea, will be enhanced).

```svelte
<script>
  import RichTextEditor from '@pie-element/lib-config-ui/RichTextEditor.svelte';
  let feedback = $state('');
</script>

<RichTextEditor
  label="Feedback"
  bind:value={feedback}
  placeholder="<p>Enter feedback HTML</p>"
  rows={8}
/>
```

### Section

Section component for grouping related form fields.

```svelte
<script>
  import Section from '@pie-element/lib-config-ui/Section.svelte';
</script>

<Section
  title="Scoring Settings"
  description="Configure how this question is scored"
  collapsible={true}
  defaultExpanded={true}
>
  <!-- Form fields go here -->
</Section>
```

## Styling

Components use DaisyUI classes and can be customized with CSS variables or by passing a `className` prop.

## Future Enhancements

- Full rich text editor with toolbar (Quill/TipTap integration)
- Color picker component
- Image upload component
- Drag-and-drop list reordering
- Validation and error display
