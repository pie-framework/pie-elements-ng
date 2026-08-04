// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/utils/toolbar.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const TOOLBAR_OPENED_META_KEY = 'toolbarOpenedChanged';

export const setToolbarOpened = (editor, opened) => {
  const next = !!opened;

  if (editor._toolbarOpened === next) {
    return;
  }

  editor._toolbarOpened = next;

  if (editor?.view && editor?.state?.tr) {
    editor.view.dispatch(editor.state.tr.setMeta(TOOLBAR_OPENED_META_KEY, true));
  }
};
