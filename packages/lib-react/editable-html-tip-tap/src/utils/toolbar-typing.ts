import type { Editor } from '@tiptap/core';

const isTextEntry = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select, [contenteditable="true"]') !== null);

/**
 * Typed input (letters, digits, punctuation) while focus is on the formatting toolbar or the
 * character panel goes into the text at the cursor, so a user can mix typing with the panel's
 * buttons. Space, Enter, Tab and the arrows are not characters, so they keep their button and
 * navigation roles. Dead keys report `Dead` and are not handled.
 *
 * Returns true when the key was inserted.
 */
export const insertTypedCharacter = (editor: Editor, e: KeyboardEvent | React.KeyboardEvent): boolean => {
  if (e.defaultPrevented || e.key.length !== 1 || e.key === ' ') return false;
  if ('nativeEvent' in e ? e.nativeEvent.isComposing : e.isComposing) return false;
  // AltGr (how many keyboards reach ñ, ¿, ¡) is reported as Ctrl+Alt.
  const altGraph = e.getModifierState?.('AltGraph');
  if (e.metaKey || (!altGraph && (e.ctrlKey || e.altKey))) return false;

  // A dialog's own field (image, audio, video URL, alt text, CSS class) keeps its input.
  if (isTextEntry(e.target)) return false;
  // A math editor owns typed input until it can accept it from its own buttons (PIE-459).
  if (!editor || !editor.isEditable || editor.isActive('math')) return false;

  e.preventDefault();
  // No focus() here: focus stays on the pressed button, as for the panel's own buttons.
  editor.chain().insertContent(e.key).run();
  return true;
};
