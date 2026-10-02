import { describe, expect, it } from 'vitest';
import { outcome } from '../src/controller/index.js';

describe('matrix outcome', () => {
  it('scores an untouched session, which has no value, as empty', async () => {
    const result = await outcome({ matrixValues: { '0-0': 1 } }, { id: '1', element: 'matrix-element' });

    expect(result).toEqual({ score: 0, empty: true });
  });
});
