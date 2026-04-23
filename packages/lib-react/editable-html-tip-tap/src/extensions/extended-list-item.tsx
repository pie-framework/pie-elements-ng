// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/extensions/extended-list-item.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { ListItem } from '@tiptap/extension-list-item';

/**
 * Default list items use `paragraph block*`, so empty/new items become `<p>`.
 * Prefer `div` first to keep consistency with DivNode at root and table cells.
 */
export const ExtendedListItem = ListItem.extend({
  content:
    '(div | paragraph | heading | bulletList | orderedList | blockquote | codeBlock | horizontalRule | image | imageUploadNode)+',
});
