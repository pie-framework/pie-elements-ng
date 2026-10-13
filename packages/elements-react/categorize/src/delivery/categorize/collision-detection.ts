import { rectIntersection, type CollisionDetection } from '@dnd-kit/core';

// Matches the id `choices.tsx` gives the choice pool's DroppablePlaceholder.
export const CHOICES_BOARD_ID = 'choices-board';

// dnd-kit's rectIntersection ranks every droppable the dragged item touches by how much of it
// overlaps, and the best-ranked one becomes the drop target. The choice pool is a droppable too,
// and is usually far larger than a category, so an item lifted out of it still overlaps the pool
// by more than it overlaps a category it has only just reached — the category stays unreceptive
// until the overlap outgrows the pool's. Dragging in from the other side never meets the pool,
// which is why only an approach from the pool's side felt sticky.
//
// A category should be receptive on a minimal overlap, so a category the item touches ranks ahead
// of the pool. The category a choice was picked up from is the exception: a large choice keeps
// overlapping it however far it is dragged, so it would always outrank the pool and the choice
// could never be put back. It ranks last, as the target only while the item touches nothing else
// (dropping it there leaves it where it was). The pool is the target as soon as it is touched, and
// then lights up (see PlaceHolder) so the drag never looks as if it has no target.
export const categoriesFirst: CollisionDetection = (args) => {
  const collisions = rectIntersection(args);
  const sourceCategoryId = args.active?.data?.current?.categoryId;
  const otherCategories = collisions.filter(
    (collision) => collision.id !== CHOICES_BOARD_ID && collision.id !== sourceCategoryId,
  );

  if (otherCategories.length > 0) {
    return otherCategories;
  }

  const pool = collisions.filter((collision) => collision.id === CHOICES_BOARD_ID);

  return pool.length > 0 ? pool : collisions;
};
