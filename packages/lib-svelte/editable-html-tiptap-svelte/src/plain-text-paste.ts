import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

const hasImageFile = (data: DataTransfer) =>
  Array.from(data.items ?? []).some(
    (item) => item.kind === 'file' && item.type.startsWith('image/')
  );

// The attribute, not the string: HTML whose text mentions it is not a ProseMirror copy.
const isProseMirrorSlice = (html: string) =>
  html.includes('data-pm-slice') &&
  new DOMParser().parseFromString(html, 'text/html').querySelector('[data-pm-slice]') !== null;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A run of `\r` before `\n` is one break, so a doubled CR does not read as a blank line.
const lines = (text: string) => text.replace(/\r*\n|\r/g, '\n').replace(/\n+$/, '');

/** The text to insert in place of the HTML on `data`, or null to leave the event to ProseMirror. */
function plainTextOf(data: DataTransfer | null): string | null {
  const html = data?.getData('text/html');

  // ProseMirror marks its own copies, so math, response areas and formatting copied from a PIE
  // editor paste intact.
  if (!data || !html || isProseMirrorSlice(html)) {
    return null;
  }

  const text = data.getData('text/plain');
  const isWordTextPicture = Array.from(data.types).includes('text/rtf') && text.trim() !== '';

  if (!text || (hasImageFile(data) && !isWordTextPicture)) {
    return null;
  }

  return text;
}

function insertPlainText(view: EditorView, text: string) {
  const { selection } = view.state;

  // prosemirror-tables repeats a non-table slice into every selected cell, so tab-separated rows,
  // as a spreadsheet copies them, go in as a table and spread across the selection.
  if ('$anchorCell' in selection) {
    const rows = lines(text)
      .split('\n')
      .map(
        (row) =>
          `<tr>${row
            .split('\t')
            .map((cell) => `<td>${escapeHtml(cell)}</td>`)
            .join('')}</tr>`
      );
    view.pasteHTML(`<table><tbody>${rows.join('')}</tbody></table>`);
    return;
  }

  // ProseMirror drops blank lines from pasted text, and a trailing line break would save an empty
  // paragraph. Word's HTML kept blank lines as `&nbsp;` paragraphs.
  view.pasteText(
    selection.$from.parent.type.spec.code ? lines(text) : lines(text).replace(/^$/gm, '\u00a0')
  );
}

/**
 * Pastes and drops rich text from outside a PIE editor as plain text, as the Slate editor did.
 * Parsed as HTML, content from Word keeps its alignment, its `<span>` wrappers and, wherever it
 * styles text with CSS alone, its bold and italics (PIE-1145).
 *
 * Mirrors `packages/lib-react/editable-html-tip-tap/src/plain-text-paste.ts`.
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
            // pasteText and pasteHTML run handlePaste again with a synthetic event, whose clipboard
            // data is null, or empty in Firefox, so plainTextOf leaves that one alone.
            const text = plainTextOf(event.clipboardData);

            if (text === null) {
              return false;
            }

            insertPlainText(view, text);

            return true;
          },

          handleDrop(view, event) {
            // A drag within the editor moves its own slice.
            const text = view.dragging ? null : plainTextOf(event.dataTransfer);
            const target =
              text === null ? null : view.posAtCoords({ left: event.clientX, top: event.clientY });

            if (text === null || !target) {
              return false;
            }

            view.dispatch(
              view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(target.pos)))
            );
            insertPlainText(view, text);
            view.focus();

            return true;
          },
        },
      }),
    ];
  },
});
