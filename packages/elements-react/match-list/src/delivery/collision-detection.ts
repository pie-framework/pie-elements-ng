import { type Collision, type CollisionDetection, rectIntersection } from '@dnd-kit/core';

const dropData = (collision: Collision) => collision.data?.droppableContainer?.data?.current;
const isResponseArea = (collision: Collision) => dropData(collision)?.type === 'drop-zone';
const isPool = (collision: Collision) => dropData(collision)?.type === 'choices-pool';

// dnd-kit's rectIntersection ranks every droppable the dragged choice touches by how much of it
// overlaps, and the best-ranked one becomes the drop target. With choices much taller than a response
// area that picks badly, in two ways:
//  - the choices pool is a droppable too and is far larger than a response area, so a choice lifted out
//    of it keeps overlapping the pool more than the area it has only just reached, and the area is not
//    receptive until the overlap outgrows the pool's — about half of it;
//  - once the choice covers several areas completely they tie, and the one listed first wins: the
//    topmost area the choice covers, whatever part of it the choice is actually over.
//
// Response areas are always one column of equal-width rows, so which one is meant is a function of the
// vertical position alone. Any area the choice touches is receptive, and among those the one whose
// centre is closest to the choice's vertical centre wins. The pool is the target only while no response
// area is touched.
export const closestResponseArea: CollisionDetection = (args) => {
  const { collisionRect, droppableRects } = args;
  const collisions = rectIntersection(args);
  const areas = collisions.filter(isResponseArea);

  if (areas.length > 0) {
    const centre = collisionRect.top + collisionRect.height / 2;

    const distance = (collision: Collision) => {
      const rect = droppableRects.get(collision.id);

      // rectIntersection only reports droppables it has a rect for; ranking one without last is harmless.
      return rect ? Math.abs(centre - (rect.top + rect.height / 2)) : Number.POSITIVE_INFINITY;
    };

    return [...areas].sort((a, b) => distance(a) - distance(b));
  }

  const pool = collisions.filter(isPool);

  return pool.length > 0 ? pool : collisions;
};
