import type { DraggableAttributes } from '@dnd-kit/core';

/** Marks an element dnd-kit can drag, now that no role description says so; e2e specs find draggables by it. */
export const DRAGGABLE_MARKER = 'data-dnd-draggable';

export type MarkedDraggableAttributes = Omit<DraggableAttributes, 'aria-roledescription'> & {
  [DRAGGABLE_MARKER]: '';
};

/**
 * dnd-kit's `attributes` for a draggable, to spread in their place: without the "draggable" role
 * description, which a screen reader reads as a non-standard role (PIE-1547), and with
 * `data-dnd-draggable` instead. The role, tab stop, `aria-disabled`, `aria-pressed` and
 * `aria-describedby` are dnd-kit's.
 */
export const draggableAttributes = (attributes: DraggableAttributes): MarkedDraggableAttributes => {
  const { 'aria-roledescription': _roleDescription, ...rest } = attributes;

  return { ...rest, [DRAGGABLE_MARKER]: '' };
};

export default draggableAttributes;
