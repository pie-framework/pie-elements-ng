// @ts-nocheck

import { combineTransactionSteps, Extension, getChangedRanges, Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { elementLanguageAttributes } from '@pie-element/shared-i18n';
import { detectScriptDirection } from '../utils/direction.js';

const DIRECTIONS = ['ltr', 'rtl'];

/** The `dir` an element was saved with, when it is one the editor writes. */
const parseDir = (element) => {
  const dir = element.getAttribute('dir')?.toLowerCase();
  return DIRECTIONS.includes(dir) ? dir : null;
};

/**
 * The `dir` detection gives a block: its script's direction where that differs from the editor's,
 * and nothing where the block inherits the right one. A `dir` it already declares that matches the
 * editor's is kept.
 */
const detectedDir = (text, declared, baseDirection) => {
  const detected = detectScriptDirection(text);
  if (detected && detected !== baseDirection) return detected;
  return declared === baseDirection ? baseDirection : null;
};

/**
 * Paragraph `dir`, stamped from the block's script (plan decision D1). An edited block whose first
 * strong character runs against the editor's direction (`baseDirection`, the content language's)
 * gets that character's direction on the next transaction, so the saved markup declares it. Every
 * other block stays undeclared and inherits, which keeps the markup of content in one direction as
 * it was. `setBlockDirection` pins a block's direction against its script, and
 * `unsetBlockDirection` returns it to detection. Loading content (`setContent` without an update)
 * is not an edit and stamps nothing.
 *
 * Whether a block is pinned is not written to the markup. On load, a saved `dir` that matches the
 * block's script reads as detected and one that contradicts it as pinned, so a stamp is re-derived
 * when the author rewrites the block in another script and a choice survives the round trip.
 * Blocks the author does not touch keep the markup they were loaded with.
 */
// Named apart from TipTap's core `textDirection` extension and its commands, which set a `dir` on
// every node from an editor-wide option.
export const BlockDirection = Extension.create({
  name: 'blockDirection',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'div', 'headingParagraph'],
      // Read at each edit, since the content language can change on a mounted editor.
      baseDirection: () => 'ltr',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: null,
            parseHTML: parseDir,
            renderHTML: (attributes) => (attributes.dir ? { dir: attributes.dir } : {}),
          },
          dirPinned: {
            default: false,
            rendered: false,
            parseHTML: (element) => {
              const dir = parseDir(element);
              return !!dir && dir !== detectScriptDirection(element.textContent);
            },
          },
        },
      },
    ];
  },

  addCommands() {
    const update =
      (attrsFor) =>
      ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;
        let changed = false;

        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!this.options.types.includes(node.type.name)) return;
          const attrs = { ...node.attrs, ...attrsFor(node) };
          if (attrs.dir === node.attrs.dir && attrs.dirPinned === node.attrs.dirPinned) return;
          tr.setNodeMarkup(pos, undefined, attrs);
          changed = true;
        });

        if (changed) dispatch?.(tr);
        return changed;
      };

    return {
      setBlockDirection: (dir) => update(() => ({ dir, dirPinned: true })),
      unsetBlockDirection: () =>
        update((node) => ({ dir: detectedDir(node.textContent, null, this.options.baseDirection()), dirPinned: false })),
    };
  },

  addProseMirrorPlugins() {
    const { types, baseDirection } = this.options;

    return [
      new Plugin({
        key: new PluginKey('blockDirectionStamp'),
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some((tr) => tr.docChanged && !tr.getMeta('preventUpdate'))) return null;

          const tr = newState.tr;
          const base = baseDirection();
          const changes = getChangedRanges(combineTransactionSteps(oldState.doc, transactions));

          changes.forEach(({ newRange }) => {
            newState.doc.nodesBetween(newRange.from, newRange.to, (node, pos) => {
              if (!types.includes(node.type.name) || node.attrs.dirPinned) return;
              const dir = detectedDir(node.textContent, node.attrs.dir, base);
              if (dir !== node.attrs.dir) tr.setNodeMarkup(pos, undefined, { ...node.attrs, dir });
            });
          });

          return tr.steps.length ? tr.setMeta('addToHistory', false) : null;
        },
      }),
    ];
  },
});

/**
 * Span `lang`: a run of text in a language other than its block's. The span also gets the
 * language's `dir`, which isolates it from the surrounding text. A `lang` that is not a usable
 * language tag is kept as authored, with no `dir`. The mark parses whether or not the toolbar
 * offers the `content-language` control.
 */
export const ContentLanguage = Mark.create({
  name: 'contentLanguage',
  // A `lang` span may also carry a style or a class, which the text-style and CSS marks read.
  priority: 1001,

  addOptions() {
    return {
      // The `{ value, label }` languages the toolbar offers.
      languages: () => [],
    };
  },

  addAttributes() {
    return {
      lang: {
        default: null,
        parseHTML: (element) => element.getAttribute('lang'),
        renderHTML: (attributes) => {
          if (!attributes.lang) return {};
          const declared = elementLanguageAttributes(attributes.lang);
          return declared ? { lang: declared.lang, dir: declared.dir } : { lang: attributes.lang };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[lang]', consuming: false }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      // With the cursor in a `lang` span, both act on the whole span.
      setContentLanguage:
        (lang) =>
        ({ chain }) =>
          lang
            ? chain().extendMarkRange(this.name).setMark(this.name, { lang }).run()
            : chain().unsetMark(this.name, { extendEmptyMarkRange: true }).run(),
      unsetContentLanguage:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name, { extendEmptyMarkRange: true }),
    };
  },
});

/** The nearest block around the selection's start that carries a direction, or `undefined`. */
const directionBlock = (state, types) => {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (types.includes(node.type.name)) return node;
  }
  return undefined;
};

/**
 * What the toolbar shows for the selection's block: its `dir`, whether that is pinned, the
 * direction it renders in (the editor's own when the block declares none) and its `text-align`.
 */
export const selectionDirection = (editor) => {
  const types = editor.extensionManager.extensions.find((e) => e.name === 'blockDirection')?.options.types ?? [];
  const block = directionBlock(editor.state, types);
  const dir = block?.attrs.dir ?? null;
  let rendered = dir;

  if (!rendered) {
    try {
      rendered = getComputedStyle(editor.view.dom).direction === 'rtl' ? 'rtl' : 'ltr';
    } catch {
      rendered = 'ltr';
    }
  }

  return { dir, pinned: !!block?.attrs.dirPinned, rendered, textAlign: block?.attrs.textAlign ?? null };
};

/** A block's `text-align` as start, center, end or justify, reading `left` and `right` by direction. */
export const logicalAlignment = (textAlign, direction) => {
  switch (textAlign) {
    case 'left':
      return direction === 'rtl' ? 'end' : 'start';
    case 'right':
      return direction === 'rtl' ? 'start' : 'end';
    case 'center':
    case 'end':
    case 'justify':
      return textAlign;
    default:
      return 'start';
  }
};
