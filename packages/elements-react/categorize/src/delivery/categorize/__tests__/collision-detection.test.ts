import { describe, it, expect } from 'vitest';
import { categoriesFirst } from '../collision-detection';

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

// `categoryId` is the category the dragged choice was picked up from; a choice picked up from the pool has none.
function collide(rects: Record<string, any>, collisionRect: any, categoryId?: string) {
  const droppableRects = new Map(Object.entries(rects));
  const droppableContainers = Object.keys(rects).map((id) => ({ id, disabled: false }));
  const active = { data: { current: { type: 'choice', categoryId } } };

  return categoriesFirst({ collisionRect, droppableRects, droppableContainers, active, pointerCoordinates: null } as any);
}

// A 100px-tall category with the choices pool directly below it — the default `choicesPosition`.
const category = rect(0, 0, 300, 100);
const pool = rect(0, 100, 300, 300);

describe('categoriesFirst', () => {
  it('makes a category receptive on a minimal overlap, though the pool still overlaps the item far more', () => {
    // A 150px-tall image dragged up out of the pool: 10px into the category, 140px still in the pool.
    const item = rect(90, 90, 120, 150);

    expect(collide({ category, 'choices-board': pool }, item).map((c) => c.id)).toEqual(['category']);
  });

  it('still returns the pool when no category is touched, so a choice can be put back', () => {
    const item = rect(90, 150, 120, 150);

    expect(collide({ category, 'choices-board': pool }, item).map((c) => c.id)).toEqual(['choices-board']);
  });

  it('ranks categories among themselves by overlap, as dnd-kit does', () => {
    const left = rect(0, 0, 100, 100);
    const right = rect(110, 0, 100, 100);
    const item = rect(60, 20, 100, 50); // 40px in `left`, 50px in `right`

    expect(collide({ left, right, 'choices-board': pool }, item).map((c) => c.id)).toEqual(['right', 'left']);
  });

  describe('a choice picked up from a category', () => {
    // A 600px-tall category with the pool below it, and a 250px-tall image placed in the category.
    const tall = rect(0, 0, 300, 600);
    const poolBelow = rect(0, 600, 300, 100);

    it('can be put back in the pool though it still overlaps the category it came from', () => {
      const item = rect(30, 400, 240, 250); // 200px inside its own category, 50px into the pool

      expect(collide({ tall, 'choices-board': poolBelow }, item, 'tall').map((c) => c.id)).toEqual(['choices-board']);
    });

    it('prefers another category it touches over the pool and over its own category', () => {
      const other = rect(310, 0, 300, 600);
      const item = rect(250, 400, 240, 250); // across the gap: 50px in `tall`, 180px in `other`, and in the pool

      // dnd-kit drops into the first collision.
      expect(collide({ tall, other, 'choices-board': poolBelow }, item, 'tall')[0].id).toBe('other');
    });

    it('is still dropped back where it came from while it touches nothing else', () => {
      const item = rect(30, 100, 240, 250);

      expect(collide({ tall, 'choices-board': poolBelow }, item, 'tall').map((c) => c.id)).toEqual(['tall']);
    });
  });

  it('finds nothing when the item overlaps no droppable', () => {
    expect(collide({ category, 'choices-board': pool }, rect(500, 500, 50, 50))).toEqual([]);
  });
});
