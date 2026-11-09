// @ts-nocheck

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/** Marks the formatting toolbar, so the editor knows that focus moved into it. */
export const TOOLBAR_ATTRIBUTE = 'data-editor-toolbar';

export const INACTIVE_CARET_CLASS = 'pie-inactive-caret';

const key = new PluginKey('inactiveCaret');

/**
 * A browser hides the text cursor when the editable loses focus, though the selection is kept and
 * an insertion from the toolbar goes there. While the toolbar has focus this draws a steady cursor
 * at the collapsed selection.
 *
 * It is an element beside the editable rather than a ProseMirror decoration: the editor runtime
 * provides prosemirror-state but not prosemirror-view, which a decoration needs.
 */
export const InactiveCaret = Extension.create({
  name: 'inactiveCaret',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        state: {
          init: () => false,
          apply: (tr, shown) => (tr.getMeta(key) === undefined ? shown : tr.getMeta(key)),
        },
        view(view) {
          let caret = null;

          const remove = () => {
            caret?.remove();
            caret = null;
          };

          const render = (state) => {
            const host = view.dom.parentElement;

            if (!key.getState(state) || !state.selection.empty || !host) {
              remove();
              return;
            }

            let coords;

            try {
              coords = view.coordsAtPos(state.selection.head);
            } catch {
              remove();
              return;
            }

            if (!caret) {
              caret = document.createElement('span');
              caret.className = INACTIVE_CARET_CLASS;
              caret.setAttribute('aria-hidden', 'true');
              host.appendChild(caret);
            }

            const origin = host.getBoundingClientRect();

            caret.style.left = `${coords.left - origin.left + host.scrollLeft}px`;
            caret.style.top = `${coords.top - origin.top + host.scrollTop}px`;
            caret.style.height = `${coords.bottom - coords.top}px`;
          };

          render(view.state);

          return { update: (updated) => render(updated.state), destroy: remove };
        },
      }),
    ];
  },
});

/** Shows or removes the caret; a no-op when it is already so. */
export const setInactiveCaret = (editor, shown) => {
  const view = editor?.view;

  if (!view || editor.isDestroyed || key.getState(view.state) === shown) {
    return;
  }

  view.dispatch(view.state.tr.setMeta(key, shown).setMeta('addToHistory', false));
};
