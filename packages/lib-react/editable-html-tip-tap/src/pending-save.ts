// An idle save the editor is still holding hangs off its contenteditable under a registry-wide
// symbol, so a host finds it from the DOM alone, through any props it renders the editor with, and
// a second copy of this library on the page still sees the first one's editors. See PIE-916.
const PENDING_SAVE = Symbol.for('@pie-lib/editable-html-tip-tap/pending-save');

export const setPendingSaveFlush = (node: Element, flush: () => void): void => {
  (node as any)[PENDING_SAVE] = flush;
};

/**
 * Sends every idle save still waiting in an editor under `root` now, as a blur would. An element
 * calls this from `commitPendingSession()`, before its own notifiers flush, so a player committing
 * the session gets what the student typed in the last idle-save delay.
 */
export function flushPendingEditorSaves(root: ParentNode): void {
  root.querySelectorAll('[data-pie-editor]').forEach((node) => {
    (node as any)[PENDING_SAVE]?.();
  });
}
