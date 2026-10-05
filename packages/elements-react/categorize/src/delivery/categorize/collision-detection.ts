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
// A category should be receptive on a minimal overlap, so any category the item touches ranks
// ahead of the pool; the pool is the target only when no category is touched.
export const categoriesFirst: CollisionDetection = (args) => {
  const collisions = rectIntersection(args);
  const categories = collisions.filter((collision) => collision.id !== CHOICES_BOARD_ID);

  return categories.length > 0 ? categories : collisions;
};
