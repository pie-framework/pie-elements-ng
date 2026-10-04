import type { DOMOutputSpec } from '@tiptap/pm/model';

/**
 * Table markup that ProseMirror's table model has no node for: a table's `<caption>` and a header
 * cell's `scope`. prosemirror-tables reads every child of a table as a row, so the caption is a
 * table attribute holding its text, rendered as the table's first child. Its element is skipped
 * when parsing, since its text would otherwise become a row of its own. Inline formatting inside a
 * caption is not kept.
 *
 * Mirrored in `packages/lib-svelte/editable-html-tiptap-svelte/src/table-semantics.ts`.
 */

const captionElementOf = (table: Element) =>
  Array.from(table.children).find((child) => child.tagName === 'CAPTION');

export const captionAttribute = {
  default: null,
  parseHTML: (table: HTMLElement) =>
    captionElementOf(table)?.textContent?.replace(/\s+/g, ' ').trim() || null,
  // Rendered by the table's renderHTML, as an element.
  renderHTML: () => ({}),
};

export const captionParseRule = { tag: 'caption', ignore: true };

/** A table's DOM spec with its caption as the first child, where HTML requires it. */
export function withCaption(spec: DOMOutputSpec, caption: string | null): DOMOutputSpec {
  if (!caption || !Array.isArray(spec)) {
    return spec;
  }
  const [tag, attributes, ...children] = spec;
  return [tag, attributes, ['caption', caption], ...children];
}

/**
 * Shows the caption in a table view. It is not editable there: it is not document content, and
 * TableView ignores DOM changes outside the table body.
 */
export function syncCaption(table: HTMLTableElement, caption: string | null) {
  let element = captionElementOf(table);

  if (!caption) {
    element?.remove();
    return;
  }
  if (!element) {
    element = table.ownerDocument.createElement('caption');
    element.setAttribute('contenteditable', 'false');
    table.insertBefore(element, table.firstChild);
  }
  if (element.textContent !== caption) {
    element.textContent = caption;
  }
}

const SCOPES = ['row', 'col', 'rowgroup', 'colgroup'];

export const scopeAttribute = {
  default: null,
  parseHTML: (cell: HTMLElement) => {
    const scope = cell.getAttribute('scope')?.trim().toLowerCase() ?? '';
    return SCOPES.includes(scope) ? scope : null;
  },
  renderHTML: (attributes: { scope?: string | null }) =>
    attributes.scope ? { scope: attributes.scope } : {},
};
