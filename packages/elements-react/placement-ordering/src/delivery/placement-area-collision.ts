import { rectIntersection } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';

type CollisionArgs = Parameters<CollisionDetection>[0];
type Container = CollisionArgs['droppableContainers'][number];

const tileOf = (container: Container | CollisionArgs['active']) => container?.data?.current;

/**
 * Collision detection for an item with a placement area (`placementArea`).
 *
 * `rectIntersection` takes the droppable the dragged tile overlaps most, and every tile is a
 * droppable, so a tile dragged toward a response area was received by the source slot beside it,
 * which it overlaps more, though no choice can be dropped on a source slot that still holds one.
 * Here the candidates are only the places the tile can actually go:
 *
 * - A tile dragged from the source column can only go to a response area, and any overlap at all
 *   receives it, the most overlapped first. Dragging it back to the source column is no move.
 * - A tile dragged from a response area can go to another response area or back to the source slot
 *   of its own choice, and is received by whichever it overlaps most. Returning it is a move of its
 *   own, so it gets no bias toward the response areas.
 *
 * Without response areas the source slots are the whole item, and are left to `rectIntersection`.
 */
export const placementAreaCollision: CollisionDetection = (args) => {
  const { droppableContainers } = args;

  if (!droppableContainers.some((container) => tileOf(container)?.type === 'target')) {
    return rectIntersection(args);
  }

  const dragged = tileOf(args.active);
  const fromResponseArea = dragged?.type === 'target';

  const candidates = droppableContainers.filter((container) => {
    const tile = tileOf(container);

    if (tile?.type === 'target') return true;

    return fromResponseArea && tile?.type === 'choice' && tile.id === dragged.id;
  });

  return rectIntersection({ ...args, droppableContainers: candidates });
};

export default placementAreaCollision;
