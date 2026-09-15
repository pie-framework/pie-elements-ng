// @ts-nocheck
/**
 * @synced-from pie-elements/packages/placement-ordering/src/keyboard-coordinates.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { defaultKeyboardCoordinateGetter, KeyboardCode } from '@dnd-kit/core';

/**
 * Custom keyboard coordinate getter for placement-ordering's Tab-based placement mode
 * (enabled only when the item is configured with `placementArea` / `includeTargets`).
 *
 * Tab/Shift+Tab cycle the dragged choice through the target column's response areas
 * in on-screen order (first target, then the rest in sequence), followed by exactly
 * one source-column stop as a fixed last step before the cycle wraps back to the first
 * target — so picking up a choice always starts the cycle at the first target,
 * regardless of where that choice's own source-column slot happens to sit on screen.
 *
 * Arrow keys are delegated to dnd-kit's own `defaultKeyboardCoordinateGetter` so the
 * pre-existing free-form arrow-key dragging behavior is left completely unchanged.
 *
 * Whichever slot a drag started from — a target the choice was already placed in, or
 * (see below) the choice's own pool slot — stays reachable by Tab as a no-op "drop it
 * back where it came from": tile.tsx disables a droppable for the whole duration of
 * its own drag (a self-collision guard for pointer drags), which would otherwise make
 * that exact slot unreachable; that guard is bypassed here specifically for the one
 * droppable matching the active drag's own id. A target slot picked up this way stays
 * in its normal position in the target sequence (it's just another target); nothing
 * special is needed there beyond the bypass itself.
 *
 * The choices column isn't a place a student can choose to relocate an answer within —
 * there's exactly one meaningful "source" stop for whichever choice is currently being
 * dragged: its own fixed slot, whether that's the vacated gap left behind (if the
 * choice is already placed in a target — landing back on it returns the choice to the
 * pool, undoing the placement) or the very tile being dragged (if the choice is still
 * sitting there, unplaced — landing back on it is a no-op that effectively cancels the
 * pick-up; the same disabled-droppable bypass applies here too). Every *other*
 * choice-column tile — filled or an empty gap — is excluded from the cycle:
 * `ordering.ts`'s `updateResponse` has no `choice -> choice` case, so they'd be no-op
 * drop targets anyway. Matching is by id (the vacated gap carries its original choice's
 * id specifically so this comparison works), not by type alone.
 */
export const closestDroppableKeyboardCoordinates = (event, { active, context, currentCoordinates }) => {
  const { code } = event;
  const isTab = code === 'Tab';
  const isArrow =
    code === KeyboardCode.Down || code === KeyboardCode.Up || code === KeyboardCode.Left || code === KeyboardCode.Right;

  if (!isTab && !isArrow) {
    return undefined;
  }

  if (isArrow) {
    return defaultKeyboardCoordinateGetter(event, { context, currentCoordinates });
  }

  event.preventDefault();

  const { droppableRects, droppableContainers, collisionRect, draggableNodes, active: activeObject } = context;

  if (!droppableRects || droppableRects.size === 0) {
    return currentCoordinates;
  }

  // `currentCoordinates` is the top-left of the dragged item's collision rect (not its
  // center), so derive the dragged item's center in the same frame before comparing it
  // against droppable centers below.
  const draggedHalfSize = {
    x: (collisionRect?.width || 0) / 2,
    y: (collisionRect?.height || 0) / 2,
  };
  const currentCenter = {
    x: currentCoordinates.x + draggedHalfSize.x,
    y: currentCoordinates.y + draggedHalfSize.y,
  };

  // dnd-kit's KeyboardCoordinateGetter passes `active` as just the dragged item's
  // UniqueIdentifier (a string) — NOT the full Active object — so `active.data` is
  // always undefined. The active item's own tileData (id/type) has to be looked up via
  // `draggableNodes` instead; reading `active?.data?.current` directly (as this code
  // used to) silently evaluated to `undefined` on every call, which is why the choices
  // column was never actually excluded from the Tab cycle.
  const activeId = draggableNodes?.get(active)?.data?.current?.id;
  // dnd-kit captures this once, at drag start, and never updates it as the item moves
  // — unlike its own live node, whose rendered position tracks wherever Tab has since
  // moved it. Needed below for the slot the drag started from, whichever column that
  // is: it stays disabled (see isOwnDroppable below) for the whole drag, so its live
  // rect is never measured, and its own DOM node — being the one actually moving — is
  // no substitute either.
  const activeInitialRect = activeObject?.rect?.current?.initial;
  // tile.tsx pairs each draggable with a same-shaped droppable id (`drop-` in place of
  // the leading `tile-`) and disables that one droppable for the whole duration of its
  // own drag (a self-collision guard for pointer drags). That guard would otherwise
  // make "drop it back in the exact place it was picked up from" unreachable by Tab —
  // whether that place is a choice's own pool slot (not yet placed) or the target slot
  // it was just picked up from (already placed) — so it's bypassed specifically for
  // this one droppable below.
  const ownDropId = typeof active === 'string' ? active.replace(/^tile-/, 'drop-') : undefined;

  const targets = [];
  let ownChoiceSlotTarget;

  for (const [id, container] of droppableContainers) {
    const containerData = container?.data?.current;
    const isOwnDroppable = id === ownDropId;

    if (container?.disabled && !isOwnDroppable) continue;

    // Every choice-column tile other than the one matching this drag's own id is
    // excluded (see the doc comment above) — filled or an empty gap, it's a no-op drop
    // target regardless.
    const isOwnChoiceSlot = containerData?.type === 'choice' && containerData?.id === activeId;
    if (containerData?.type === 'choice' && !isOwnChoiceSlot) continue;

    // A disabled droppable is never measured into `droppableRects` at all, and for the
    // bypassed own-droppable case, the live DOM node is no substitute either — that
    // node IS the one being dragged, so a fresh read would reflect wherever Tab has
    // moved it, not its true rest position. dnd-kit's own pre-drag snapshot is the fix.
    const rect = (isOwnDroppable ? activeInitialRect : null) || droppableRects.get(id);

    if (!rect) continue;

    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    // Land the dragged item's own left edge at the target's left edge, and vertically
    // CENTER the item on the target's own center — not top-align it there. When the
    // dragged item's rendered height differs from the target's, top-aligning the
    // item's edge to the target's center lets it bleed into a neighboring target, and
    // dnd-kit's own area-based collision detection (rectIntersection) can then flag
    // that neighbor as "over" (or make the next containment check land ambiguously
    // between two rows) even though the item visually landed on the intended target.
    const dropPosition = {
      x: rect.left,
      y: rect.top + rect.height / 2 - draggedHalfSize.y,
    };

    const target = { id, dropPosition, center };

    if (isOwnChoiceSlot) {
      ownChoiceSlotTarget = target;
    } else {
      targets.push(target);
    }
  }

  if (targets.length === 0 && !ownChoiceSlotTarget) {
    return currentCoordinates;
  }

  const reverse = event.shiftKey;

  // Sort the real targets by real on-screen position (top to bottom, then left to
  // right), so this works the same whether the tiler is laid out vertically or
  // horizontally. The one source-column stop is a fixed LAST entry instead of being
  // sorted in by its own on-screen position: the choices column sits right beside the
  // targets column, so sorting it in by position would land it wherever its y/x
  // happens to fall among the targets (in practice, next to whichever target it's
  // level with) rather than at a predictable point in the cycle. Anchoring it last
  // means picking a choice up always starts the cycle at the first target, runs
  // through the rest in order, then reaches the source stop, then wraps — matching how
  // the equivalent "board is always a fixed last stop" pattern works in
  // drag-in-the-blank and categorize's keyboard-coordinates.ts.
  targets.sort((a, b) => {
    if (Math.abs(a.center.y - b.center.y) > 10) return a.center.y - b.center.y;
    return a.center.x - b.center.x;
  });

  if (ownChoiceSlotTarget) {
    targets.push(ownChoiceSlotTarget);
  }

  // Find the current target (closest to current coordinates)
  let currentIndex = 0;
  let minDist = Infinity;

  for (let i = 0; i < targets.length; i++) {
    const dist = distance(currentCenter, targets[i].center);

    if (dist < minDist) {
      minDist = dist;
      currentIndex = i;
    }
  }

  const nextIndex = reverse
    ? (currentIndex - 1 + targets.length) % targets.length
    : (currentIndex + 1) % targets.length;

  return targets[nextIndex].dropPosition;
};

const distance = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
