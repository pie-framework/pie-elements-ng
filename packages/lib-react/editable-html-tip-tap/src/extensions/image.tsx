// @ts-nocheck

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import React from 'react';
import ImageComponent from './image-component.js';
import InsertImageHandler from '../components/image/InsertImageHandler.js';
import { findImageNodeByKey, newImageNodeKey } from '../components/image/findImageNode.js';

// The file a data URL encodes, named as a browser names a pasted image.
const fileOf = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const type = /^data:([^;,]+)/.exec(header)?.[1] ?? 'image/png';
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

  return new File([bytes], `image.${type.split('/')[1]}`, { type });
};

// Hands `file`, pasted as the image with `nodeKey`, to the host to upload, the path the toolbar
// button takes, so the markup stores the uploaded URL rather than base64. `finished` runs once the
// upload succeeds or fails, or at once when the node is gone.
function requestUpload(editor, insertImageRequested, nodeKey, file, finished = () => {}) {
  const nodeInfo = findImageNodeByKey(editor, nodeKey);

  if (!nodeInfo) {
    finished();
    return;
  }

  insertImageRequested(editor, nodeInfo, (onFinish) => {
    let handler;

    const finish = (result) => {
      // Upload failed - show the data URL rather than leave the node behind a progress bar.
      if (!result) {
        handler?.updateNode({ loaded: true });
      }

      onFinish(result);
      finished();
    };

    handler = new InsertImageHandler(editor, nodeInfo, finish, true);

    // Sets getChosenFile(), which is how a host spots a pasted file and skips the picker.
    handler.fileChosen(file);

    return handler;
  });
}

/**
 * Uploads the image pasted with `nodeKey` and a data URL src, as a pasted image file uploads.
 * Resolves once the upload succeeds or fails.
 */
export function uploadPastedImage(editor, nodeKey) {
  const insertImageRequested = editor.extensionManager.extensions.find(
    (extension) => extension.name === 'imageUploadNode',
  )?.options.imageHandling?.insertImageRequested;
  const src = findImageNodeByKey(editor, nodeKey)?.[0].attrs.src;

  return new Promise((resolve) => {
    if (insertImageRequested && src) {
      requestUpload(editor, insertImageRequested, nodeKey, fileOf(src), resolve);
    } else {
      resolve();
    }
  });
}

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

              requestUpload(editor, insertImageRequested, nodeKey, file);
            };

            reader.readAsDataURL(file);

            return true;
          },
        },
      }),
    ];
  },
});
