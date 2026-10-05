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

function collide(rects: Record<string, any>, collisionRect: any) {
  const droppableRects = new Map(Object.entries(rects));
  const droppableContainers = Object.keys(rects).map((id) => ({ id, disabled: false }));

  return categoriesFirst({ collisionRect, droppableRects, droppableContainers, active: null, pointerCoordinates: null } as any);
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

  it('finds nothing when the item overlaps no droppable', () => {
    expect(collide({ category, 'choices-board': pool }, rect(500, 500, 50, 50))).toEqual([]);
  });
});
