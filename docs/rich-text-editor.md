# Rich Text Editor

## Overview

PIE Elements NG uses TipTap-based rich text editing for authoring element content, following the proven pattern from pie-qti.

## Technology Stack

- **@tiptap/core** - Core editor functionality
- **@tiptap/starter-kit** - Basic formatting (bold, italic, lists, headings)
- **@tiptap/extension-mathematics** - Math rendering with KaTeX
- **mathlive** - Visual math editor for LaTeX input
- **katex** - Math rendering engine

## Usage

### Basic Usage

```svelte
<script lang="ts">
  import { RichTextEditor } from '@pie-element/lib-ui';

  let content = $state('');
</script>

<RichTextEditor
  value={content}
  placeholder="Enter text..."
  minHeight={150}
  onChange={(html) => content = html}
/>
```

### With Math Support

The editor automatically supports inline math `\(...\)` and block math `\[...\]`. Click on math expressions to edit them with the MathLive visual editor.

### Key Features

- **Text Formatting**: Bold, italic, underline, strikethrough
- **Structure**: Headings, lists (bullet/numbered), blockquotes
- **Math**: Inline and display equations with visual LaTeX editor
- **Accessibility**: WCAG 2.2 Level AA compliant with proper ARIA attributes
- **Theming**: Integrates with DaisyUI themes via CSS variables

## API Reference

### Props

```typescript
interface RichTextEditorProps {
  // Content
  value?: string;                    // HTML content
  placeholder?: string;              // Placeholder text

  // Editing
  editable?: boolean;                // Enable/disable editing
  disabled?: boolean;                // Disable completely

  // Sizing
  minHeight?: number;                // Minimum height (px)
  maxHeight?: number;                // Maximum height (px)
  width?: string | number;           // Editor width

  // Limits
  charactersLimit?: number;          // Character limit
  nonEmpty?: boolean;                // Prevent empty content

  // Callbacks
  onChange?: (html: string) => void; // Content change callback
  onFocus?: () => void;              // Focus callback
  onBlur?: (event: FocusEvent) => void; // Blur callback

  // Toolbar
  toolbarOpts?: {
    position?: 'top' | 'bottom';
    alignment?: 'left' | 'right';
    alwaysVisible?: boolean;
    isHidden?: boolean;
  };

  // Advanced
  spellCheck?: boolean;              // Enable spell check
  disableUnderline?: boolean;        // Disable underline
  imageSupport?: ImageSupportConfig; // Image upload support
  languageCharactersProps?: LanguageCharacter[]; // Special characters
}
```

## Integration in Elements

### Authoring Components

```svelte
<!-- packages/elements-svelte/multiple-choice/src/authoring/Config.svelte -->
<script lang="ts">
  import { RichTextEditor } from '@pie-element/lib-ui';

  let { model = $bindable() } = $props();

  function updatePrompt(html: string) {
    model = { ...model, prompt: html };
  }
</script>

<div class="config-section">
  <label>Prompt</label>
  <RichTextEditor
    value={model.prompt}
    placeholder="Enter the question prompt..."
    minHeight={150}
    onChange={updatePrompt}
  />
</div>
```

## Keyboard Shortcuts

- **Ctrl/Cmd+B**: Toggle bold
- **Ctrl/Cmd+I**: Toggle italic
- **Ctrl/Cmd+Z**: Undo
- **Ctrl/Cmd+Shift+Z**: Redo
- **Tab**: Focus toolbar buttons
- **Escape**: Close math editor modal

## Implementation Details

### Math Editing Flow

1. Click on existing math expression OR click "Math" toolbar button
2. MathLive visual editor modal opens
3. Edit LaTeX using visual keyboard or direct input
4. Live KaTeX preview shows rendered result
5. Click "Insert" to confirm or "Cancel" to abort
6. Math renders inline or as display equation

### State Management

The editor uses Svelte 5 runes for reactive state management:

```typescript
let editor = $state<Editor | undefined>(undefined);
let lastEmitted = $state('');

// Prevent update loops
$effect(() => {
  if (!editor || editor.isFocused) return;
  if (value !== lastEmitted) {
    editor.commands.setContent(value || '<p></p>');
  }
});
```

### Accessibility

- Proper ARIA roles and labels
- Keyboard navigation support
- Screen reader compatible
- Focus management in modals
- Color contrast compliant

## Styling

The editor uses CSS variables for theming:

```css
.tiptap-editor-container {
  background: var(--color-base-100);
  border: 1px solid var(--color-base-300);
  color: var(--color-base-content);
}

.tiptap-editor-container:focus-within {
  border-color: var(--color-primary);
}
```

## Feature Parity with Original pie-elements

| Feature | Original (@pie-lib/editable-html) | This Project (TipTap) |
|---------|-----------------------------------|------------------------|
| Framework | React + Slate v0.x | Svelte 5 + TipTap |
| Math Editing | External LaTeX | MathLive modal |
| Math Rendering | MathJax | KaTeX |
| Text Formatting | Basic | Extended |
| Bundle Size | ~150KB | ~100KB |
| TypeScript | Partial | Full |
| XSS Protection | None | DOMPurify |

## Testing

### Component Tests

```typescript
import { render } from '@testing-library/svelte';
import { RichTextEditor } from '@pie-element/lib-ui';

test('renders with placeholder', () => {
  const { getByRole } = render(RichTextEditor, {
    props: { placeholder: 'Enter text...' }
  });

  const editor = getByRole('textbox');
  expect(editor).toHaveAttribute('aria-label', 'Enter text...');
});
```

### E2E Tests

```typescript
test('math editing workflow', async ({ page }) => {
  await page.goto('/element?mode=authoring');

  // Insert math
  await page.locator('button:has-text("Math")').click();
  await page.locator('math-field').fill('x^2 + y^2');
  await page.locator('button:has-text("Insert")').click();

  // Verify rendering
  expect(await page.locator('.katex').count()).toBe(1);
});
```

## Migration from @pie-lib/editable-html

The TipTap implementation provides full feature parity with the original Slate-based editor:

1. ✅ All formatting options
2. ✅ Math input and rendering
3. ✅ Image upload support
4. ✅ Special character pickers
5. ✅ Improved XSS protection
6. ✅ Better accessibility
7. ✅ Smaller bundle size

## Further Reading

- [TipTap Documentation](https://tiptap.dev/)
- [MathLive Documentation](https://cortexjs.io/mathlive/)
- [KaTeX Documentation](https://katex.org/)
- Component source: [packages/lib-svelte/ui/src/RichTextEditor.svelte](../packages/lib-svelte/ui/src/RichTextEditor.svelte)

---

**Document Version**: 2.0 (Condensed)
**Last Updated**: 2025-01-08
**Status**: Active Reference
