// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/keyboard-coordinates.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { defaultKeyboardCoordinateGetter, KeyboardCode } from '@dnd-kit/core';

// Matches the id `drag-in-the-blank-dp.jsx` registers for the choice board's droppable.
const CHOICE_BOARD_ID = 'drag-in-the-blank-droppable';

/**
 * Custom keyboard coordinate getter for drag-in-the-blank's Tab-based placement.
 *
 * Tab/Shift+Tab cycle the dragged item directly onto the next/previous enabled
 * droppable — a blank (`mask-blank-drop-{id}`), sorted by on-screen position
 * (top-to-bottom, then left-to-right, since blanks sit inline in flowing text rather
 * than a simple list) — followed by the choice board as a fixed last stop (see below
 * for why the board isn't sorted alongside the blanks).
 *
 * Arrow keys are delegated to dnd-kit's own `defaultKeyboardCoordinateGetter`, leaving
 * the existing free-form arrow-key dragging behavior completely unchanged.
 */
export const closestDroppableKeyboardCoordinates = (event, { active, context, currentCoordinates }) => {
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

  // A blank is itself a droppable for its own slot ("mask-blank-drop-{id}"), and
  // simultaneously draggable from that same slot — the same shape as match-list's
  // placed "target" tiles. That self drop-zone must never be treated as a navigable
  // target: exclude it outright rather than relying on a distance threshold.
  const draggedData = active?.data?.current;
  const ownDropId =
    draggedData && draggedData.fromChoice === false && draggedData.id != null
      ? `mask-blank-drop-${draggedData.id}`
      : undefined;

  const targets = [];
  let boardTarget;

  for (const [id, container] of droppableContainers) {
    if (container?.disabled) continue;
    if (id === ownDropId) continue;

    // dnd-kit's own `droppableRects` is a cached snapshot that isn't guaranteed to be
    // populated for every registered droppable yet on the very first keyboard-driven
    // drag of a session (before any DOM-mutating interaction — e.g. a placement — has
    // forced a full remeasure). A container silently missing from that cache here would
    // otherwise drop out of `targets` entirely, corrupting the Tab cycle (confirmed live:
    // fresh page load, pick up a choice, Tab — lands on the wrong blank and cycles
    // through only a subset of them; placing one answer first "fixes" every keyboard
    // drag afterward, since the placement's DOM change forces dnd-kit to catch up).
    // Reading the container's live node directly sidesteps that cache entirely.
    const rect = container?.node?.current?.getBoundingClientRect() ?? droppableRects.get(id);
    if (!rect) continue;

    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    // Land the dragged item's own left edge at the target's left edge (avoids
    // overshooting into a neighboring droppable when the target is much wider than the
    // dragged item), and vertically CENTER the item on the target's own center — not
    // top-align it there. A blank's placeholder is a thin inline slot (as short as
    // 18px), while the dragged chip renders much taller (a full choice tile, ~50px);
    // top-aligning the item's edge to the target's center let its bottom half bleed
    // deep into the row below, and dnd-kit's own area-based collision detection would
    // then flag that neighboring row as "over" even though the item visually landed on
    // the right target (confirmed live: chip renders at blank 0's position, but the
    // hover highlight lands on blank 3 — directly below it in the next row).
    const itemHeight = collisionRect?.height ?? 0;
    const dropPosition = {
      x: rect.left,
      y: rect.top + rect.height / 2 - itemHeight / 2,
    };

    const target = { id, rect, dropPosition, center };

    if (id === CHOICE_BOARD_ID) {
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

  // The choice board can be an arbitrarily large container — e.g. several choices
  // stacked beside the markup (`choicePosition: 'right'`/`'left'`) — so its own center
  // can land anywhere relative to the blanks it sits beside, including numerically
  // between two of them. Sorting it by position the same way as a blank would then
  // interleave it into the middle of the cycle, making a single Tab press jump over
  // more than one blank (confirmed live: with 3 stacked choices beside wrapped text,
  // the board's center fell between blank 2 and blank 3, so the very first Tab press
  // from the pool landed on blank 3, skipping blanks 1 and 2 entirely). Anchor it as a
  // fixed stop after every blank, in every layout, instead of trusting its own bounds.
  if (boardTarget) {
    targets.push(boardTarget);
  }

  // Find the current target: whichever target's rect actually contains the dragged
  // item's own center. This holds regardless of how the dragged item's size compares
  // to the target's — a compact chip landed (per `dropPosition` above) at a much wider
  // target's left edge is still contained within that target's rect. Comparing
  // distances between reconstructed centers instead breaks down for exactly that shape
  // (a small item in a much wider target): the reconstructed center can end up closer
  // to a completely different droppable than to the one the item is actually sitting
  // on, so the *next* press re-matches the wrong target and looks like it does nothing.
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

  // Fall back to nearest-by-dropPosition if the dragged item's center isn't strictly
  // inside any target (e.g. mid-flight after a free arrow-key move).
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
