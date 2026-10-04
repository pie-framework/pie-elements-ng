import { Extension } from '@tiptap/core';
import type { Mark, Node as ProseMirrorNode, Schema, Slice } from '@tiptap/pm/model';
import { type EditorState, Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { rebuildWordLists } from './word-lists.js';

/** The formatting that content pasted from outside a PIE editor can keep, by mark or node name. */
export const PASTED_FORMATTING = [
  'bold',
  'italic',
  'underline',
  'strike',
  'superscript',
  'subscript',
  'bulletList',
  'orderedList',
  'table',
] as const;

export type PastedFormatting = (typeof PASTED_FORMATTING)[number];

export type ExternalPasteSettings = {
  /** Paste as plain text, as the Slate editor did. Math copied from rendered PIE content stays math. */
  plainText: boolean;
  /** The formatting a paste keeps. The rest becomes text: a list its items, a table its rows. */
  formatting: readonly PastedFormatting[];
};

export type ExternalPasteOptions = {
  /** Read at each paste and drop, so a mounted editor follows a change of toolbar or setting. */
  settings: () => ExternalPasteSettings;
};

type SliceFilter = (slice: Slice, state: EditorState) => Slice;

const hasImageFile = (data: DataTransfer) =>
  Array.from(data.items ?? []).some((item) => item.kind === 'file' && item.type.startsWith('image/'));

const hasElement = (html: string, selector: string) =>
  new DOMParser().parseFromString(html, 'text/html').querySelector(selector) !== null;

// The attribute, not the string: HTML whose text mentions it is not a ProseMirror copy.
const isProseMirrorSlice = (html: string) => html.includes('data-pm-slice') && hasElement(html, '[data-pm-slice]');

// The markup PIE saves math as, which rendered PIE content keeps around MathJax's output.
const hasMath = (html: string) =>
  /data-latex|data-type="?mathml/.test(html) && hasElement(html, '[data-latex], [data-type="mathml"]');

// Set while pasteHTML parses content from outside a PIE editor, for transformPasted to apply.
let filtering: SliceFilter | null = null;

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A run of `\r` before `\n` is one break, so a doubled CR does not read as a blank line.
const lines = (text: string) => text.replace(/\r*\n|\r/g, '\n').replace(/\n+$/, '');

const childrenOf = (node: Pick<ProseMirrorNode, 'forEach'>) => {
  const children: ProseMirrorNode[] = [];
  node.forEach((child) => {
    children.push(child);
  });
  return children;
};

/**
 * `blocks` as a slice open through its first and last blocks down to their text, short of a table,
 * as ProseMirror opens a slice of HTML from outside, so that the first and last lines join the
 * blocks they land in. prosemirror-model is not in the editor runtime's module map, so the slice is
 * cut from a document rather than constructed.
 */
function openSlice(schema: Schema, blocks: ProseMirrorNode[]): Slice {
  const doc = schema.topNodeType.create(null, blocks);
  const depth = (side: 'firstChild' | 'lastChild') => {
    let open = 0;
    for (let node = doc[side]; node && !node.isLeaf && !node.type.spec.isolating; node = node[side]) open += 1;
    return open;
  };
  return blocks.length ? doc.slice(depth('firstChild'), doc.content.size - depth('lastChild'), true) : doc.slice(0, 0);
}

const ROMAN_NUMERALS: [number, string][] = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
];

const romanNumeral = (value: number) =>
  ROMAN_NUMERALS.reduce(
    ({ numeral, rest }, [unit, digits]) => ({
      numeral: numeral + digits.repeat(Math.floor(rest / unit)),
      rest: rest % unit,
    }),
    { numeral: '', rest: value },
  ).numeral;

// 27 is `aa`, as a browser counts lower-alpha.
const alphaNumeral = (value: number): string =>
  (value > 26 ? alphaNumeral(Math.floor((value - 1) / 26)) : '') + String.fromCharCode(97 + ((value - 1) % 26));

/** The number an ordered list of `type` shows for item `value`. */
function itemNumber(type: string | null, value: number) {
  if (value < 1 || !type || !/^[aAiI]$/.test(type)) {
    return String(value);
  }
  const numeral = /^[aA]$/.test(type) ? alphaNumeral(value) : romanNumeral(value);
  return type === type.toUpperCase() ? numeral.toUpperCase() : numeral;
}

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
 * A parsed slice cut down to paragraphs, line breaks and math, plus the marks, lists and tables in
 * `kept`. Attributes go, except an ordered list's numbering, a cell's spans, a header cell's scope
 * and a table's caption. A list or table not kept becomes paragraphs, as a plain-text copy of it
 * reads: an item behind its bullet or number, a row with tabs between its cells.
 */
const keepFormatting =
  (kept: ReadonlySet<string>): SliceFilter =>
  (slice, state) => {
    const { schema } = state;
    const { paragraph, hardBreak, math } = schema.nodes;
    const line = (content: ProseMirrorNode[]) => paragraph.create(null, content);
    const keptMarks = (marks: readonly Mark[]) =>
      marks.filter((mark) => kept.has(mark.type.name)).map((mark) => mark.type.create());

    const inline = (node: Pick<ProseMirrorNode, 'forEach'>): ProseMirrorNode[] =>
      childrenOf(node).flatMap((child) => {
        if (child.isText) {
          const marks = keptMarks(child.marks);
          // Only a code block's text holds line breaks.
          return (child.text ?? '').split('\n').flatMap((part, i) => [
            ...(i && hardBreak ? [hardBreak.create(null, null, marks)] : []),
            ...(part ? [schema.text(part, marks)] : []),
          ]);
        }
        if (child.type === hardBreak || (math && child.type === math)) {
          return [child.mark(keptMarks(child.marks))];
        }
        // Images, response areas and other inline atoms go.
        return child.isLeaf ? [] : inline(child);
      });

    const cellText = (cell: ProseMirrorNode) => {
      const content: ProseMirrorNode[] = [];
      cell.descendants((child) => {
        if (!child.isTextblock) return true;
        if (content.length) content.push(schema.text(' '));
        content.push(...inline(child));
        return false;
      });
      return content;
    };

    const list = (node: ProseMirrorNode): ProseMirrorNode[] => {
      const ordered = node.type.name === 'orderedList';

      if (kept.has(node.type.name)) {
        const items = childrenOf(node).flatMap((item) => item.type.createAndFill(null, blocks(item)) ?? []);
        const numbering = ordered ? { start: node.attrs.start, type: node.attrs.type } : null;
        return items.length ? [node.type.create(numbering, items)] : [];
      }

      let value = ordered ? (node.attrs.start ?? 1) : 0;
      return childrenOf(node).flatMap((item) => {
        const marker = schema.text(ordered ? `${itemNumber(node.attrs.type, value++)}. ` : '• ');
        const [first, ...rest] = blocks(item);
        return first?.type === paragraph
          ? [line([marker, ...childrenOf(first)]), ...rest]
          : [line([marker]), ...(first ? [first] : []), ...rest];
      });
    };

    const table = (node: ProseMirrorNode): ProseMirrorNode[] => {
      const caption: string | null = node.attrs.caption ?? null;

      if (kept.has('table')) {
        const rows = childrenOf(node).flatMap((row) => {
          const cells = childrenOf(row).flatMap((cell) => {
            const { colspan, rowspan, scope } = cell.attrs;
            return cell.type.createAndFill({ colspan, rowspan, scope }, blocks(cell)) ?? [];
          });
          return cells.length ? [row.type.create(null, cells)] : [];
        });
        return rows.length ? [node.type.create({ caption }, rows)] : [];
      }

      return [
        ...(caption ? [line([schema.text(caption)])] : []),
        ...childrenOf(node).map((row) =>
          line(childrenOf(row).flatMap((cell, i) => (i ? [schema.text('\t'), ...cellText(cell)] : cellText(cell)))),
        ),
      ];
    };

    const blocks = (node: Pick<ProseMirrorNode, 'forEach'>): ProseMirrorNode[] =>
      childrenOf(node).flatMap((child) => {
        if (child.isTextblock) return [line(inline(child))];
        if (child.type.spec.tableRole === 'table') return table(child);
        if (child.type.name === 'bulletList' || child.type.name === 'orderedList') return list(child);
        // Blockquotes and other containers give up their content. Rules, images and media go.
        return child.isLeaf ? [] : blocks(child);
      });

    return openSlice(schema, slice.content.firstChild?.isInline ? [line(inline(slice.content))] : blocks(slice.content));
  };

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

  return openSlice(
    schema,
    lines.map((line) => schema.nodes.paragraph.create(null, line)),
  );
}

function pasteFiltered(view: EditorView, html: string, filter: SliceFilter) {
  filtering = filter;
  try {
    view.pasteHTML(html);
  } finally {
    filtering = null;
  }
}

function insertExternal(view: EditorView, { text, html }: { text: string; html: string }, settings: ExternalPasteSettings) {
  const { selection, schema } = view.state;
  const kept = new Set<string>(settings.plainText ? [] : settings.formatting);

  // prosemirror-tables repeats a non-table slice into every selected cell, so tab-separated rows,
  // as a spreadsheet copies them, go in as a table and spread across the selection.
  if ('$anchorCell' in selection && !(kept.has('table') && hasElement(html, 'table'))) {
    const rows = lines(text)
      .split('\n')
      .map((row) => `<tr>${row.split('\t').map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`);
    view.pasteHTML(`<table><tbody>${rows.join('')}</tbody></table>`);
    return;
  }

  if (!settings.plainText) {
    pasteFiltered(view, rebuildWordLists(html), keepFormatting(kept));
    return;
  }

  // Copied from rendered PIE content, math is MathJax's output around the saved markup, and its
  // text loses the TeX (`x^2+1` reads `𝑥2+1`). Parsing the HTML recovers the math nodes.
  if (schema.nodes.math && hasMath(html)) {
    pasteFiltered(view, html, textAndMath);
    return;
  }

  // ProseMirror drops blank lines from pasted text, and a trailing line break would save an empty
  // paragraph. Word's HTML kept blank lines as `&nbsp;` paragraphs.
  view.pasteText(selection.$from.parent.type.spec.code ? lines(text) : lines(text).replace(/^$/gm, ' '));
}

/**
 * Pastes and drops content from outside a PIE editor, such as from Word or Google Docs, with its
 * paragraphs, line breaks and math, and with the bold, italics, underline, strikethrough,
 * superscript, subscript, lists and tables in `formatting`. Its fonts, sizes, colours, alignment,
 * headings, links and class names go, which TextStyleKit, TextAlign and CSSMark would otherwise keep
 * (PIE-1145). Word for Windows and Mac copies lists as styled paragraphs, which are rebuilt as
 * lists first. With `plainText` set it pastes plain text. Copies from a PIE editor and pasted
 * images are left to ProseMirror and the image upload handler.
 *
 * Mirrored in `packages/lib-svelte/editable-html-tiptap-svelte/src/external-paste.ts`.
 */
export const ExternalPaste = Extension.create<ExternalPasteOptions>({
  name: 'externalPaste',

  // Ahead of ImageUploadNode's paste handler, which would otherwise upload the picture of the
  // copied text that Word puts on the clipboard next to the text itself.
  priority: 1000,

  addOptions() {
    return {
      settings: () => ({ plainText: false, formatting: PASTED_FORMATTING }),
    };
  },

  addProseMirrorPlugins() {
    const { settings } = this.options;

    return [
      new Plugin({
        key: new PluginKey('externalPaste'),
        props: {
          transformPasted(slice, view) {
            return filtering ? filtering(slice, view.state) : slice;
          },

          handlePaste(view, event) {
            // pasteText and pasteHTML run handlePaste again with a synthetic event, whose clipboard
            // data is null, or empty in Firefox, so externalContentOf leaves that one alone.
            const content = externalContentOf(event.clipboardData);

            if (content === null) {
              return false;
            }

            insertExternal(view, content, settings());

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
            insertExternal(view, content, settings());
            view.focus();

            return true;
          },
        },
      }),
    ];
  },
});
