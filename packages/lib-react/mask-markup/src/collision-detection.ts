import { type ClientRect, type Collision, type CollisionDetection, rectIntersection } from '@dnd-kit/core';

const dropData = (collision: Collision) => collision.data?.droppableContainer?.data?.current;
// The choice pool's droppable (`DragInTheBlankDroppable`) is marked `toChoiceBoard`; every other one is a blank.
const isPool = (collision: Collision) => dropData(collision)?.toChoiceBoard === true;

// How far a point is from a rect: 0 inside it.
const distanceTo = (rect: ClientRect, x: number, y: number) =>
  Math.hypot(Math.max(rect.left - x, 0, x - rect.right), Math.max(rect.top - y, 0, y - rect.bottom));

// dnd-kit's rectIntersection ranks every droppable the dragged choice touches by how much of the two they
// share, and the best-ranked one becomes the drop target. A choice of three or four lines over a blank the
// size of a word shares little with it, so that picks badly in two ways:
//  - the choice pool is a droppable too and is far larger than a blank, so a choice lifted out of it keeps
//    overlapping the pool more than the blank it has only just reached, and the blank is not receptive
//    until the overlap outgrows the pool's;
//  - a tall choice covers several blanks at once, in the lines above and below the one it is meant for,
//    and the one it shares most with wins, whichever the student is pointing at.
//
// Any blank the choice touches is receptive, and among those the one closest to the pointer wins: the
// pointer, not the choice's outline, says where the student means to drop. A keyboard drag has no pointer,
// so its choice's centre stands in. The blank a choice was picked up from is the exception, as in
// categorize: a tall choice keeps touching a small blank however far it is dragged, so it would always
// outrank the pool and the choice could never be put back. It ranks last, as the target only while the
// choice touches nothing else (dropping it there leaves it where it was). The pool is the target as soon
// as it is touched and no other blank is.
export const blanksFirst: CollisionDetection = (args) => {
  const { collisionRect, droppableRects, pointerCoordinates, active } = args;
  const collisions = rectIntersection(args);
  const dragged = active?.data?.current;
  // a choice dragged out of a blank carries that blank's id; one from the pool does not
  const sourceBlankId = dragged?.fromChoice === false ? dragged.id : undefined;
  const isSourceBlank = (collision: Collision) =>
    sourceBlankId !== undefined && dropData(collision)?.id === sourceBlankId;

  const blanks = collisions.filter((collision) => !isPool(collision) && !isSourceBlank(collision));

  if (blanks.length > 0) {
    const x = pointerCoordinates?.x ?? collisionRect.left + collisionRect.width / 2;
    const y = pointerCoordinates?.y ?? collisionRect.top + collisionRect.height / 2;

    const distance = (collision: Collision) => {
      const rect = droppableRects.get(collision.id);

      // rectIntersection only reports droppables it has a rect for; ranking one without last is harmless.
      return rect ? distanceTo(rect, x, y) : Number.POSITIVE_INFINITY;
    };

    // a stable sort, so blanks the pointer is equally far from (all 0 when it is inside them) keep
    // rectIntersection's order, by how much they share with the choice
    return [...blanks].sort((a, b) => distance(a) - distance(b));
  }

  const pool = collisions.filter(isPool);

  return pool.length > 0 ? pool : collisions;
};
