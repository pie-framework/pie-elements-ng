// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/extensions/image.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import React from 'react';
import ImageComponent from './image-component.js';
import InsertImageHandler from '../components/image/InsertImageHandler.js';
import { findImageNodeByKey, newImageNodeKey } from '../components/image/findImageNode.js';

export const ImageUploadNode = Node.create({
  name: 'imageUploadNode',

  group: 'block',
  atom: true, // ✅ prevents content holes
  selectable: true, // optional
  draggable: true, // optional

  addAttributes() {
    return {
      nodeKey: { default: null },
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
        tag: 'img[data-type="image-upload-node"]',
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
      setImageUploadNode:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            // adding a unique nodeKey attribute to help identify this node instance later due to issues with multiple images
            attrs: { nodeKey: newImageNodeKey() },
          });
        },
    };
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    const options = this.options;

    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const items = Array.from(event.clipboardData?.items || []);

            const imageItem = items.find((item) => item.kind === 'file' && item.type.startsWith('image/'));

            if (!imageItem) {
              return false;
            }

            const file = imageItem.getAsFile();

            if (!file) {
              return false;
            }

            const insertImageRequested = options?.imageHandling?.insertImageRequested;
            const nodeKey = newImageNodeKey();

            const reader = new FileReader();

            reader.onload = () => {
              const src = reader.result;

              if (typeof src !== 'string') {
                return;
              }

              editor.commands.insertContent({
                type: 'imageUploadNode',
                attrs: {
                  src,
                  loaded: !insertImageRequested,
                  nodeKey,
                },
              });

              // No upload host - the data URL is the only src available.
              if (!insertImageRequested) {
                return;
              }

              const nodeInfo = findImageNodeByKey(editor, nodeKey);

              if (!nodeInfo) {
                return;
              }

              // Same path as the toolbar button, so the markup stores the uploaded URL, not base64.
              insertImageRequested(editor, nodeInfo, (onFinish) => {
                let handler;

                const finish = (result) => {
                  // Upload failed - show the data URL rather than leave the node behind a progress bar.
                  if (!result) {
                    handler?.updateNode({ loaded: true });
                  }

                  onFinish(result);
                };

                handler = new InsertImageHandler(editor, nodeInfo, finish, true);

                // Sets getChosenFile(), which is how a host spots a pasted file and skips the picker.
                handler.fileChosen(file);

                return handler;
              });
            };

            reader.readAsDataURL(file);

            return true;
          },
        },
      }),
    ];
  },
});
