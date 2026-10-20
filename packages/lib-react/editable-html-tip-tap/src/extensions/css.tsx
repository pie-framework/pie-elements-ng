// @ts-nocheck

import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Mark, mergeAttributes } from '@tiptap/core';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

// Tears down the open dialog: its React root, its node and its body click listener.
let removeOpenDialog = null;

const insertDialog = ({ editor, callback, opts, selectedText, parentNode }) => {
  removeOpenDialog?.();

  const editorDOM = editor.options.element;
  const newEl = document.createElement('div');
  const { selection } = editor.state;

  newEl.className = 'insert-css-dialog';

  const root = createRoot(newEl);
  let popoverEl;

  const closePopOver = () => {
    if (popoverEl) {
      popoverEl.remove();
    }
  };

  let firstCallMade = false;

  const listener = (e) => {
    // this will be triggered right after setting it because
    // this toolbar is added on the mousedown event
    // so right after mouseup, the click will be triggered
    if (firstCallMade) {
      const focusIsInModals = newEl.contains(e.target) || (popoverEl && popoverEl.contains(e.target));
      const focusIsInEditor = editorDOM.contains(e.target);

      if (!(focusIsInModals || focusIsInEditor)) {
        handleClose();
      }
    } else {
      firstCallMade = true;
    }
  };

  const remove = () => {
    root.unmount();
    newEl.remove();
    closePopOver();
    document.body.removeEventListener('click', listener);

    if (removeOpenDialog === remove) {
      removeOpenDialog = null;
    }
  };

  removeOpenDialog = remove;

  const handleClose = () => {
    callback(undefined, true);
    remove();
  };

  const handleChange = (name) => {
    callback(name, true);
    remove();
  };

  const parentNodeClass = parentNode?.attrs.class;
  const createHTML = (name) => {
    let html = `<span class="${name}">${selectedText}</span>`;

    if (parentNode) {
      let tag = 'span';

      if (parentNode?.object === 'inline') {
        tag = 'span';
      }

      if (parentNode?.object === 'block') {
        tag = 'div';
      }

      html = `<${tag} class="${parentNodeClass}">${parentNode.text.slice(
        0,
        selection.$anchor.textOffset,
      )}${html}${parentNode.text.slice(selection.$head.textOffset)}</${tag}>`;
    }

    return html;
  };

  const el = (
    <div
      style={{ background: 'white', height: 500, padding: 20, overflow: 'hidden', display: 'flex', flexFlow: 'column' }}
    >
      <h2>Please choose a css class</h2>
      {parentNodeClass && <div>The current parent has this class {parentNodeClass}</div>}
      <List component="nav" style={{ overflow: 'scroll' }}>
        {opts.names.map((name, i) => (
          <ListItem key={`rule-${i}`} button onClick={() => handleChange(name)}>
            <div style={{ marginRight: 20 }}>{name}</div>
            <div
              dangerouslySetInnerHTML={{
                __html: createHTML(name),
              }}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );

  const positionDialog = () => {
    const cursorItem = editor.view.nodeDOM(editor.state.selection.from);
    const cursorNode = cursorItem?.parentNode;

    if (cursorNode) {
      const bodyRect = editorDOM.parentElement.parentElement.parentElement.getBoundingClientRect();
      const boundRect = cursorNode.getBoundingClientRect();

      editorDOM.parentElement.parentElement.parentElement.appendChild(newEl);

      newEl.style.maxWidth = '500px';
      newEl.style.position = 'absolute';
      newEl.style.top = 0;
      newEl.style.zIndex = 99999;

      const leftValue = `${boundRect.left + Math.abs(bodyRect.left) + cursorNode.offsetWidth + 10}px`;

      const rightValue = `${boundRect.x}px`;

      newEl.style.left = leftValue;

      const leftAlignedWidth = newEl.offsetWidth;

      newEl.style.left = 'unset';
      newEl.style.right = rightValue;

      const rightAlignedWidth = newEl.offsetWidth;

      newEl.style.left = 'unset';
      newEl.style.right = 'unset';

      if (leftAlignedWidth >= rightAlignedWidth) {
        newEl.style.left = leftValue;
      } else {
        newEl.style.right = rightValue;
      }

      document.body.addEventListener('click', listener);
    }
  };

  // Rendered synchronously, as ReactDOM.render was: positionDialog measures the dialog, and its body
  // click listener must be in place before the click that follows this mousedown.
  flushSync(() => root.render(el));
  positionDialog();
};

export const CSSMark = Mark.create({
  name: 'cssmark',

  addOptions() {
    return {
      classes: [],
    };
  },

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => el.getAttribute('class'),
        renderHTML: (attributes) => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
    };
  },

  parseHTML() {
    // Any span with a class that matches one of allowed classes any span that carries a class attribute
    // so that pre-existing spans are preserved when loading content
    return [
      {
        tag: 'span[class]',
        getAttrs: (el) => {
          const cls = el.getAttribute('class') || '';

          if (!cls) {
            return false;
          }

          const allowedClasses = (this.options && this.options.classes) || [];

          if (allowedClasses.length > 0) {
            const match = this.options.classes.find((name) => cls.includes(name));

            return match ? { class: match } : false;
          }

          return { class: cls };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setCSSClass:
        (className) =>
        ({ commands }) => {
          return commands.setMark(this.name, { class: className });
        },

      unsetCSSClass:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },

      openCSSClassDialog:
        () =>
        ({ editor }) => {
          insertDialog({
            editor,
            selectedText: editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to),
            parentNode: editor.state.selection.$from.nodeAfter,
            opts: this.options.extraCSSRules,
            callback: (className) => {
              if (className) {
                editor.chain().focus().setCSSClass(className).run();
              }
            },
          });
        },
    };
  },
});
