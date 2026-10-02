import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const hasImageFile = (data: DataTransfer) =>
  Array.from(data.items ?? []).some(
    (item) => item.kind === 'file' && item.type.startsWith('image/')
  );

/**
 * Pastes rich text copied from outside a PIE editor as plain text, as the Slate editor did. Parsed
 * as HTML, a paste from Word keeps its alignment, its `<span>` wrappers and, wherever it styles
 * text with CSS alone, its bold and italics (PIE-1145).
 *
 * Mirrors `packages/lib-react/editable-html-tip-tap/src/extensions/plain-text-paste.ts`.
 */
export const PlainTextPaste = Extension.create({
  name: 'plainTextPaste',

  // The React editor needs this ahead of its image paste handler; kept so the two stay identical.
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

            // ProseMirror marks its own copies, so content copied from a PIE editor pastes intact.
            if (!html || html.includes('data-pm-slice')) {
              return false;
            }

            const text = data.getData('text/plain');
            const isWordTextPicture =
              Array.from(data.types).includes('text/rtf') && text.trim() !== '';

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
