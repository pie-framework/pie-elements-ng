import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode, Slice } from '@tiptap/pm/model';
import { type EditorState, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';

const hasImageFile = (data: DataTransfer) =>
  Array.from(data.items ?? []).some((item) => item.kind === 'file' && item.type.startsWith('image/'));

const hasElement = (html: string, selector: string) =>
  new DOMParser().parseFromString(html, 'text/html').querySelector(selector) !== null;

// The attribute, not the string: HTML whose text mentions it is not a ProseMirror copy.
const isProseMirrorSlice = (html: string) => html.includes('data-pm-slice') && hasElement(html, '[data-pm-slice]');

// The markup PIE saves math as, which rendered PIE content keeps around MathJax's output.
const hasMath = (html: string) =>
  /data-latex|data-type="?mathml/.test(html) && hasElement(html, '[data-latex], [data-type="mathml"]');

// Set while pasteHTML parses rendered PIE content, so that transformPasted keeps its text and math.
let keepingTextAndMath = false;

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A run of `\r` before `\n` is one break, so a doubled CR does not read as a blank line.
const lines = (text: string) => text.replace(/\r*\n|\r/g, '\n').replace(/\n+$/, '');

/** What to insert in place of the HTML on `data`, or null to leave the event to ProseMirror. */
function externalContentOf(data: DataTransfer | null): { text: string; html: string } | null {
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

  return { text, html };
}

/**
 * The text and math of a parsed slice, one paragraph per textblock or table row, laid out as
 * pasteText lays out text: the source's marks and block types go, and the marks at the cursor apply.
 */
function textAndMath(slice: Slice, state: EditorState): Slice {
  const { schema } = state;
  const marks = state.selection.$from.marks();
  const inlineOf = (node: ProseMirrorNode) => {
    const content: ProseMirrorNode[] = [];
    node.descendants((child) => {
      if (child.isTextblock && content.length) content.push(schema.text(' ', marks));
      if (child.isText && child.text) content.push(schema.text(child.text, marks));
      if (child.type === schema.nodes.math) content.push(child.mark([]));
      return !child.isInline;
    });
    return content;
  };
  const lines: ProseMirrorNode[][] = [];

  if (slice.content.firstChild?.isInline) {
    lines.push(inlineOf(schema.nodes.paragraph.create(null, slice.content)));
  } else {
    slice.content.descendants((node) => {
      if (node.type.spec.tableRole === 'row') {
        const cells: ProseMirrorNode[][] = [];
        node.forEach((cell) => {
          cells.push(inlineOf(cell));
        });
        lines.push(cells.flatMap((cell, i) => (i ? [schema.text('\t', marks), ...cell] : cell)));
        return false;
      }
      if (node.isTextblock) {
        lines.push(inlineOf(node));
        return false;
      }
      return true;
    });
  }

  // prosemirror-model is not in the editor runtime's module map, so the slice is cut from a document
  // rather than constructed. Open at both ends, its first and last lines join the blocks they land in.
  const doc = schema.topNodeType.create(
    null,
    lines.map((line) => schema.nodes.paragraph.create(null, line))
  );
  return lines.length ? doc.slice(1, doc.content.size - 1) : doc.slice(0, 0);
}

function insertPlainText(view: EditorView, { text, html }: { text: string; html: string }) {
  const { selection } = view.state;

  // prosemirror-tables repeats a non-table slice into every selected cell, so tab-separated rows,
  // as a spreadsheet copies them, go in as a table and spread across the selection.
  if ('$anchorCell' in selection) {
    const rows = lines(text)
      .split('\n')
      .map((row) => `<tr>${row.split('\t').map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`);
    view.pasteHTML(`<table><tbody>${rows.join('')}</tbody></table>`);
    return;
  }

  // Copied from rendered PIE content, math is MathJax's output around the saved markup, and its
  // text loses the TeX (`x^2+1` reads `𝑥2+1`). Parsing the HTML recovers the math nodes.
  if (view.state.schema.nodes.math && hasMath(html)) {
    keepingTextAndMath = true;
    try {
      view.pasteHTML(html);
    } finally {
      keepingTextAndMath = false;
    }
    return;
  }

  // ProseMirror drops blank lines from pasted text, and a trailing line break would save an empty
  // paragraph. Word's HTML kept blank lines as `&nbsp;` paragraphs.
  view.pasteText(selection.$from.parent.type.spec.code ? lines(text) : lines(text).replace(/^$/gm, '\u00a0'));
}

/**
 * Pastes and drops rich text from outside a PIE editor as plain text, as the Slate editor did,
 * except that math copied from rendered PIE content stays math. Parsed as HTML, content from Word
 * keeps its fonts, sizes, colours, alignment and class names through TextStyleKit, TextAlign and
 * CSSMark (PIE-1145).
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
          transformPasted(slice, view) {
            return keepingTextAndMath ? textAndMath(slice, view.state) : slice;
          },

          handlePaste(view, event) {
            // pasteText and pasteHTML run handlePaste again with a synthetic event, whose clipboard
            // data is null, or empty in Firefox, so externalContentOf leaves that one alone.
            const content = externalContentOf(event.clipboardData);

            if (content === null) {
              return false;
            }

            insertPlainText(view, content);

            return true;
          },

          handleDrop(view, event) {
            // A drag within the editor moves its own slice.
            const content = view.dragging ? null : externalContentOf(event.dataTransfer);
            const target = content === null ? null : view.posAtCoords({ left: event.clientX, top: event.clientY });

            if (content === null || !target) {
              return false;
            }

            view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(target.pos))));
            insertPlainText(view, content);
            view.focus();

            return true;
          },
        },
      }),
    ];
  },
});
