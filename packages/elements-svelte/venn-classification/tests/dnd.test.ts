import { describe, expect, it } from 'vitest';
import { applyPlacement, isSamePlacement } from '../src/delivery/dnd.js';
import type { VennModel } from '../src/types.js';

const model: VennModel = {
  circles: [{ label: 'A' }, { label: 'B' }],
  tiles: [
    { id: 't1', label: 'one', correctRegion: [0] },
    { id: 't2', label: 'two', correctRegion: [1] },
  ],
};

describe('applyPlacement', () => {
  it('gives every authored tile a key, `null` for the tray', () => {
    const next = applyPlacement({ model, session: { id: '1' }, tileId: 't1', placement: [0] });
    expect(next).toEqual({ id: '1', placements: { t1: [0], t2: null }, completed: false });
  });

  it('keeps unknown placement keys and sorts regions', () => {
    const next = applyPlacement({
      model,
      session: { placements: { stray: [1], t2: [1] } },
      tileId: 't1',
      placement: [1, 0],
    });
    expect(next.placements).toEqual({ stray: [1], t1: [0, 1], t2: [1] });
    expect(next.completed).toBe(true);
  });
});

describe('isSamePlacement', () => {
  it('treats a missing key and the tray as the same place', () => {
    expect(isSamePlacement({}, 't1', null)).toBe(true);
    expect(isSamePlacement({ placements: { t1: null } }, 't1', null)).toBe(true);
    expect(isSamePlacement({ placements: { t1: [] } }, 't1', null)).toBe(false);
  });

  it('compares regions by value', () => {
    expect(isSamePlacement({ placements: { t1: [1, 0] } }, 't1', [0, 1])).toBe(true);
    expect(isSamePlacement({ placements: { t1: [0] } }, 't1', [0, 1])).toBe(false);
    expect(isSamePlacement({ placements: { t1: [0] } }, 't1', null)).toBe(false);
  });
});
