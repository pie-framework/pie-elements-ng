import { useLayoutEffect, useState } from 'react';
import type { DOMAttributes } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Data, DraggableAttributes, UniqueIdentifier } from '@dnd-kit/core';

/**
 * Reads a control's accessible name from its rendered content. Returning undefined leaves the name
 * to the browser, which computes it from the same content.
 */
export type ContentNamer = (content: HTMLElement) => string | undefined;

export interface DraggableControlOptions {
  id: UniqueIdentifier;
  data?: Data;
  /** Dragging is off. The control then has no role, tab stop or name of its own. */
  disabled?: boolean;
  /** The accessible name. */
  label?: string;
  /** Id of the element whose text names the control. Wins over `label`. */
  labelledBy?: string;
  /** Names the control from the node given to `setNodeRef` when neither `label` nor `labelledBy` is set. */
  contentName?: ContentNamer;
}

/** The sensors' activator handlers, `onPointerDown` and `onKeyDown` under the default sensors. */
type DragListeners = Omit<DOMAttributes<HTMLElement>, 'children' | 'dangerouslySetInnerHTML'>;

/** Spread on the one element that takes focus and starts the drag. */
export type DraggableControlProps = Partial<DraggableAttributes> &
  DragListeners & {
    'aria-label'?: string;
    'aria-labelledby'?: string;
  };

export type DraggableControl = Omit<ReturnType<typeof useDraggable>, 'attributes' | 'listeners'> & {
  controlProps: DraggableControlProps;
};

/**
 * A dnd-kit draggable that owns its role, tab stop and accessible name. Enabled, it is one tab stop
 * with dnd-kit's button role, drag instructions and listeners; disabled, it is plain content, because
 * a generic element may not carry a name and a native control keeps its own.
 */
export function useDraggableControl({
  id,
  data,
  disabled = false,
  label,
  labelledBy,
  contentName,
}: DraggableControlOptions): DraggableControl {
  const { attributes, listeners, ...draggable } = useDraggable({ id, data, disabled });
  const [contentLabel, setContentLabel] = useState<string | undefined>();
  const namesFromContent = !disabled && !label && !labelledBy && !!contentName;
  const { node } = draggable;

  // Runs after every render: the content can change without any of these options changing.
  useLayoutEffect(() => {
    setContentLabel(namesFromContent && node.current ? contentName?.(node.current) : undefined);
  });

  if (disabled) {
    return { ...draggable, controlProps: {} };
  }

  const name = label || contentLabel;

  return {
    ...draggable,
    controlProps: {
      ...attributes,
      ...(listeners as DragListeners | undefined),
      ...(name && { 'aria-label': name }),
      ...(labelledBy && { 'aria-labelledby': labelledBy }),
    },
  };
}

export default useDraggableControl;
