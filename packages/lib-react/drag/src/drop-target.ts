import type { KeyboardEvent } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Data, UniqueIdentifier } from '@dnd-kit/core';

export interface DropTargetOptions {
  id: UniqueIdentifier;
  data?: Data;
  /** Drops are off, and the target is no tab stop. */
  disabled?: boolean;
  /** The accessible name. */
  label?: string;
  /** Id of the element whose text names the target. Wins over `label`. */
  labelledBy?: string;
  /**
   * Places the current selection here. Given, the target is a tab stop that calls it on Enter or
   * Space; pointer activation stays with the caller.
   */
  onPlace?: () => void;
  /** The target renders draggable choices inside it, so it stays a group while it is a tab stop. */
  holdsChoices?: boolean;
}

/** Spread on the target element, the one given to `setNodeRef`. */
export interface DropTargetProps {
  role: 'button' | 'group';
  tabIndex: 0 | -1;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

export type DropTarget = ReturnType<typeof useDroppable> & { targetProps: DropTargetProps };

/**
 * A dnd-kit droppable that owns its role, tab stop and accessible name. It is a named group, and a
 * named button while it is a tab stop that holds no choices: a button's children are presentational
 * to assistive technology, so a button around draggable choices would hide them.
 */
export function useDropTarget({
  id,
  data,
  disabled = false,
  label,
  labelledBy,
  onPlace,
  holdsChoices = false,
}: DropTargetOptions): DropTarget {
  const droppable = useDroppable({ id, data, disabled });
  const isTabStop = !!onPlace && !disabled;

  // Only a keydown on the target itself: a choice inside it, or one being dragged by keyboard (which
  // keeps focus while the drag moves), would otherwise place on its own Enter or Space.
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      onPlace?.();
    }
  };

  return {
    ...droppable,
    targetProps: {
      role: isTabStop && !holdsChoices ? 'button' : 'group',
      tabIndex: isTabStop ? 0 : -1,
      ...(label && { 'aria-label': label }),
      ...(labelledBy && { 'aria-labelledby': labelledBy }),
      ...(isTabStop && { onKeyDown }),
    },
  };
}

export default useDropTarget;
