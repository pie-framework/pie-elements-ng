<script lang="ts">
/**
 * JSON Editor Component using Tiptap
 * Based on pie-qti's XmlEditor pattern
 */

import { onMount, onDestroy } from 'svelte';
import { Editor } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import json from 'highlight.js/lib/languages/json';

let {
  value = $bindable(''),
  readonly = false,
  onInput,
  minHeight = 400,
}: {
  value?: string;
  readonly?: boolean;
  onInput?: (text: string) => void;
  minHeight?: number;
} = $props();

let editorElement = $state<HTMLDivElement | null>(null);
let editor = $state<Editor | null>(null);

// Setup syntax highlighting for JSON
const lowlight = createLowlight();
lowlight.register('json', json);

function createJsonDoc(text: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'codeBlock',
        attrs: { language: 'json' },
        content: text ? [{ type: 'text', text }] : [],
      },
    ],
  };
}

function readEditorText(currentEditor: Editor): string {
  return currentEditor.state.doc.textBetween(0, currentEditor.state.doc.content.size, '\n');
}

onMount(() => {
  if (!editorElement) return;

  editor = new Editor({
    element: editorElement,
    extensions: [
      Document,
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'json',
      }),
      Text,
      History,
    ],
    content: createJsonDoc(value),
    editable: !readonly,
    editorProps: {
      attributes: {
        class: 'json-editor-content',
        style: `min-height: ${minHeight}px`,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'JSON Editor',
      },
    },
    onUpdate: ({ editor }) => {
      const extracted = readEditorText(editor);
      value = extracted;
      onInput?.(extracted);
    },
  });
});

// Sync external changes to editor
$effect(() => {
  if (editor && value !== undefined) {
    const currentContent = readEditorText(editor);
    if (currentContent !== value) {
      editor.commands.setContent(createJsonDoc(value));
    }
  }
});

onDestroy(() => {
  editor?.destroy();
});
</script>

<div class="json-editor-container">
  <div bind:this={editorElement}></div>
</div>

<style>
.json-editor-container {
  --json-syntax-saturation: 500%;
  --json-syntax-string-hue: 80deg;     /* Strings: green */
  --json-syntax-number-hue: 160deg;     /* Numbers: cyan */
  --json-syntax-keyword-hue: 340deg;    /* true/false/null: red */
  --json-syntax-property-hue: 190deg;   /* Property names: blue */
}

.json-editor-container :global(.json-editor-content) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  padding: 1rem;
  background: hsl(var(--b1, 0 0% 100%));
  color: hsl(var(--bc, 0 0% 20%));
  border: 1px solid hsl(var(--b3, 0 0% 90%));
  border-radius: 0.5rem;
  overflow: auto;
}

.json-editor-container :global(.json-editor-content pre) {
  margin: 0;
  padding: 0;
  background: transparent;
}

.json-editor-container :global(.json-editor-content code) {
  font-family: inherit;
  background: transparent;
  padding: 0;
}

/* Syntax highlighting via CSS filters (theme-aware) */
.json-editor-container :global(.hljs-string) {
  filter: saturate(var(--json-syntax-saturation)) hue-rotate(var(--json-syntax-string-hue));
}

.json-editor-container :global(.hljs-number) {
  filter: saturate(var(--json-syntax-saturation)) hue-rotate(var(--json-syntax-number-hue));
}

.json-editor-container :global(.hljs-literal),
.json-editor-container :global(.hljs-keyword) {
  filter: saturate(var(--json-syntax-saturation)) hue-rotate(var(--json-syntax-keyword-hue));
}

.json-editor-container :global(.hljs-attr) {
  filter: saturate(var(--json-syntax-saturation)) hue-rotate(var(--json-syntax-property-hue));
  font-weight: bold;
}

/* Focus outline */
.json-editor-container :global(.json-editor-content:focus-visible) {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
</style>
