import type { Editor } from '@tiptap/core';

/**
 * Puts focus back in the text. The editor keeps its selection while focus is in the toolbar or the
 * character panel, so focusing it without a position puts the cursor back where it was before the
 * user tabbed out of the text.
 */
export const returnFocusToText = (editor: Editor) => {
  editor.view.focus();
  editor.commands.focus();
};
