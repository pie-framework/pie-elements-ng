# @pie-elements-ng/lib-ui

Shared UI components for PIE elements built with Svelte 5.

## Installation

```bash
bun add @pie-elements-ng/lib-ui
```

## Components

### Prompt

Renders HTML prompts with sanitization and math support (future).

```svelte
<script>
  import Prompt from '@pie-elements-ng/lib-ui/Prompt.svelte';
</script>

<Prompt html="<p>What is the <strong>answer</strong>?</p>" />
```

### Feedback

Shows correct/incorrect indicators with optional feedback messages.

```svelte
<script>
  import Feedback from '@pie-elements-ng/lib-ui/Feedback.svelte';
</script>

<Feedback correct={true} feedback="Great job!" />
<Feedback correct={false} feedback="Try again." />
```

### Rationale

Displays instructional rationale (instructor-only) in a collapsible section.

```svelte
<script>
  import Rationale from '@pie-elements-ng/lib-ui/Rationale.svelte';
</script>

<Rationale
  title="Teaching Point"
  rationale="<p>This demonstrates the concept of...</p>"
/>
```

### LoadingSpinner

Shows loading state with optional message.

```svelte
<script>
  import LoadingSpinner from '@pie-elements-ng/lib-ui/LoadingSpinner.svelte';
</script>

<LoadingSpinner size="md" message="Loading question..." />
```

## Styling

Components use scoped styles and can be customized with CSS variables or by passing a `className` prop.

## Future Enhancements

- Math rendering (MathJax/KaTeX) in Prompt component
- Theme support via CSS variables
- Additional common UI patterns
