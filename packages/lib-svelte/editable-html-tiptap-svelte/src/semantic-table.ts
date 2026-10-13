import { Table, TableView } from '@tiptap/extension-table';
import { TableHeader } from '@tiptap/extension-table-header';
import type { DOMOutputSpec, Node as ProseMirrorNode } from '@tiptap/pm/model';
import {
  captionAttribute,
  captionParseRule,
  scopeAttribute,
  syncCaption,
  withCaption,
} from './table-semantics.js';

class CaptionedTableView extends TableView {
  constructor(...args: ConstructorParameters<typeof TableView>) {
    super(...args);
    syncCaption(this.table, this.node.attrs.caption);
  }

  update(node: ProseMirrorNode) {
    const updated = super.update(node);

    if (updated) {
      syncCaption(this.table, node.attrs.caption);
    }

    return updated;
  }
}

/** A table that keeps its `<caption>`, as the React editor's `ExtendedTable` does. */
export const SemanticTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: captionAttribute,
    };
  },

  parseHTML() {
    return [...(this.parent?.() ?? []), captionParseRule];
  },

  renderHTML(props) {
    // Tiptap types every parent's renderHTML as optional, and Table's is defined.
    const table = this.parent?.(props) as DOMOutputSpec;
    return withCaption(table, props.node.attrs.caption);
  },
}).configure({ View: CaptionedTableView });

/** A header cell that keeps its `scope`, as the React editor's `ExtendedTableHeader` does. */
export const SemanticTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      scope: scopeAttribute,
    };
  },
});
