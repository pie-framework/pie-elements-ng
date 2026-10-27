import { describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { mathToolbarLeft } from '../src/extensions/math';

const node = { left: 300, right: 360 };

describe('math toolbar placement', () => {
  it('opens rightwards from the node in LTR text', () => {
    expect(mathToolbarLeft(node, 200, false, 1000, 8)).toBe(300);
  });

  it('opens leftwards from the node in RTL text', () => {
    expect(mathToolbarLeft(node, 200, true, 1000, 8)).toBe(160);
  });

  it('stays inside the viewport in either direction', () => {
    expect(mathToolbarLeft({ left: 900, right: 960 }, 200, false, 1000, 8)).toBe(792);
    expect(mathToolbarLeft({ left: 40, right: 100 }, 200, true, 1000, 8)).toBe(8);
  });
});
