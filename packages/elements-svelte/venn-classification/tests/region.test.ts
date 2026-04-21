import { describe, expect, it } from 'vitest';
import {
  composeRegionLabel,
  enumerateRegions,
  getRegionLabel,
  normalizeRegion,
  regionKey,
  regionsEqual,
} from '../src/controller/region.js';

describe('regionKey', () => {
  it('empty region keys to empty string', () => {
    expect(regionKey([])).toBe('');
    expect(regionKey(null)).toBe('');
    expect(regionKey(undefined)).toBe('');
  });

  it('sorts ascending and joins with commas', () => {
    expect(regionKey([0])).toBe('0');
    expect(regionKey([1, 0])).toBe('0,1');
    expect(regionKey([2, 0, 1])).toBe('0,1,2');
  });
});

describe('normalizeRegion', () => {
  it('returns a sorted-ascending copy', () => {
    expect(normalizeRegion([2, 0, 1])).toEqual([0, 1, 2]);
  });
  it('returns an empty array for null/undefined', () => {
    expect(normalizeRegion(null)).toEqual([]);
    expect(normalizeRegion(undefined)).toEqual([]);
  });
});

describe('regionsEqual', () => {
  it('treats sorted and unsorted regions as equal when the multisets match', () => {
    expect(regionsEqual([0, 1], [1, 0])).toBe(true);
  });
  it('distinguishes different sets', () => {
    expect(regionsEqual([0], [1])).toBe(false);
    expect(regionsEqual([0], [0, 1])).toBe(false);
  });
});

describe('enumerateRegions', () => {
  it('returns the 4 regions of a 2-set diagram in canonical order', () => {
    expect(enumerateRegions(2)).toEqual([[], [0], [1], [0, 1]]);
  });
  it('returns the 8 regions of a 3-set diagram', () => {
    expect(enumerateRegions(3).map(regionKey)).toEqual([
      '',
      '0',
      '1',
      '0,1',
      '2',
      '0,2',
      '1,2',
      '0,1,2',
    ]);
  });
});

describe('composeRegionLabel', () => {
  const circles = [{ label: 'Reptile' }, { label: 'Egg-layer' }];
  it('single-circle regions', () => {
    expect(composeRegionLabel(circles, [0])).toBe('Reptile only');
    expect(composeRegionLabel(circles, [1])).toBe('Egg-layer only');
  });
  it('overlap', () => {
    expect(composeRegionLabel(circles, [0, 1])).toBe('Reptile and Egg-layer');
  });
  it('outside for 2-set', () => {
    expect(composeRegionLabel(circles, [])).toBe('Neither Reptile nor Egg-layer');
  });
  it('outside for 3-set', () => {
    expect(composeRegionLabel([{ label: 'A' }, { label: 'B' }, { label: 'C' }], [])).toBe(
      'None of A, B, C'
    );
  });
});

describe('getRegionLabel', () => {
  it('prefers authored override', () => {
    const model = {
      circles: [{ label: 'Quadrilateral' }, { label: 'Has a right angle' }],
      regionLabels: { '0,1': 'Right-angled quadrilateral', '': 'Other shape' },
    };
    expect(getRegionLabel(model, [0, 1])).toBe('Right-angled quadrilateral');
    expect(getRegionLabel(model, [])).toBe('Other shape');
  });
  it('falls back to composed label when no override', () => {
    const model = {
      circles: [{ label: 'A' }, { label: 'B' }],
      regionLabels: {},
    };
    expect(getRegionLabel(model, [0])).toBe('A only');
    expect(getRegionLabel(model, [0, 1])).toBe('A and B');
  });
  it('ignores blank override', () => {
    const model = {
      circles: [{ label: 'A' }, { label: 'B' }],
      regionLabels: { '0,1': '   ' },
    };
    expect(getRegionLabel(model, [0, 1])).toBe('A and B');
  });
});
