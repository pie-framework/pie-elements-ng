// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/extensions/div-node.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

// DivNode.ts
import { Node } from '@tiptap/core';

export const DivNode = Node.create({
  name: 'div',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [{ tag: 'div' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', HTMLAttributes, 0];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { $from } = state.selection;

        if ($from.parent.type.name !== 'div') {
          return false;
        }

        return this.editor
          .chain()
          .focus()
          .setNode('paragraph') // current div becomes <p>
          .splitBlock() // create another <p>
          .run();
      },
    };
  },
});
