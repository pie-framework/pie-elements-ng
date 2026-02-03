// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/extensions/extended-table.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { Table } from '@tiptap/extension-table';

const ExtendedTable = Table.extend({
  addAttributes() {
    return {
      border: { default: '1' },
    };
  },
  renderHTML(props) {
    const originalTable = this.parent(props);
    const { border } = props.HTMLAttributes;

    const previousStyle = `${originalTable[1].style}${originalTable[1].style.match(/.*; */) ? '' : ';'}`;

    originalTable[1].style = `${previousStyle}
    width: 100%;
    color: var(--pie-text, black);
    table-layout: fixed;
    border-collapse: collapse;
    background-color: var(--pie-background, rgba(255, 255, 255))`;
    originalTable[1].border = border ? border : '1';

    return originalTable;
  },
});

export default ExtendedTable;
