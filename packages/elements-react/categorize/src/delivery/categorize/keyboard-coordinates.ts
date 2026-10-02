// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/src/categorize/keyboard-coordinates.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { defaultKeyboardCoordinateGetter, KeyboardCode } from '@dnd-kit/core';

// Matches the id `choices.jsx` gives the choice pool's DroppablePlaceholder.
const CHOICES_BOARD_ID = 'choices-board';

/**
 * Custom keyboard coordinate getter for categorize's Tab-based placement.
 *
 * Tab/Shift+Tab cycle the dragged choice directly onto the next/previous enabled
 * category, sorted by on-screen position (top-to-bottom, then left-to-right, matching the
 * category grid's reading order), followed by the choices pool as a fixed last stop.
 *
 * Arrow keys are delegated to dnd-kit's own `defaultKeyboardCoordinateGetter`, leaving the
 * existing free-form arrow-key dragging behavior completely unchanged.
 */
export const closestDroppableKeyboardCoordinates = (event, { context, currentCoordinates }) => {
  const { code } = event;
  const isTab = code === KeyboardCode.Tab;
  const isArrow =
    code === KeyboardCode.Down || code === KeyboardCode.Up || code === KeyboardCode.Left || code === KeyboardCode.Right;

  if (!isTab && !isArrow) {
    return undefined;
  }

  if (isArrow) {
    return defaultKeyboardCoordinateGetter(event, { context, currentCoordinates });
  }

  event.preventDefault();

  const { droppableRects, droppableContainers, collisionRect } = context;

  if (!droppableRects || droppableRects.size === 0) {
    return currentCoordinates;
  }

  const targets = [];
  let boardTarget;

  for (const [id, container] of droppableContainers) {
    if (container?.disabled) continue;

    // dnd-kit's own `droppableRects` is a cached snapshot that isn't guaranteed to be
    // populated for every registered droppable yet on the very first keyboard-driven
    // drag of a session (before any DOM-mutating interaction has forced a full
    // remeasure). A container silently missing from that cache here would otherwise
    // drop out of `targets` entirely, corrupting the Tab cycle. Reading the container's
    // live node directly sidesteps that cache entirely.
    const rect = container?.node?.current?.getBoundingClientRect() ?? droppableRects.get(id);
    if (!rect) continue;

    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    // Land the dragged item's own left edge at the target's left edge (avoids
    // overshooting into a neighboring droppable when the target is much larger than
    // the dragged item), and vertically CENTER the item on the target's own center —
    // not top-align it there. When the dragged item's rendered height differs from the
    // target's, top-aligning the item's edge to the target's center lets it bleed into
    // a neighboring target, and dnd-kit's own area-based collision detection
    // (rectIntersection) can then flag that neighbor as "over" even though the item
    // visually landed on the intended target (confirmed live in the equivalent
    // drag-in-the-blank bug this was ported from a fix for).
    const itemHeight = collisionRect?.height ?? 0;
    const dropPosition = {
      x: rect.left,
      y: rect.top + rect.height / 2 - itemHeight / 2,
    };

    const target = { id, rect, dropPosition, center };

    if (id === CHOICES_BOARD_ID) {
      boardTarget = target;
    } else {
      targets.push(target);
    }
  }

  if (targets.length === 0 && !boardTarget) {
    return currentCoordinates;
  }

  const reverse = event.shiftKey;

  targets.sort((a, b) => {
    if (Math.abs(a.center.y - b.center.y) > 10) return a.center.y - b.center.y;
    return a.center.x - b.center.x;
  });

  // The choices pool is an arbitrarily large container whose own center can land anywhere
  // relative to the categories it sits beside — including numerically between two category
  // rows when `choicesPosition` is 'left'/'right'. Sorting it by position the same way as a
  // category would then interleave it into the middle of the cycle, making a single Tab
  // press jump over categories. Anchor it as a fixed stop after every category instead of
  // trusting its own bounds.
  if (boardTarget) {
    targets.push(boardTarget);
  }

  // Resolve the current target by containment: whichever target's rect actually contains
  // the dragged item's own center. This is reliable regardless of how the dragged item's
  // size compares to the target's — a small choice card landed at a large category's
  // center-left point is still inside that category's rect, and a choice picked up from
  // inside a category is naturally still within it. Comparing distances between
  // reconstructed centers instead breaks down for exactly that shape.
  const draggedCenter = collisionRect
    ? { x: collisionRect.left + collisionRect.width / 2, y: collisionRect.top + collisionRect.height / 2 }
    : currentCoordinates;

  let currentIndex = targets.findIndex(
    (t) =>
      draggedCenter.x >= t.rect.left &&
      draggedCenter.x <= t.rect.right &&
      draggedCenter.y >= t.rect.top &&
      draggedCenter.y <= t.rect.bottom,
  );

  // Fall back to nearest-by-dropPosition when the dragged item's center isn't inside any
  // target (e.g. mid-flight after a free arrow-key move).
  if (currentIndex === -1) {
    let minDist = Infinity;

    for (let i = 0; i < targets.length; i++) {
      const dist = distance(currentCoordinates, targets[i].dropPosition);

      if (dist < minDist) {
        minDist = dist;
        currentIndex = i;
      }
    }
  }

  const nextIndex = reverse
    ? (currentIndex - 1 + targets.length) % targets.length
    : (currentIndex + 1) % targets.length;

  return targets[nextIndex].dropPosition;
};

const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
