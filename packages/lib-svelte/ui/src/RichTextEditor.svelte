<script lang="ts">
// @ts-expect-error - Editor and extensions used dynamically in configuration
import { Editor } from '@tiptap/core';
import Blockquote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';
import Image from '@tiptap/extension-image';
import Mathematics from '@tiptap/extension-mathematics';
import Placeholder from '@tiptap/extension-placeholder';
import Strike from '@tiptap/extension-strike';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import 'katex/dist/katex.min.css';
import { convertLatexToMathMLInHtml } from './math-utils';
import { sanitizeHtml } from './sanitize';

interface ImageSupport {
  add: (handler: (file: File) => Promise<string>) => void;
  delete?: (src: string, done: () => void) => void;
}

interface ToolbarOptions {
  position?: 'top' | 'bottom';
  alignment?: 'left' | 'right';
  alwaysVisible?: boolean;
  showDone?: boolean;
  doneOn?: 'blur' | string;
  minWidth?: string | number;
  isHidden?: boolean;
}

interface LanguageCharacterConfig {
  language: string;
  characterIcon?: string;
  characters?: string[][];
}

interface MathMLOptions {
  mmlOutput?: boolean; // Convert LaTeX to MathML for output
  mmlEditing?: boolean; // Edit MathML content as LaTeX
}

interface Props {
  value?: string;
  editable?: boolean;
  placeholder?: string;
  minHeight?: number;
  onChange?: (html: string) => void;

  // Sizing options
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  height?: string | number;
  maxHeight?: number;

  // Content restrictions
  charactersLimit?: number;
  nonEmpty?: boolean;

  // Behavior
  spellCheck?: boolean;
  disabled?: boolean;
  disableUnderline?: boolean;

  // Callbacks
  onFocus?: () => void;
  onBlur?: (event: FocusEvent) => void;

  // Math options
  mathMlOptions?: MathMLOptions;

  // Toolbar configuration
  toolbarOpts?: ToolbarOptions;

  // Image support
  imageSupport?: ImageSupport;
  maxImageWidth?: number;
  maxImageHeight?: number;
  disableImageAlignmentButtons?: boolean;

  // Language characters
  languageCharactersProps?: LanguageCharacterConfig[];
}

const {
  value = '',
  editable = true,
  placeholder = 'Enter text...',
  minHeight = 150,
  onChange,
  width,
  minWidth,
  maxWidth,
  height,
  maxHeight,
  charactersLimit,
  nonEmpty = false,
  spellCheck = true,
  disabled = false,
  disableUnderline = false,
  onFocus,
  onBlur,
  mathMlOptions,
  toolbarOpts = {},
  imageSupport,
  maxImageWidth,
  maxImageHeight,
  disableImageAlignmentButtons = false,
  languageCharactersProps = [],
}: Props = $props();

let el = $state<HTMLDivElement>();
let editor = $state<Editor>();
let lastEmitted = $state('');
let isProgrammaticUpdate = $state(false);
let isInitializing = $state(true);
let _canUndo = $state(false);
let _canRedo = $state(false);
let fileInput = $state<HTMLInputElement>();
let showCharacterPicker = $state(false);
let _currentCharacters = $state<string[][]>([]);
let activeCharacterLanguage = $state<string>('');

// Initialize editor once
$effect(() => {
  if (!el) return;

  const extensions = [
    StarterKit.configure({
      codeBlock: false,
      blockquote: false, // Using dedicated extension
      heading: false, // Using dedicated extension
    }),
    Blockquote,
    Heading.configure({
      levels: [3], // Only H3 like old implementation
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Placeholder.configure({
      placeholder,
    }),
    Mathematics.configure({
      katexOptions: {
        throwOnError: false,
      },
    }),
  ];

  // Add text formatting extensions
  if (!disableUnderline) {
    extensions.push(Underline);
  }
  extensions.push(Strike, Superscript, Subscript);

  // Add Image extension if imageSupport is provided
  if (imageSupport) {
    extensions.push(
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          style:
            maxImageWidth || maxImageHeight
              ? `max-width: ${maxImageWidth || 'none'}px; max-height: ${maxImageHeight || 'none'}px;`
              : undefined,
        },
      })
    );
  }

  editor = new Editor({
    element: el,
    extensions,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `min-height: ${minHeight}px`,
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': placeholder,
        spellcheck: spellCheck ? 'true' : 'false',
      },
      handleDOMEvents: {
        focus: () => {
          onFocus?.();
          return false;
        },
        blur: (_view, event) => {
          onBlur?.(event as FocusEvent);
          return false;
        },
      },
    },
    content: value || '<p></p>',
    editable: editable && !disabled,
    onUpdate: ({ editor: e }) => {
      emit(e.getHTML());
      _canUndo = e.can().undo();
      _canRedo = e.can().redo();
    },
    onCreate: () => {
      lastEmitted = value || '<p></p>';
      isInitializing = false;
      if (editor) {
        _canUndo = editor.can().undo();
        _canRedo = editor.can().redo();
      }
    },
  });

  return () => {
    editor?.destroy();
  };
});

// Sync editable state
$effect(() => {
  if (editor) {
    editor.setEditable(editable && !disabled);
  }
});

// External value updates
$effect(() => {
  if (!editor || editor.isFocused) return;

  let processedValue = value || '';

  // Convert MathML to LaTeX for editing if requested
  if (mathMlOptions?.mmlEditing && processedValue) {
    // Note: Full MathML → LaTeX conversion is complex and may not be perfect
    // This is a placeholder for now. In practice, if the input has MathML,
    // we would need to parse and extract LaTeX from annotations or convert
    processedValue = value || '';
  }

  const sanitized = sanitizeHtml(processedValue);
  const currentContent = editor.getHTML();
  if (sanitized !== currentContent && sanitized !== lastEmitted) {
    isProgrammaticUpdate = true;
    editor.commands.setContent(sanitized || '<p></p>', { emitUpdate: false });
    lastEmitted = sanitized;
    isProgrammaticUpdate = false;
  }
});

async function emit(html: string) {
  if (isProgrammaticUpdate || isInitializing) return;

  // Enforce character limit if set
  if (charactersLimit && editor) {
    const textLength = editor.getText().length;
    if (textLength > charactersLimit) {
      return; // Don't emit if over limit
    }
  }

  let outputHtml = html;

  // Convert LaTeX to MathML if requested
  if (mathMlOptions?.mmlOutput) {
    try {
      outputHtml = await convertLatexToMathMLInHtml(html);
    } catch (error) {
      console.error('Error converting LaTeX to MathML:', error);
    }
  }

  // Sanitize HTML before emitting
  const sanitized = sanitizeHtml(outputHtml);
  lastEmitted = sanitized;
  onChange?.(sanitized);
}

// Toolbar functions
function _toggleBold() {
  editor?.chain().focus().toggleBold().run();
}

function _toggleItalic() {
  editor?.chain().focus().toggleItalic().run();
}

function _toggleUnderline() {
  if (!disableUnderline) {
    editor?.chain().focus().toggleUnderline().run();
  }
}

function _toggleStrike() {
  editor?.chain().focus().toggleStrike().run();
}

function _toggleSuperscript() {
  editor?.chain().focus().toggleSuperscript().run();
}

function _toggleSubscript() {
  editor?.chain().focus().toggleSubscript().run();
}

function _toggleBulletList() {
  editor?.chain().focus().toggleBulletList().run();
}

function _toggleOrderedList() {
  editor?.chain().focus().toggleOrderedList().run();
}

function _toggleBlockquote() {
  editor?.chain().focus().toggleBlockquote().run();
}

function _toggleHeading() {
  editor?.chain().focus().toggleHeading({ level: 3 }).run();
}

function _setTextAlign(alignment: 'left' | 'center' | 'right' | 'justify') {
  editor?.chain().focus().setTextAlign(alignment).run();
}

function _undo() {
  editor?.chain().focus().undo().run();
}

function _redo() {
  editor?.chain().focus().redo().run();
}

// Image support
function _openImagePicker() {
  fileInput?.click();
}

async function _handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !imageSupport) return;

  // Reset file input
  (e.target as HTMLInputElement).value = '';

  try {
    // Call the imageSupport.add callback which handles the upload
    await new Promise<void>((resolve, reject) => {
      imageSupport.add(async (uploadedFile: File) => {
        try {
          // Convert to data URL
          const reader = new FileReader();
          reader.onload = () => {
            const src = reader.result as string;
            editor?.chain().focus().setImage({ src }).run();
            resolve();
          };
          reader.onerror = reject;
          reader.readAsDataURL(uploadedFile);
          return '';
        } catch (error) {
          reject(error);
          return '';
        }
      });
    });
  } catch (error) {
    console.error('Failed to upload image:', error);
  }
}

// Language character picker
function _toggleCharacterPicker(language: string) {
  if (activeCharacterLanguage === language && showCharacterPicker) {
    showCharacterPicker = false;
    activeCharacterLanguage = '';
    return;
  }

  const langConfig = languageCharactersProps.find((lc) => lc.language === language);
  if (langConfig) {
    _currentCharacters = langConfig.characters || getDefaultCharacters(language);
    showCharacterPicker = true;
    activeCharacterLanguage = language;
  }
}

function _insertCharacter(char: string) {
  editor?.chain().focus().insertContent(char).run();
}

function getDefaultCharacters(language: string): string[][] {
  if (language === 'spanish') {
    return [
      ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ'],
      ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ü', 'Ñ'],
      ['¿', '¡'],
    ];
  }
  if (language === 'special') {
    return [
      ['→', '←', '↑', '↓', '↔', '↕'],
      ['≤', '≥', '≠', '≈', '∞', '∑', '∏'],
      ['α', 'β', 'γ', 'δ', 'θ', 'π', 'σ'],
    ];
  }
  return [];
}

// Compute toolbar position class
const _toolbarPositionClass = $derived(
  toolbarOpts.position === 'bottom' ? 'toolbar-bottom' : 'toolbar-top'
);
const _toolbarAlignmentClass = $derived(toolbarOpts.alignment === 'right' ? 'toolbar-right' : '');
</script>

<div
  class="rich-text-editor"
  class:rich-text-editor-disabled={disabled}
  style:width={width}
  style:min-width={minWidth}
  style:max-width={maxWidth}
  style:height={height}
  style:max-height={maxHeight}
>
	{#if editable && !toolbarOpts.isHidden}
		<div
			class="toolbar {toolbarPositionClass} {toolbarAlignmentClass}"
			class:always-visible={toolbarOpts.alwaysVisible}
			style:min-width={toolbarOpts.minWidth}
		>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={undo}
				disabled={!canUndo}
				title="Undo (Ctrl+Z)"
				aria-label="Undo"
			>
				↶
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={redo}
				disabled={!canRedo}
				title="Redo (Ctrl+Y)"
				aria-label="Redo"
			>
				↷
			</button>

			<div class="divider divider-horizontal"></div>

			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleBold}
				title="Bold (Ctrl+B)"
				aria-label="Bold"
			>
				<strong>B</strong>
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleItalic}
				title="Italic (Ctrl+I)"
				aria-label="Italic"
			>
				<em>I</em>
			</button>
			{#if !disableUnderline}
				<button
					type="button"
					class="btn btn-xs btn-ghost"
					onclick={toggleUnderline}
					title="Underline (Ctrl+U)"
					aria-label="Underline"
				>
					<u>U</u>
				</button>
			{/if}
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleStrike}
				title="Strikethrough"
				aria-label="Strikethrough"
			>
				<del>S</del>
			</button>

			<div class="divider divider-horizontal"></div>

			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleSuperscript}
				title="Superscript"
				aria-label="Superscript"
			>
				x<sup>2</sup>
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleSubscript}
				title="Subscript"
				aria-label="Subscript"
			>
				x<sub>2</sub>
			</button>

			<div class="divider divider-horizontal"></div>

			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleBulletList}
				title="Bullet List"
				aria-label="Bullet list"
			>
				•
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleOrderedList}
				title="Numbered List"
				aria-label="Numbered list"
			>
				1.
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleBlockquote}
				title="Blockquote"
				aria-label="Blockquote"
			>
				❝
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={toggleHeading}
				title="Heading"
				aria-label="Heading level 3"
			>
				H<sub>3</sub>
			</button>

			<div class="divider divider-horizontal"></div>

			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={() => setTextAlign('left')}
				title="Align Left"
				aria-label="Align left"
			>
				⬅
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={() => setTextAlign('center')}
				title="Align Center"
				aria-label="Align center"
			>
				↔
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={() => setTextAlign('right')}
				title="Align Right"
				aria-label="Align right"
			>
				➡
			</button>
			<button
				type="button"
				class="btn btn-xs btn-ghost"
				onclick={() => setTextAlign('justify')}
				title="Justify"
				aria-label="Justify"
			>
				≡
			</button>

			{#if imageSupport}
				<div class="divider divider-horizontal"></div>
				<button
					type="button"
					class="btn btn-xs btn-ghost"
					onclick={openImagePicker}
					title="Insert Image"
					aria-label="Insert image"
				>
					🖼
				</button>
				<input
					type="file"
					accept="image/jpeg,image/jpg,image/png"
					bind:this={fileInput}
					onchange={handleImageUpload}
					style="display: none"
					aria-label="Choose image file"
				/>
			{/if}

			{#if languageCharactersProps.length > 0}
				<div class="divider divider-horizontal"></div>
				{#each languageCharactersProps as langConfig}
					<button
						type="button"
						class="btn btn-xs btn-ghost"
						class:btn-active={showCharacterPicker && activeCharacterLanguage === langConfig.language}
						onclick={() => toggleCharacterPicker(langConfig.language)}
						title={`${langConfig.language} characters`}
						aria-label={`${langConfig.language} character picker`}
						aria-pressed={showCharacterPicker && activeCharacterLanguage === langConfig.language}
					>
						{langConfig.characterIcon || '⌨'}
					</button>
				{/each}
			{/if}
		</div>

		{#if showCharacterPicker}
			<div class="character-picker" role="region" aria-label="Character picker">
				{#each currentCharacters as row}
					<div class="character-row">
						{#each row as char}
							<button
								type="button"
								class="btn btn-xs btn-ghost character-btn"
								onclick={() => insertCharacter(char)}
								aria-label={`Insert ${char}`}
							>
								{char}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
	<div class="editor-container" bind:this={el}></div>
</div>

<style>
	.rich-text-editor {
		border: 1px solid oklch(var(--bc) / 0.2);
		border-radius: var(--rounded-box, 1rem);
		background: oklch(var(--b1));
		display: flex;
		flex-direction: column;
	}

	.rich-text-editor-disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.toolbar {
		display: flex;
		gap: 0.25rem;
		padding: 0.5rem;
		border-bottom: 1px solid oklch(var(--bc) / 0.1);
		flex-wrap: wrap;
		align-items: center;
		order: 0;
	}

	.toolbar-bottom {
		order: 2;
		border-bottom: none;
		border-top: 1px solid oklch(var(--bc) / 0.1);
	}

	.toolbar-top {
		order: 0;
	}

	.toolbar-right {
		justify-content: flex-end;
	}

	.toolbar.always-visible {
		/* Always show toolbar even when editor not focused */
	}

	.divider {
		width: 1px;
		height: 1.5rem;
		background: oklch(var(--bc) / 0.2);
		margin: 0 0.25rem;
	}

	.character-picker {
		padding: 0.5rem;
		border-bottom: 1px solid oklch(var(--bc) / 0.1);
		background: oklch(var(--b2) / 0.5);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		order: 1;
	}

	.character-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.character-btn {
		min-width: 2rem;
		font-size: 1.1em;
	}

	.editor-container {
		padding: 0.75rem;
		order: 1;
		flex: 1;
	}

	.toolbar-bottom + .character-picker + .editor-container,
	.character-picker + .editor-container {
		order: 1;
	}

	.editor-container:focus-within {
		outline: 2px solid oklch(var(--p));
		outline-offset: -2px;
	}

	:global(.rich-text-editor .ProseMirror) {
		min-height: inherit;
	}

	:global(.rich-text-editor .ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: oklch(var(--bc) / 0.4);
		pointer-events: none;
		height: 0;
	}

	/* Text alignment styles */
	:global(.rich-text-editor .ProseMirror p[style*='text-align: left']) {
		text-align: left;
	}

	:global(.rich-text-editor .ProseMirror p[style*='text-align: center']) {
		text-align: center;
	}

	:global(.rich-text-editor .ProseMirror p[style*='text-align: right']) {
		text-align: right;
	}

	:global(.rich-text-editor .ProseMirror p[style*='text-align: justify']) {
		text-align: justify;
	}

	/* Image styles */
	:global(.rich-text-editor .ProseMirror img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.25rem;
	}
</style>
