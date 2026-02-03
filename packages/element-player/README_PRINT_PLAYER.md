# ESM Print Player

An element-level print player for testing and developing PIE element print views.

## Overview

`<pie-esm-print-player>` is a web component that loads and renders individual PIE elements in print mode. It provides the same API as `<pie-esm-element-player>` but for print views.

## Usage

### Basic Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/packages/element-player/dist/pie-element-player.js"></script>
</head>
<body>
  <pie-esm-print-player
    element-name="multiple-choice"
    role="student"
  ></pie-esm-print-player>

  <script type="module">
    const player = document.querySelector('pie-esm-print-player');
    player.model = {
      prompt: 'What is 2 + 2?',
      choices: [
        { label: '3', value: 'a', correct: false },
        { label: '4', value: 'b', correct: true },
        { label: '5', value: 'c', correct: false }
      ],
      choiceMode: 'radio',
      choicePrefix: 'letters'
    };
  </script>
</body>
</html>
```

### Role Switching

```html
<div>
  <label>
    <input type="radio" name="role" value="student" checked onchange="updateRole(this.value)">
    Student View
  </label>
  <label>
    <input type="radio" name="role" value="instructor" onchange="updateRole(this.value)">
    Instructor View (Answer Key)
  </label>
</div>

<pie-esm-print-player id="player" element-name="multiple-choice"></pie-esm-print-player>

<script>
  function updateRole(role) {
    document.getElementById('player').role = role;
  }
</script>
```

## API

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `element-name` | `string` | `''` | Name of element to load (e.g., "multiple-choice") |
| `model` | `object` | - | PIE model configuration |
| `role` | `'student' \| 'instructor'` | `'student'` | Controls answer visibility |
| `cdn-url` | `string` | `''` | Optional CDN URL override |

### Events

None - print views are static and non-interactive.

## Comparison with EsmElementPlayer

| Feature | EsmElementPlayer | EsmPrintPlayer |
|---------|------------------|----------------|
| **Purpose** | Interactive elements | Static print views |
| **Tag** | `<pie-esm-element-player>` | `<pie-esm-print-player>` |
| **Import** | `@pie-element/{name}` | `@pie-element/{name}/print` |
| **Model** | ✅ PIE model | ✅ PIE model |
| **Session** | ✅ Session data | ❌ Not used |
| **Role** | ❌ Not applicable | ✅ student/instructor |
| **Events** | `session-changed` | None |
| **Element Tag** | `{name}-element` | `{name}-print` |

## How It Works

1. **Loads print export**: `import('@pie-element/multiple-choice/print')`
2. **Registers custom element**: `multiple-choice-print`
3. **Sets properties**:
   ```javascript
   element.model = model;
   element.options = { role };
   ```
4. **Element handles print transformation**: Each print element has `preparePrintModel()` that:
   - Disables interactions
   - Locks choice order
   - Shows/hides answers based on role
   - Applies print-specific styling

## When to Use

### Use EsmPrintPlayer When:
- ✅ Testing single element print views
- ✅ Developing element print components
- ✅ Creating element documentation
- ✅ Running demos for element developers

### Don't Use for Production:
- ❌ Multi-element assessment items
- ❌ Content delivery systems
- ❌ Markup-driven rendering

**For production:** Use the item-level print player from `@pie-player/print` (in pie-players repository).

## Example in Element Demo

The element-demo app uses this player for print routes:

```svelte
<!-- apps/element-demo/src/lib/element-player/components/PrintView.svelte -->
<pie-esm-print-player
  element-name={elementName}
  role={role}
  model={model}
/>
```

## Development

### Loading Print Elements

Print elements are loaded from the `/print` export:

```javascript
// Interactive element
import MultipleChoice from '@pie-element/multiple-choice';

// Print element
import MultipleChoicePrint from '@pie-element/multiple-choice/print';
```

### Print Element Structure

Each print component:
- Exports a custom element class
- Has `preparePrintModel(model, options)` to transform the model
- Renders using the delivery component
- Handles role-based visibility internally

### Import Maps

The player uses import maps for module resolution:

```html
<script type="importmap">
{
  "imports": {
    "@pie-element/": "/packages/elements-react/"
  }
}
</script>
```

## See Also

- [EsmElementPlayer](./src/players/EsmElementPlayer.svelte) - Interactive element player
- [Print Player (Item-Level)](../../print-player/) - For complete assessment items
- [Element Demo](../../apps/element-demo/) - Live examples

## License

MIT
