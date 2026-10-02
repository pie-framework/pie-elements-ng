import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const hasImageFile = (data: DataTransfer) =>
  Array.from(data.items ?? []).some((item) => item.kind === 'file' && item.type.startsWith('image/'));

/**
 * Pastes rich text copied from outside a PIE editor as plain text, as the Slate editor did. Parsed
 * as HTML, a paste from Word keeps its fonts, sizes, colours, alignment and class names through
 * TextStyleKit, TextAlign and CSSMark (PIE-1145).
 *
 * Mirrored in `packages/lib-svelte/editable-html-tiptap-svelte/src/plain-text-paste.ts`. Upstream
 * pie-lib has no such file, so upstream sync preserves this one and re-registers it in
 * `EditableHtml.tsx` (`preserve.editable-html-tip-tap.plain-text-paste`).
 */
export const PlainTextPaste = Extension.create({
  name: 'plainTextPaste',

  // Ahead of ImageUploadNode's paste handler, which would otherwise upload the picture of the
  // copied text that Word puts on the clipboard next to the text itself.
  priority: 1000,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('plainTextPaste'),
        props: {
          handlePaste(view, event) {
            const data = event.clipboardData;

            // pasteText below runs handlePaste again with a synthetic event that has no clipboardData.
            if (!data) {
              return false;
            }

            const html = data.getData('text/html');

            // ProseMirror marks its own copies, so math, response areas and formatting copied from a
            // PIE editor paste intact.
            if (!html || html.includes('data-pm-slice')) {
              return false;
            }

            const text = data.getData('text/plain');
            const isWordTextPicture = Array.from(data.types).includes('text/rtf') && text.trim() !== '';

            if (!text || (hasImageFile(data) && !isWordTextPicture)) {
              return false;
            }

            view.pasteText(text);

            return true;
          },
        },
      }),
    ];
  },
});
