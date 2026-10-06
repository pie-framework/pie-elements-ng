import { describe, it, expect } from 'vitest';

import { fitToRange, sliderKeyValue } from '../keyboard';
import { snapTo } from '../utils';

const range = { min: 0, max: 10, step: 2 };

describe('sliderKeyValue', () => {
  it('moves one step up with ArrowUp and ArrowRight', () => {
    expect(sliderKeyValue('ArrowUp', 4, range)).toBe(6);
    expect(sliderKeyValue('ArrowRight', 4, range)).toBe(6);
  });

  it('moves one step down with ArrowDown and ArrowLeft', () => {
    expect(sliderKeyValue('ArrowDown', 4, range)).toBe(2);
    expect(sliderKeyValue('ArrowLeft', 4, range)).toBe(2);
  });

  it('goes to the ends of the range with Home and End', () => {
    expect(sliderKeyValue('Home', 4, range)).toBe(0);
    expect(sliderKeyValue('End', 4, range)).toBe(10);
  });

  it('clamps at the ends of the range', () => {
    expect(sliderKeyValue('ArrowUp', 10, range)).toBe(10);
    expect(sliderKeyValue('ArrowDown', 0, range)).toBe(0);
  });

  it('moves an off-grid value to the next grid point in the direction of the key', () => {
    expect(sliderKeyValue('ArrowUp', 3, range)).toBe(4);
    expect(sliderKeyValue('ArrowDown', 3, range)).toBe(2);
  });

  it('steps from the minimum of a range that does not start at zero', () => {
    const offset = { min: 1, max: 7, step: 3 };

    expect(sliderKeyValue('ArrowUp', 1, offset)).toBe(4);
    expect(sliderKeyValue('ArrowUp', 4, offset)).toBe(7);
    expect(sliderKeyValue('ArrowDown', 4, offset)).toBe(1);
  });

  it('keeps fractional steps to four decimals', () => {
    const tenths = { min: 0, max: 1, step: 0.1 };

    expect(sliderKeyValue('ArrowUp', 0.2, tenths)).toBe(0.3);
    expect(sliderKeyValue('ArrowDown', 0.3, tenths)).toBe(0.2);
  });

  it('takes the large step with PageUp and PageDown', () => {
    const large = { min: 0, max: 100, step: 1, largeStep: 10 };

    expect(sliderKeyValue('PageUp', 42, large)).toBe(50);
    expect(sliderKeyValue('PageDown', 42, large)).toBe(40);
    expect(sliderKeyValue('PageUp', 95, large)).toBe(100);
  });

  it('leaves PageUp and PageDown unhandled without a large step', () => {
    expect(sliderKeyValue('PageUp', 4, range)).toBeUndefined();
    expect(sliderKeyValue('PageDown', 4, range)).toBeUndefined();
  });

  it('leaves other keys unhandled', () => {
    expect(sliderKeyValue('Tab', 4, range)).toBeUndefined();
    expect(sliderKeyValue('a', 4, range)).toBeUndefined();
  });

  it('leaves the value where it is for a step that is not positive', () => {
    expect(sliderKeyValue('ArrowUp', 4, { ...range, step: 0 })).toBe(4);
    expect(sliderKeyValue('ArrowDown', 4, { ...range, step: -2 })).toBe(4);
  });

  it('starts a value that is not a number from the minimum', () => {
    expect(sliderKeyValue('ArrowUp', NaN, range)).toBe(2);
  });

  it('lands where the drag snap puts the value', () => {
    const snapped = { min: 0, max: 10, step: 2, snap: snapTo.bind(null, 0, 10, 5) };

    expect(sliderKeyValue('ArrowUp', 4, snapped)).toBe(5);
    expect(sliderKeyValue('ArrowDown', 6, snapped)).toBe(5);
  });

  it('steps on when the snap pulls a step back to where it started', () => {
    const snapped = { min: 0, max: 10, step: 2, snap: snapTo.bind(null, 0, 10, 5) };

    expect(sliderKeyValue('ArrowUp', 0, snapped)).toBe(5);
    expect(sliderKeyValue('ArrowDown', 10, snapped)).toBe(5);
  });

  it('steps through the snap grid when the minimum is off it', () => {
    // the drag snaps a range of 1 to 7 with step 3 onto 0, 3 and 6, clamped to 1 to 6
    const offGrid = { min: 1, max: 7, step: 3, snap: snapTo.bind(null, 0, 6, 3) };

    expect(sliderKeyValue('Home', 4, offGrid)).toBe(1);
    expect(sliderKeyValue('ArrowUp', 1, offGrid)).toBe(3);
    expect(sliderKeyValue('ArrowUp', 3, offGrid)).toBe(6);
    expect(sliderKeyValue('ArrowUp', 6, offGrid)).toBe(6);
    expect(sliderKeyValue('End', 1, offGrid)).toBe(6);
  });
});

describe('fitToRange', () => {
  it('clamps to the range', () => {
    expect(fitToRange(-3, range)).toBe(0);
    expect(fitToRange(14, range)).toBe(10);
  });

  it('snaps with the snap function', () => {
    expect(fitToRange(7, { ...range, snap: snapTo.bind(null, 0, 10, 5) })).toBe(5);
  });
});
