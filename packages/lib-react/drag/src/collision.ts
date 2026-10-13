import { applyModifiers, rectIntersection } from '@dnd-kit/core';
import type { ClientRect, CollisionDetection, Modifier, Modifiers } from '@dnd-kit/core';

type CollisionArgs = Parameters<CollisionDetection>[0];
type RectMap = CollisionArgs['droppableRects'];

export type PointerCoordinates = NonNullable<CollisionArgs['pointerCoordinates']>;

export interface DragCollisionOptions {
  /** Finds the collisions. Defaults to `rectIntersection`, as `DragProvider` does. */
  detect?: CollisionDetection;
  /**
   * The provider's modifiers, which place the dragged tile. A pointer drag collides where the pointer
   * put the tile, with the parts of the targets inside the first scrollable ancestor; a keyboard drag
   * collides where the modifiers put it.
   */
  modifiers?: Modifiers;
}

export interface DragCollision {
  /** For the provider's `collisionDetection`. */
  collisionDetection: CollisionDetection;
  /** For the provider's `modifiers`; set when `modifiers` was given. */
  modifiers?: Modifiers;
  /** The pointer at the latest collision check since `reset`; null for a keyboard drag. */
  lastPointer: () => PointerCoordinates | null;
  /** Forgets the pointer. Call it when a drag starts. */
  reset: () => void;
}

const offset = (rect: ClientRect, x: number, y: number): ClientRect => ({
  ...rect,
  left: rect.left + x,
  right: rect.right + x,
  top: rect.top + y,
  bottom: rect.bottom + y,
});

// The part of each rect inside `bounds`; a rect wholly outside is left out.
const clip = (rects: RectMap, bounds: ClientRect): RectMap => {
  const clipped: RectMap = new Map();

  rects.forEach((rect, id) => {
    const left = Math.max(rect.left, bounds.left);
    const top = Math.max(rect.top, bounds.top);
    const right = Math.min(rect.right, bounds.right);
    const bottom = Math.min(rect.bottom, bounds.bottom);

    if (left < right && top < bottom) {
      clipped.set(id, { left, top, right, bottom, width: right - left, height: bottom - top });
    }
  });

  return clipped;
};

/**
 * Collision detection for one `DragProvider`, so one per element instance: it holds the state of the
 * drag in progress.
 */
export function createDragCollision({
  detect = rectIntersection,
  modifiers,
}: DragCollisionOptions = {}): DragCollision {
  let pointer: PointerCoordinates | null = null;
  // The provider runs its modifiers right before each collision check, so these describe the render
  // being checked: how far the modifiers moved the tile, and the first scrollable ancestor's rect.
  let shift = { x: 0, y: 0 };
  let bounds: ClientRect | null = null;

  const modifier: Modifier = (args) => {
    const transform = applyModifiers(modifiers, args);

    shift = { x: transform.x - args.transform.x, y: transform.y - args.transform.y };
    bounds = args.scrollableAncestorRects[0] ?? null;

    return transform;
  };

  const collisionDetection: CollisionDetection = (args) => {
    pointer = args.pointerCoordinates;

    if (!modifiers || !pointer) return detect(args);

    return detect({
      ...args,
      collisionRect: offset(args.collisionRect, -shift.x, -shift.y),
      droppableRects: bounds ? clip(args.droppableRects, bounds) : args.droppableRects,
    });
  };

  return {
    collisionDetection,
    ...(modifiers && { modifiers: [modifier] }),
    lastPointer: () => pointer,
    reset: () => {
      pointer = null;
    },
  };
}

export default createDragCollision;
