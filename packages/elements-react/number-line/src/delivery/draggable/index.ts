// @ts-nocheck

// Draggable.jsx
import React from 'react';
import { useDraggable, useDndMonitor } from '@dnd-kit/core';

/**
 * Shared dnd-kit wrapper for Line + Point.
 *
 * Props:
 *  - id: string (a readable prefix; made unique per instance)
 *  - disabled: boolean
 *  - grid: [stepX] (like grid={[is]})
 *  - bounds: { left: number, right: number } in px (like scaledLineBounds)
 *  - onMouseDown: (event) => void
 *  - onDragStart?: () => void
 *  - onDragMove?: (deltaX: number) => void      // snapped + clamped
 *  - onDragEnd?: (deltaX: number) => void       // snapped + clamped
 *  - children: ({ setNodeRef, attributes, listeners, translateX, isDragging, onMouseDown }) => ReactNode
 */
export function Draggable({
  id,
  disabled,
  grid,
  bounds,
  onMouseDown,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
}) {
  // Callers build `id` from position, and the points inside lines and rays all sit at y=0 of
  // their own row, so endpoints at the same value on different rows share it. dnd-kit then
  // treats them as one draggable and every one of them follows the drag.
  const instanceId = React.useId();
  const draggableId = `${id}-${instanceId}`;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: draggableId,
    disabled,
  });

  const step = grid && grid[0] ? grid[0] : null;

  // current transform.x from dnd-kit
  let rawX = transform?.x ?? 0;

  // grid snapping (grid={[step]})
  if (step) {
    rawX = Math.round(rawX / step) * step;
  }

  // clamp to bounds in px
  if (bounds) {
    if (typeof bounds.left === 'number') {
      rawX = Math.max(bounds.left, rawX);
    }
    if (typeof bounds.right === 'number') {
      rawX = Math.min(bounds.right, rawX);
    }
  }

  const translateX = rawX;
  const isDragging = !!transform;

  // helpers to apply same snap+clamp to deltaX before callbacks
  const snapClampDeltaX = (deltaX) => {
    let x = deltaX;
    if (step) {
      x = Math.round(x / step) * step;
    }
    if (bounds) {
      if (typeof bounds.left === 'number') {
        x = Math.max(bounds.left, x);
      }
      if (typeof bounds.right === 'number') {
        x = Math.min(bounds.right, x);
      }
    }
    return x;
  };

  useDndMonitor({
    onDragStart(event) {
      if (event.active.id !== draggableId || disabled) return;
      onDragStart?.();
    },
    onDragMove(event) {
      if (event.active.id !== draggableId || disabled) return;
      const deltaX = event.delta.x || 0;
      onDragMove?.(snapClampDeltaX(deltaX));
    },
    onDragEnd(event) {
      if (event.active.id !== draggableId || disabled) return;
      const deltaX = event.delta.x || 0;
      onDragEnd?.(snapClampDeltaX(deltaX));
    },
  });

  const handleMouseDown = (e) => {
    // same as before: prevent text selection
    e.nativeEvent.preventDefault();
    onMouseDown?.(e);
  };

  return children({
    setNodeRef,
    attributes,
    listeners,
    translateX,
    isDragging,
    onMouseDown: handleMouseDown,
  });
}
