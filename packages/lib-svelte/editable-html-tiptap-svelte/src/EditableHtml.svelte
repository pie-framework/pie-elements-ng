<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { CharacterCount } from '@tiptap/extension-character-count';
import SuperScript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

let {
  markup = '',
  onChange,
  placeholder = 'Enter text here...',
  showToolbar = true,
  disabled = false,
}: {
  markup?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  showToolbar?: boolean;
  disabled?: boolean;
} = $props();

let editorElement: HTMLElement;
let editor = $state<Editor | null>(null);
let isFocused = $state(false);
let showAlignMenu = $state(false);

// Editor state for button active/disabled states
let editorState = $state({
  isBold: false,
  canBold: false,
  isItalic: false,
  canItalic: false,
  isStrike: false,
  canStrike: false,
  isCode: false,
  canCode: false,
  isUnderline: false,
  isSubScript: false,
  isSuperScript: false,
  isHeading3: false,
  isBulletList: false,
  isOrderedList: false,
  canUndo: false,
  canRedo: false,
  isTable: false,
  canTable: false,
  tableHasBorder: false,
  textAlign: 'left',
});

// Update editor state when editor changes
function updateEditorState() {
  if (!editor) return;

  editorState = {
    isBold: editor.isActive('bold'),
    canBold: editor.can().chain().focus().toggleBold().run(),
    isItalic: editor.isActive('italic'),
    canItalic: editor.can().chain().focus().toggleItalic().run(),
    isStrike: editor.isActive('strike'),
    canStrike: editor.can().chain().focus().toggleStrike().run(),
    isCode: editor.isActive('code'),
    canCode: editor.can().chain().focus().toggleCode().run(),
    isUnderline: editor.isActive('underline'),
    isSubScript: editor.isActive('subscript'),
    isSuperScript: editor.isActive('superscript'),
    isHeading3: editor.isActive('heading', { level: 3 }),
    isBulletList: editor.isActive('bulletList'),
    isOrderedList: editor.isActive('orderedList'),
    canUndo: editor.can().chain().focus().undo().run(),
    canRedo: editor.can().chain().focus().redo().run(),
    isTable: editor.isActive('table'),
    canTable: editor.can().chain().focus().insertTable().run(),
    tableHasBorder: editor.getAttributes('table')?.border === '1',
    textAlign: editor.isActive({ textAlign: 'right' })
      ? 'right'
      : editor.isActive({ textAlign: 'center' })
        ? 'center'
        : editor.isActive({ textAlign: 'justify' })
          ? 'justify'
          : 'left',
  };
}

onMount(() => {
  editor = new Editor({
    element: editorElement,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      TextStyle,
      CharacterCount.configure({
        limit: 1000000,
      }),
      Underline,
      SubScript,
      SuperScript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'right', 'center'],
      }),
      Image,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          border: '0',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: markup || '',
    editable: !disabled,
    autofocus: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
      updateEditorState();
    },
    onSelectionUpdate: () => {
      updateEditorState();
    },
    onFocus: () => {
      isFocused = true;
      updateEditorState();
    },
    onBlur: () => {
      isFocused = false;
      showAlignMenu = false;
    },
  });

  updateEditorState();
});

onDestroy(() => {
  if (editor) {
    editor.destroy();
  }
});

// Watch for markup changes
$effect(() => {
  if (editor && markup !== editor.getHTML()) {
    editor.commands.setContent(markup || '', false);
  }
});

// Watch for disabled changes
$effect(() => {
  if (editor) {
    editor.setEditable(!disabled);
  }
});

// Toolbar button handlers
function toggleBold() {
  editor?.chain().focus().toggleBold().run();
}

function toggleItalic() {
  editor?.chain().focus().toggleItalic().run();
}

function toggleStrike() {
  editor?.chain().focus().toggleStrike().run();
}

function toggleCode() {
  editor?.chain().focus().toggleCode().run();
}

function toggleUnderline() {
  editor?.chain().focus().toggleUnderline().run();
}

function toggleSubscript() {
  editor?.chain().focus().toggleSubscript().run();
}

function toggleSuperscript() {
  editor?.chain().focus().toggleSuperscript().run();
}

function toggleHeading3() {
  editor?.chain().focus().toggleHeading({ level: 3 }).run();
}

function toggleBulletList() {
  editor?.chain().focus().toggleBulletList().run();
}

function toggleOrderedList() {
  editor?.chain().focus().toggleOrderedList().run();
}

function undo() {
  editor?.chain().focus().undo().run();
}

function redo() {
  editor?.chain().focus().redo().run();
}

function insertTable() {
  editor?.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: false }).run();
}

function addRowAfter() {
  editor?.chain().focus().addRowAfter().run();
}

function deleteRow() {
  editor?.chain().focus().deleteRow().run();
}

function addColumnAfter() {
  editor?.chain().focus().addColumnAfter().run();
}

function deleteColumn() {
  editor?.chain().focus().deleteColumn().run();
}

function deleteTable() {
  editor?.chain().focus().deleteTable().run();
}

function toggleTableBorder() {
  if (!editor) return;
  const tableAttrs = editor.getAttributes('table');
  const update = {
    ...tableAttrs,
    border: tableAttrs.border !== '0' ? '0' : '1',
  };
  editor.commands.updateAttributes('table', update);
}

function setTextAlign(alignment: string) {
  editor?.chain().focus().setTextAlign(alignment).run();
  showAlignMenu = false;
}

function insertImage() {
  const url = window.prompt('Enter image URL:');
  if (url) {
    editor?.chain().focus().setImage({ src: url }).run();
  }
}

function handleMouseDown(e: MouseEvent) {
  e.preventDefault();
}

function handleDoneClick() {
  if (editor) {
    const html = editor.getHTML();
    if (onChange) {
      onChange(html);
    }
    editor.commands.blur();
  }
}
</script>

<div
  class="editor-container editable-html"
  style="position: relative; padding: 0; border: 1px solid #ccc; border-radius: 4px; cursor: text; background-color: var(--pie-background, white); width: 100%;"
>
  <!-- Editor Content -->
  <div
    class="editor-holder"
    class:disabled={disabled}
    style="position: relative; padding: 0; overflow-y: auto; color: var(--pie-text, rgba(0, 0, 0, 0.87)); background-color: var(--pie-background, white); min-height: 120px;"
  >
    <div class="editor-children" style="padding: 10px 16px;">
      <div
        bind:this={editorElement}
        class="editor"
        style="padding: 5px; min-height: 100px;"
      ></div>
    </div>
  </div>

  <!-- Toolbar (bottom position by default) -->
  {#if showToolbar && editor}
    <div
      role="toolbar"
      tabindex="-1"
      class="toolbar"
      class:focused={isFocused}
      onmousedown={handleMouseDown}
      style={`position: absolute; z-index: 20; cursor: pointer; justify-content: space-between; background: var(--editable-html-toolbar-bg, #efefef); min-width: 280px; margin: 5px 0 0 0; padding: 2px; box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12); box-sizing: border-box; display: flex; top: 100%; left: 0; opacity: ${isFocused ? 1 : 0}; pointer-events: ${isFocused ? "auto" : "none"};`}
    >
      <div class="toolbar-content">
        <div class="toolbar-buttons">
        <!-- Table Insert (show when not in table) -->
        {#if !editorState.isTable}
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            disabled={!editorState.canTable}
            onclick={insertTable}
            title="Insert Table"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M10 10.02h5V21h-5zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10.02H3V19z"/></svg>'}
          </button>
        {/if}

        <!-- Table Controls (show when in table) -->
        {#if editorState.isTable}
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isTable}
            disabled={!editorState.canTable}
            onclick={addRowAfter}
            title="Add Row"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M22,10A2,2 0 0,1 20,12H4A2,2 0 0,1 2,10V3H4V5H8V3H10V5H14V3H16V5H20V3H22V10M4,10H8V7H4V10M10,10H14V7H10V10M20,10V7H16V10H20M11,14H13V17H16V19H13V22H11V19H8V17H11V14Z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isTable}
            disabled={!editorState.canTable}
            onclick={deleteRow}
            title="Delete Row"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9.41,13L12,15.59L14.59,13L16,14.41L13.41,17L16,19.59L14.59,21L12,18.41L9.41,21L8,19.59L10.59,17L8,14.41L9.41,13M22,9A2,2 0 0,1 20,11H4A2,2 0 0,1 2,9V6A2,2 0 0,1 4,4H20A2,2 0 0,1 22,6V9M4,9H8V6H4V9M10,9H14V6H10V9M16,9H20V6H16V9Z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isTable}
            disabled={!editorState.canTable}
            onclick={addColumnAfter}
            title="Add Column"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M11,2A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H2V2H11M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M15,11H18V8H20V11H23V13H20V16H18V13H15V11Z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isTable}
            disabled={!editorState.canTable}
            onclick={deleteColumn}
            title="Delete Column"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isTable}
            disabled={!editorState.canTable}
            onclick={deleteTable}
            title="Delete Table"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.46,15.88L16.88,14.46L19,16.59L21.12,14.46L22.54,15.88L20.41,18L22.54,20.12L21.12,21.54L19,19.41L16.88,21.54L15.46,20.12L17.59,18L15.46,15.88M4,3H18A2,2 0 0,1 20,5V12.08C18.45,11.82 16.92,12.18 15.68,13H12V17H13.08C12.97,17.68 12.97,18.35 13.08,19H4A2,2 0 0,1 2,17V5A2,2 0 0,1 4,3M4,7V11H10V7H4M12,7V11H18V7H12M4,13V17H10V13H4Z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.tableHasBorder}
            disabled={!editorState.canTable}
            onclick={toggleTableBorder}
            title="Toggle Table Border"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/></svg>'}
          </button>
        {/if}

        <!-- Text Formatting (hide when in table) -->
        {#if !editorState.isTable}
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isBold}
            disabled={!editorState.canBold}
            onclick={toggleBold}
            title="Bold"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isItalic}
            disabled={!editorState.canItalic}
            onclick={toggleItalic}
            title="Italic"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isStrike}
            disabled={!editorState.canStrike}
            onclick={toggleStrike}
            title="Strikethrough"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isCode}
            disabled={!editorState.canCode}
            onclick={toggleCode}
            title="Code"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isUnderline}
            onclick={toggleUnderline}
            title="Underline"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isSubScript}
            onclick={toggleSubscript}
            title="Subscript"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M22,18h-2v1h3v1h-4v-2c0-0.55,0.45-1,1-1h2v-1h-3v-1h3c0.55,0,1,0.45,1,1v1C23,17.55,22.55,18,22,18z M5.88,18h2.66 l3.4-5.42h0.12l3.4,5.42h2.66l-4.65-7.27L17.81,4h-2.68l-3.07,4.99h-0.12L8.85,4H6.19l4.32,6.73L5.88,18z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isSuperScript}
            onclick={toggleSuperscript}
            title="Superscript"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M22,7h-2v1h3v1h-4V7c0-0.55,0.45-1,1-1h2V5h-3V4h3c0.55,0,1,0.45,1,1v1C23,6.55,22.55,7,22,7z M5.88,20h2.66l3.4-5.42h0.12 l3.4,5.42h2.66l-4.65-7.27L17.81,6h-2.68l-3.07,4.99h-0.12L8.85,6H6.19l4.32,6.73L5.88,20z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isHeading3}
            onclick={toggleHeading3}
            title="Heading"
          >
            {@html '<svg width="20" height="18" viewBox="0 0 30 28" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M27 4V24H29C29.5 24 30 24.5 30 25V27C30 27.5625 29.5 28 29 28H19C18.4375 28 18 27.5625 18 27V25C18 24.5 18.4375 24 19 24H21V16H9V24H11C11.5 24 12 24.5 12 25V27C12 27.5625 11.5 28 11 28H1C0.4375 28 0 27.5625 0 27V25C0 24.5 0.4375 24 1 24H3V4H1C0.4375 4 0 3.5625 0 3V1C0 0.5 0.4375 0 1 0H11C11.5 0 12 0.5 12 1V3C12 3.5625 11.5 4 11 4H9V12H21V4H19C18.4375 4 18 3.5625 18 3V1C18 0.5 18.4375 0 19 0H29C29.5 0 30 0.5 30 1V3C30 3.5625 29.5 4 29 4H27Z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            onclick={insertImage}
            title="Insert Image"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>'}
          </button>

          <!-- Text Alignment Dropdown -->
          <div class="align-dropdown">
            <button
              type="button"
              class="pie-toolbar-btn"
              style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
              onclick={() => showAlignMenu = !showAlignMenu}
              title="Text Alignment"
            >
              {#if editorState.textAlign === 'right'}
                {@html '<svg width="20" height="20" viewBox="0 0 66 66" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M65.625 4.75C65.625 7.38672 63.4277 9.4375 60.9375 9.4375H28.125C25.4883 9.4375 23.4375 7.38672 23.4375 4.75C23.4375 2.25977 25.4883 0.0625 28.125 0.0625H60.9375C63.4277 0.0625 65.625 2.25977 65.625 4.75ZM65.625 42.25C65.625 44.8867 63.4277 46.9375 60.9375 46.9375H28.125C25.4883 46.9375 23.4375 44.8867 23.4375 42.25C23.4375 39.7598 25.4883 37.5625 28.125 37.5625H60.9375C63.4277 37.5625 65.625 39.7598 65.625 42.25ZM0 23.5C0 21.0098 2.05078 18.8125 4.6875 18.8125H60.9375C63.4277 18.8125 65.625 21.0098 65.625 23.5C65.625 26.1367 63.4277 28.1875 60.9375 28.1875H4.6875C2.05078 28.1875 0 26.1367 0 23.5ZM65.625 61C65.625 63.6367 63.4277 65.6875 60.9375 65.6875H4.6875C2.05078 65.6875 0 63.6367 0 61C0 58.5098 2.05078 56.3125 4.6875 56.3125H60.9375C63.4277 56.3125 65.625 58.5098 65.625 61Z"/></svg>'}
              {:else if editorState.textAlign === 'center'}
                {@html '<svg width="20" height="20" viewBox="0 0 66 66" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M51.5625 4.75C51.5625 7.38672 49.3652 9.4375 46.875 9.4375H18.75C16.1133 9.4375 14.0625 7.38672 14.0625 4.75C14.0625 2.25977 16.1133 0.0625 18.75 0.0625H46.875C49.3652 0.0625 51.5625 2.25977 51.5625 4.75ZM65.625 23.5C65.625 26.1367 63.4277 28.1875 60.9375 28.1875H4.6875C2.05078 28.1875 0 26.1367 0 23.5C0 21.0098 2.05078 18.8125 4.6875 18.8125H60.9375C63.4277 18.8125 65.625 21.0098 65.625 23.5ZM0 61C0 58.5098 2.05078 56.3125 4.6875 56.3125H60.9375C63.4277 56.3125 65.625 58.5098 65.625 61C65.625 63.6367 63.4277 65.6875 60.9375 65.6875H4.6875C2.05078 65.6875 0 63.6367 0 61ZM51.5625 42.25C51.5625 44.8867 49.3652 46.9375 46.875 46.9375H18.75C16.1133 46.9375 14.0625 44.8867 14.0625 42.25C14.0625 39.7598 16.1133 37.5625 18.75 37.5625H46.875C49.3652 37.5625 51.5625 39.7598 51.5625 42.25Z"/></svg>'}
              {:else}
                {@html '<svg width="20" height="20" viewBox="0 0 66 66" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M42.1875 4.75C42.1875 7.38672 39.9902 9.4375 37.5 9.4375H4.6875C2.05078 9.4375 0 7.38672 0 4.75C0 2.25977 2.05078 0.0625 4.6875 0.0625H37.5C39.9902 0.0625 42.1875 2.25977 42.1875 4.75ZM42.1875 42.25C42.1875 44.8867 39.9902 46.9375 37.5 46.9375H4.6875C2.05078 46.9375 0 44.8867 0 42.25C0 39.7598 2.05078 37.5625 4.6875 37.5625H37.5C39.9902 37.5625 42.1875 39.7598 42.1875 42.25ZM0 23.5C0 21.0098 2.05078 18.8125 4.6875 18.8125H60.9375C63.4277 18.8125 65.625 21.0098 65.625 23.5C65.625 26.1367 63.4277 28.1875 60.9375 28.1875H4.6875C2.05078 28.1875 0 26.1367 0 23.5ZM65.625 61C65.625 63.6367 63.4277 65.6875 60.9375 65.6875H4.6875C2.05078 65.6875 0 63.6367 0 61C0 58.5098 2.05078 56.3125 4.6875 56.3125H60.9375C63.4277 56.3125 65.625 58.5098 65.625 61Z"/></svg>'}
              {/if}
              <span class="dropdown-arrow">▼</span>
            </button>
            {#if showAlignMenu}
              <div class="align-menu">
                <button
                  type="button"
                  class="align-menu-btn"
                  style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
                  onclick={() => setTextAlign('left')}
                  title="Align Left"
                >
                  {@html '<svg width="20" height="20" viewBox="0 0 66 66" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M42.1875 4.75C42.1875 7.38672 39.9902 9.4375 37.5 9.4375H4.6875C2.05078 9.4375 0 7.38672 0 4.75C0 2.25977 2.05078 0.0625 4.6875 0.0625H37.5C39.9902 0.0625 42.1875 2.25977 42.1875 4.75ZM42.1875 42.25C42.1875 44.8867 39.9902 46.9375 37.5 46.9375H4.6875C2.05078 46.9375 0 44.8867 0 42.25C0 39.7598 2.05078 37.5625 4.6875 37.5625H37.5C39.9902 37.5625 42.1875 39.7598 42.1875 42.25ZM0 23.5C0 21.0098 2.05078 18.8125 4.6875 18.8125H60.9375C63.4277 18.8125 65.625 21.0098 65.625 23.5C65.625 26.1367 63.4277 28.1875 60.9375 28.1875H4.6875C2.05078 28.1875 0 26.1367 0 23.5ZM65.625 61C65.625 63.6367 63.4277 65.6875 60.9375 65.6875H4.6875C2.05078 65.6875 0 63.6367 0 61C0 58.5098 2.05078 56.3125 4.6875 56.3125H60.9375C63.4277 56.3125 65.625 58.5098 65.625 61Z"/></svg>'}
                </button>
                <button
                  type="button"
                  class="align-menu-btn"
                  style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
                  onclick={() => setTextAlign('center')}
                  title="Align Center"
                >
                  {@html '<svg width="20" height="20" viewBox="0 0 66 66" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M51.5625 4.75C51.5625 7.38672 49.3652 9.4375 46.875 9.4375H18.75C16.1133 9.4375 14.0625 7.38672 14.0625 4.75C14.0625 2.25977 16.1133 0.0625 18.75 0.0625H46.875C49.3652 0.0625 51.5625 2.25977 51.5625 4.75ZM65.625 23.5C65.625 26.1367 63.4277 28.1875 60.9375 28.1875H4.6875C2.05078 28.1875 0 26.1367 0 23.5C0 21.0098 2.05078 18.8125 4.6875 18.8125H60.9375C63.4277 18.8125 65.625 21.0098 65.625 23.5ZM0 61C0 58.5098 2.05078 56.3125 4.6875 56.3125H60.9375C63.4277 56.3125 65.625 58.5098 65.625 61C65.625 63.6367 63.4277 65.6875 60.9375 65.6875H4.6875C2.05078 65.6875 0 63.6367 0 61ZM51.5625 42.25C51.5625 44.8867 49.3652 46.9375 46.875 46.9375H18.75C16.1133 46.9375 14.0625 44.8867 14.0625 42.25C14.0625 39.7598 16.1133 37.5625 18.75 37.5625H46.875C49.3652 37.5625 51.5625 39.7598 51.5625 42.25Z"/></svg>'}
                </button>
                <button
                  type="button"
                  class="align-menu-btn"
                  style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
                  onclick={() => setTextAlign('right')}
                  title="Align Right"
                >
                  {@html '<svg width="20" height="20" viewBox="0 0 66 66" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M65.625 4.75C65.625 7.38672 63.4277 9.4375 60.9375 9.4375H28.125C25.4883 9.4375 23.4375 7.38672 23.4375 4.75C23.4375 2.25977 25.4883 0.0625 28.125 0.0625H60.9375C63.4277 0.0625 65.625 2.25977 65.625 4.75ZM65.625 42.25C65.625 44.8867 63.4277 46.9375 60.9375 46.9375H28.125C25.4883 46.9375 23.4375 44.8867 23.4375 42.25C23.4375 39.7598 25.4883 37.5625 28.125 37.5625H60.9375C63.4277 37.5625 65.625 39.7598 65.625 42.25ZM0 23.5C0 21.0098 2.05078 18.8125 4.6875 18.8125H60.9375C63.4277 18.8125 65.625 21.0098 65.625 23.5C65.625 26.1367 63.4277 28.1875 60.9375 28.1875H4.6875C2.05078 28.1875 0 26.1367 0 23.5ZM65.625 61C65.625 63.6367 63.4277 65.6875 60.9375 65.6875H4.6875C2.05078 65.6875 0 63.6367 0 61C0 58.5098 2.05078 56.3125 4.6875 56.3125H60.9375C63.4277 56.3125 65.625 58.5098 65.625 61Z"/></svg>'}
                </button>
              </div>
            {/if}
          </div>

          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isBulletList}
            onclick={toggleBulletList}
            title="Bullet List"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            class:active={editorState.isOrderedList}
            onclick={toggleOrderedList}
            title="Numbered List"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            disabled={!editorState.canUndo}
            onclick={undo}
            title="Undo"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>'}
          </button>
          <button
            type="button"
            class="pie-toolbar-btn"
            style="border: none; background: none; padding: 2px; color: grey; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
            disabled={!editorState.canRedo}
            onclick={redo}
            title="Redo"
          >
            {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>'}
          </button>
        {/if}
        </div>

        <!-- Done Button -->
        <button
          type="button"
          class="done-btn"
          style="border: none; background: none; padding: 2px; color: #00bb00; display: inline-flex; cursor: pointer; align-items: center; justify-content: center;"
          onclick={handleDoneClick}
          title="Done"
        >
          {@html '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.editor-container) {
    position: relative;
    padding: 0px;
    border: 1px solid #ccc;
    border-radius: 4px;
    cursor: text;
    background-color: var(--pie-background, white);
    width: 100%;
  }

  :global(.editor-holder) {
    position: relative;
    padding: 0px;
    overflow-y: auto;
    color: var(--pie-text, rgba(0, 0, 0, 0.87));
    background-color: var(--pie-background, white);
    min-height: 120px;
  }

  :global(.editor-holder.disabled) {
    background-color: var(--pie-background-dark, #f5f5f5);
    cursor: not-allowed;
  }

  :global(.editor-children) {
    padding: 10px 16px;
  }

  :global(.editor) {
    padding: 5px;
    min-height: 100px;
  }

  /* Toolbar styles matching React version EXACTLY */
  :global(.toolbar) {
    position: absolute;
    z-index: 20;
    cursor: pointer;
    justify-content: space-between;
    background: var(--editable-html-toolbar-bg, #efefef);
    min-width: 280px;
    margin: 5px 0 0 0;
    padding: 2px;
    box-shadow:
      0px 1px 5px 0px rgba(0, 0, 0, 0.2),
      0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12);
    box-sizing: border-box;
    display: flex;
    opacity: 0;
    pointer-events: none;
    top: 100%;
    left: 0;
  }

  :global(.toolbar.focused) {
    opacity: 1;
    pointer-events: auto;
  }

  :global(.toolbar-content) {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }

  :global(.toolbar-buttons) {
    align-items: center;
    display: flex;
    width: 100%;
  }

  :global(.toolbar button.pie-toolbar-btn) {
    /* Reset all browser defaults */
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;

    /* Core button styling - matching React MenuBar exactly */
    color: grey !important;
    display: inline-flex !important;
    padding: 2px !important;
    background: none !important;
    border: 0 !important;
    border-width: 0 !important;
    border-style: none !important;
    outline: none !important;
    box-shadow: none !important;
    cursor: pointer !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: auto !important;
    width: auto !important;
    height: auto !important;
    margin: 0 !important;
    font: inherit !important;
    text-align: inherit !important;
    text-transform: none !important;
  }

  :global(.pie-toolbar-btn:hover:not(:disabled)) {
    color: black;
  }

  :global(.pie-toolbar-btn:focus) {
    outline: 2px solid #666;
  }

  :global(.pie-toolbar-btn:disabled) {
    opacity: 0.7;
    cursor: not-allowed;
  }

  :global(.pie-toolbar-btn:disabled:hover) {
    color: grey;
  }

  :global(.pie-toolbar-btn.active) {
    background: var(--pie-primary, #9c27b0);
    color: var(--pie-white, #ffffff);
  }

  :global(.pie-toolbar-btn svg) {
    width: 24px;
    height: 24px;
  }

  /* Done Button - matching React DoneButton component */
  :global(.done-btn) {
    vertical-align: top;
    width: 28px;
    height: 28px;
    color: var(--editable-html-toolbar-check, #00bb00);
    padding: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
  }

  :global(.done-btn:hover) {
    background-color: rgba(0, 187, 0, 0.08);
    border-radius: 4px;
  }

  :global(.done-btn svg) {
    width: 24px;
    height: 24px;
  }

  /* Text alignment dropdown */
  :global(.align-dropdown) {
    position: relative;
  }

  :global(.dropdown-arrow) {
    margin-left: 2px;
    font-size: 8px;
  }

  :global(.align-menu) {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--pie-white, #fff);
    display: flex;
    flex-direction: row;
    padding: 2px;
    box-shadow:
      0px 1px 5px 0px rgba(0, 0, 0, 0.2),
      0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12);
    z-index: 30;
  }

  :global(.align-menu-btn) {
    color: var(--pie-disabled, grey);
    display: inline-flex;
    padding: 4px;
    background: none;
    border: none;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    min-height: 32px;
  }

  :global(.align-menu-btn:hover) {
    color: var(--pie-black, black);
    background-color: rgba(0, 0, 0, 0.04);
  }

  /* ProseMirror editor styles */
  :global(.ProseMirror) {
    outline: none !important;
    min-height: 100px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: var(--pie-text, rgba(0, 0, 0, 0.87));
  }

  :global(.ProseMirror p) {
    margin: 0;
  }

  :global(.ProseMirror ul),
  :global(.ProseMirror ol) {
    padding: 0 1rem;
    margin: 1.25rem 1rem 1.25rem 0.4rem;
  }

  :global(.ProseMirror ul li p),
  :global(.ProseMirror ol li p) {
    margin-top: 0.25em;
    margin-bottom: 0.25em;
  }

  :global(.ProseMirror h1),
  :global(.ProseMirror h2),
  :global(.ProseMirror h3),
  :global(.ProseMirror h4),
  :global(.ProseMirror h5),
  :global(.ProseMirror h6) {
    line-height: 1.1;
    margin-top: 2.5rem;
    text-wrap: pretty;
  }

  :global(.ProseMirror h1),
  :global(.ProseMirror h2) {
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
  }

  :global(.ProseMirror h1) {
    font-size: 1.4rem;
  }

  :global(.ProseMirror h2) {
    font-size: 1.2rem;
  }

  :global(.ProseMirror h3) {
    font-size: 1.1rem;
  }

  :global(.ProseMirror h4),
  :global(.ProseMirror h5),
  :global(.ProseMirror h6) {
    font-size: 1rem;
  }

  :global(.ProseMirror code) {
    background-color: rgba(88, 5, 255, 0.05);
    border-radius: 0.4rem;
    color: #2e2b29;
    font-size: 0.85rem;
    padding: 0.25em 0.3em;
  }

  :global(.ProseMirror pre) {
    background: #2e2b29;
    border-radius: 0.5rem;
    color: #fff;
    font-family: 'JetBrainsMono', monospace;
    margin: 1.5rem 0;
    padding: 0.75rem 1rem;
  }

  :global(.ProseMirror pre code) {
    background: none;
    color: inherit;
    font-size: 0.8rem;
    padding: 0;
  }

  :global(.ProseMirror blockquote) {
    border-left: 3px solid rgba(61, 37, 20, 0.12);
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  :global(.ProseMirror hr) {
    border: none;
    border-top: 1px solid rgba(61, 37, 20, 0.08);
    margin: 2rem 0;
  }

  :global(.ProseMirror img) {
    max-width: 100%;
    height: auto;
  }

  /* Table styles */
  :global(.ProseMirror table) {
    table-layout: fixed;
    width: 100%;
    border-collapse: collapse;
    color: var(--pie-text, rgba(0, 0, 0, 0.87));
    background-color: var(--pie-background, white);
    margin: 1rem 0;
  }

  :global(.ProseMirror table:not([border="1"]) tr) {
    border-top: 1px solid #dfe2e5;
  }

  :global(.ProseMirror td),
  :global(.ProseMirror th) {
    padding: 0.6em 1em;
    text-align: center;
    vertical-align: top;
    position: relative;
  }

  :global(.ProseMirror table:not([border="1"]) td),
  :global(.ProseMirror table:not([border="1"]) th) {
    border: 1px solid #dfe2e5;
  }

  :global(.ProseMirror table[border="1"]) {
    border: 2px solid var(--pie-black, #000);
  }

  :global(.ProseMirror table[border="1"] td),
  :global(.ProseMirror table[border="1"] th) {
    border: 1px solid var(--pie-black, #000);
  }

  :global(.ProseMirror .selectedCell) {
    background-color: rgba(200, 200, 255, 0.4);
  }

  /* Placeholder */
  :global(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: #adb5bd;
    pointer-events: none;
    height: 0;
  }

  :global(.ProseMirror:focus) {
    outline: none;
  }
</style>
