// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/extensions/image.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import React from 'react';
import ImageComponent from './component';

export const ImageUploadNode = Node.create({
  name: 'imageUploadNode',

  group: 'block',
  atom: true, // ✅ prevents content holes
  selectable: true, // optional
  draggable: true, // optional

  addAttributes() {
    return {
      loaded: { default: false },
      deleteStatus: { default: null },
      alignment: { default: null },
      percent: { default: null },
      width: { default: null },
      height: { default: null },
      src: { default: null },
      alt: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-upload-node"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes, { 'data-type': 'image-upload-node' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => <ImageComponent {...{ ...props, options: this.options }} />);
  },

  addCommands() {
    return {
      setImageUploadNode: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});
