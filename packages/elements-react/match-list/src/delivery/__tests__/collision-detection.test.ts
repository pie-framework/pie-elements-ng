import { describe, it, expect } from 'vitest';
import { closestResponseArea } from '../collision-detection';

const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

// Response areas are one column of equal-width rows (`drop-<promptId>`); the choices pool sits below them.
const area = (id: number, top: number) => [`drop-${id}`, { type: 'drop-zone' }, rect(0, top, 400, 48)] as const;
const pool = (top: number, height = 200) => ['choices-pool', { type: 'choices-pool' }, rect(0, top, 400, height)] as const;

function collide(targets: ReadonlyArray<readonly [string, any, any]>, collisionRect: any) {
  const droppableRects = new Map(targets.map(([id, , r]) => [id, r]));
  const droppableContainers = targets.map(([id, data]) => ({ id, data: { current: data }, disabled: false }));

  return closestResponseArea({ collisionRect, droppableRects, droppableContainers, active: null, pointerCoordinates: null } as any).map(
    (c) => c.id,
  );
}

// Four response areas 66px apart, as in a typical item, and a pool below them.
const areas = [area(0, 210), area(1, 276), area(2, 342), area(3, 408)];
const targets = [...areas, pool(480)];

describe('closestResponseArea', () => {
  it('makes a response area receptive on a minimal overlap, though the pool still overlaps the choice far more', () => {
    // A 180px-tall image lifted out of the pool: 10px into the bottom area, 150px+ still in the pool.
    expect(collide(targets, rect(100, 446, 200, 180))[0]).toBe('drop-3');
  });

  it('prefers the response area closest to the choice’s vertical centre, not the topmost one it covers', () => {
    // Covers areas 2 and 3 completely; its centre (y=428) is inside area 3.
    const choice = rect(100, 338, 200, 181);

    expect(collide(targets, choice)[0]).toBe('drop-3');
  });

  it('switches response area where the choice’s centre crosses halfway between two of them', () => {
    // Area 1 centre y=300, area 2 centre y=366: the halfway line is y=333. A 100px choice spans 50px either side.
    expect(collide(targets, rect(100, 282, 200, 100))[0]).toBe('drop-1'); // centre 332
    expect(collide(targets, rect(100, 284, 200, 100))[0]).toBe('drop-2'); // centre 334
  });

  it('ignores how far the choice is horizontally from the areas, as long as it overlaps them', () => {
    expect(collide(targets, rect(380, 340, 200, 60))[0]).toBe('drop-2');
  });

  it('targets the pool only while no response area is touched, so a choice can be put back', () => {
    expect(collide(targets, rect(100, 470, 200, 100))).toEqual(['choices-pool']);
  });

  it('finds nothing when the choice overlaps no droppable', () => {
    expect(collide(targets, rect(900, 900, 50, 50))).toEqual([]);
  });

  it('keeps a placed choice in its own response area while its centre is still closest to it', () => {
    // Picked up from area 2 (rows are 66px apart; the lifted tile is a little taller than its row).
    expect(collide(targets, rect(100, 330, 200, 72))[0]).toBe('drop-2');
  });
});
