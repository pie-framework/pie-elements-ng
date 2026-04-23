import { describe, it, expect } from 'vitest';

import { buildLayout2Set, defaultGeometry2Set, hitTest } from '../src/delivery/layout.js';

const baseModel = { circles: [{ label: 'A' }, { label: 'B' }] };

describe('layout (2-set)', () => {
  it('produces the four expected region keys', () => {
    const layout = buildLayout2Set(baseModel);
    expect(Object.keys(layout.regionByKey).sort()).toEqual(['', '0', '0,1', '1']);
  });

  it('hitTest routes overlap > single > outside', () => {
    const layout = buildLayout2Set(baseModel);
    const { geometry } = layout;
    const [c0, c1] = geometry.circles;
    const mid = (c0.cx + c1.cx) / 2;
    expect(hitTest(layout, mid, c0.cy)?.key).toBe('0,1');
    expect(hitTest(layout, c0.cx - c0.r / 2, c0.cy)?.key).toBe('0');
    expect(hitTest(layout, c1.cx + c1.r / 2, c1.cy)?.key).toBe('1');
    // Well outside the diagram rect entirely: no region.
    expect(hitTest(layout, -10, -10)?.key ?? null).toBe(null);
    expect(hitTest(layout, geometry.width + 10, geometry.height + 10)?.key ?? null).toBe(null);
    // In the outside strip (bottom of the rect): outside region.
    const stripMid = layout.outsideStripTop + (geometry.height - layout.outsideStripTop) / 2;
    expect(hitTest(layout, geometry.width / 2, stripMid)?.key).toBe('');
    // Inside the rect but above the circles (corner / empty space): also outside.
    expect(hitTest(layout, 5, 5)?.key).toBe('');
  });

  it('stacks tiles vertically in single-circle and overlap regions (slotsPerRow=1)', () => {
    // Regression: when the overlap region is narrow (tight circle spacing in the
    // default 2-set geometry), placing more than one tile side-by-side caused
    // tiles to overflow into adjacent regions. We stack them vertically instead.
    const layout = buildLayout2Set(baseModel);
    const tileW = 110;
    const tileH = 44;
    for (const key of ['0', '1', '0,1']) {
      const region = layout.regionByKey[key];
      if (!region) throw new Error(`missing region ${key}`);
      const slot0 = region.gridSlot(0, tileW, tileH);
      const slot1 = region.gridSlot(1, tileW, tileH);
      const slot2 = region.gridSlot(2, tileW, tileH);
      expect(slot0.x).toBe(slot1.x);
      expect(slot0.x).toBe(slot2.x);
      expect(slot1.y).toBeGreaterThan(slot0.y);
      expect(slot2.y).toBeGreaterThan(slot1.y);
      // Each subsequent tile drops by exactly one row's worth of height (tileH
      // plus the internal row gap). If slotsPerRow ever accidentally becomes > 1
      // again, this invariant breaks because tiles would wrap horizontally.
      const step1 = slot1.y - slot0.y;
      const step2 = slot2.y - slot1.y;
      expect(step1).toBe(step2);
      expect(step1).toBeGreaterThanOrEqual(tileH);
    }
  });

  it('outside strip lays out tiles in a horizontal row (slotsPerRow>1)', () => {
    const layout = buildLayout2Set(baseModel);
    const outside = layout.regionByKey[''];
    if (!outside) throw new Error('missing outside region');
    const a = outside.gridSlot(0, 100, 40);
    const b = outside.gridSlot(1, 100, 40);
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBe(a.y);
  });

  it('outside strip sits below the circles but inside the diagram rect', () => {
    const layout = buildLayout2Set(baseModel);
    const { geometry } = layout;
    const circleBottom = Math.max(...geometry.circles.map((c) => c.cy + c.r));
    // Strip starts below every circle's bottom...
    expect(layout.outsideStripTop).toBeGreaterThanOrEqual(circleBottom);
    // ...and fits entirely inside the diagram rect (no separate bar below).
    expect(layout.outsideStripTop).toBeLessThan(geometry.height);
  });

  it('respects region label overrides and falls back to composed labels', () => {
    const layout = buildLayout2Set({
      circles: [{ label: 'Prime' }, { label: 'Odd' }],
      regionLabels: { '0,1': 'Both prime and odd' },
    });
    expect(layout.regionByKey['0,1']?.label).toBe('Both prime and odd');
    expect(layout.regionByKey['0']?.label).toBe('Prime only');
    expect(layout.regionByKey['1']?.label).toBe('Odd only');
    expect(layout.regionByKey['']?.label).toBe('Neither Prime nor Odd');
  });

  it('throws when circle count is not 2', () => {
    expect(() => buildLayout2Set({ circles: [{ label: 'A' }] } as never)).toThrow();
    expect(() =>
      buildLayout2Set({ circles: [{ label: 'A' }, { label: 'B' }, { label: 'C' }] } as never)
    ).toThrow();
  });

  it('hitRects meet the 120x120 minimum target from the PRD for all regions', () => {
    const layout = buildLayout2Set(baseModel);
    const geometry = defaultGeometry2Set();
    void geometry;
    for (const region of layout.regions) {
      expect(region.hitRect.w).toBeGreaterThanOrEqual(120);
      expect(region.hitRect.h).toBeGreaterThanOrEqual(120);
    }
  });
});
