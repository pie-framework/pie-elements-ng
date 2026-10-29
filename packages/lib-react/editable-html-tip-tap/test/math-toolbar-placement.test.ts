import { describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { mathToolbarLeft, mathToolbarTop } from '../src/extensions/math';

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

  const bounds = { top: 80, bottom: 600 };

  it('opens below the node when it fits in the visible container', () => {
    expect(mathToolbarTop({ top: 200, bottom: 220 }, 280, bounds, 8)).toBe(220);
  });

  it('opens above the node when there is more room there', () => {
    expect(mathToolbarTop({ top: 450, bottom: 470 }, 280, bounds, 8)).toBe(170);
  });

  it('stays inside the visible container rather than the viewport', () => {
    expect(mathToolbarTop({ top: 300, bottom: 320 }, 280, bounds, 8)).toBe(312);
    expect(mathToolbarTop({ top: 340, bottom: 360 }, 280, bounds, 8)).toBe(88);
  });
});
