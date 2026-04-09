// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/extensions/extended-table-cell.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

/**
 * Default table cells use ProseMirror `createAndFill()`, which prefers the first
 * block type allowed by the content expression. Stock cells use `block+`, so
 * `paragraph` wins. Listing `div` first matches the editor default for plain text
 * (see DivNode) while still allowing other blocks (lists, headings, images, …).
 */
const TABLE_CELL_BLOCK_CONTENT =
  '(div | paragraph | heading | bulletList | orderedList | blockquote | codeBlock | horizontalRule | image | imageUploadNode)+';

export const ExtendedTableCell = TableCell.extend({
  content: TABLE_CELL_BLOCK_CONTENT,
});

export const ExtendedTableHeader = TableHeader.extend({
  content: TABLE_CELL_BLOCK_CONTENT,
});
