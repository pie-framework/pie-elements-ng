import { describe, it, expect } from 'vitest';
import { blanksFirst } from '../collision-detection';

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const POOL = 'drag-in-the-blank-droppable';

// The droppables' data as `Blank` and `DragInTheBlankDroppable` give it: a blank by its id, the pool marked
// `toChoiceBoard`.
const dataOf = (id: string) => (id === POOL ? { id, toChoiceBoard: true } : { id });

// `from` is the blank the dragged choice was picked up from; a choice picked up from the pool has none.
function collide(
  rects: Record<string, ReturnType<typeof rect>>,
  collisionRect: ReturnType<typeof rect>,
  { pointer = null, from }: { pointer?: { x: number; y: number } | null; from?: string } = {},
) {
  const droppableRects = new Map(Object.entries(rects));
  const droppableContainers = Object.keys(rects).map((id) => ({
    id,
    disabled: false,
    data: { current: dataOf(id) },
  }));
  const active = { data: { current: from ? { id: from, fromChoice: false } : { fromChoice: true } } };

  return blanksFirst({
    collisionRect,
    droppableRects,
    droppableContainers,
    active,
    pointerCoordinates: pointer,
  } as any).map((collision) => collision.id);
}

// A line of text with a one-word blank in it, and the choice pool below it.
const blank = rect(100, 0, 60, 24);
const pool = rect(0, 200, 600, 300);
// A choice of four lines of text, about as wide as a column of the pool.
const tall = (left: number, top: number) => rect(left, top, 200, 96);

describe('blanksFirst', () => {
  it('makes a one-word blank receptive on a minimal overlap, though a tall choice still overlaps the pool far more', () => {
    // dragged up out of the pool: its top 4px across the blank's bottom edge, most of it still in the pool
    const choice = tall(40, 20);
    const lifted = { ...choice, bottom: 220, height: 200 };

    expect(collide({ blank, [POOL]: pool }, lifted)).toEqual(['blank']);
  });

  it('returns the pool when no blank is touched, so a choice can be put back', () => {
    expect(collide({ blank, [POOL]: pool }, tall(40, 150))).toEqual([POOL]);
  });

  it('picks the blank under the pointer among those a tall choice covers', () => {
    // three lines of text, a blank in each; a 96px choice covers all three
    const above = rect(100, 0, 60, 24);
    const middle = rect(300, 32, 60, 24);
    const below = rect(100, 64, 60, 24);
    const choice = tall(120, 0); // across x 120 to 320, so part of each

    // dnd-kit drops into the first collision
    expect(collide({ above, middle, below, [POOL]: pool }, choice, { pointer: { x: 310, y: 44 } })[0]).toBe('middle');
    expect(collide({ above, middle, below, [POOL]: pool }, choice, { pointer: { x: 140, y: 70 } })[0]).toBe('below');
  });

  it('picks the blank nearest the pointer when the pointer is over none of them', () => {
    const left = rect(100, 0, 60, 24);
    const right = rect(240, 0, 60, 24);
    const choice = tall(80, 0);

    // between the two, nearer the right one
    expect(collide({ left, right }, choice, { pointer: { x: 220, y: 12 } })[0]).toBe('right');
  });

  it('picks the blank nearest the choice centre in a keyboard drag, which has no pointer', () => {
    const above = rect(100, 0, 60, 24);
    const below = rect(100, 64, 60, 24);

    // the choice's centre is at y 80, in the line of `below`
    expect(collide({ above, below }, tall(60, 32))[0]).toBe('below');
  });

  describe('a choice picked up from a blank', () => {
    it('can be put back in the pool though it still overlaps the blank it came from', () => {
      const choice = { ...tall(40, 20), bottom: 220, height: 200 };

      expect(collide({ blank, [POOL]: pool }, choice, { from: 'blank' })).toEqual([POOL]);
    });

    it('prefers another blank it touches over the pool and over its own blank', () => {
      const other = rect(300, 0, 60, 24);
      const choice = { ...tall(120, 20), bottom: 220, height: 200 };

      expect(collide({ blank, other, [POOL]: pool }, choice, { from: 'blank', pointer: { x: 320, y: 22 } })[0]).toBe(
        'other',
      );
    });

    it('is still dropped back where it came from while it touches nothing else', () => {
      expect(collide({ blank, [POOL]: pool }, tall(40, 0), { from: 'blank' })).toEqual(['blank']);
    });
  });
});
