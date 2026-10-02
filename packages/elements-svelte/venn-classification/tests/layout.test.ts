import { describe, it, expect } from 'vitest';

import {
  buildLayout2Set,
  DIAGRAM_MAX_VIEWPORT_HEIGHT,
  DIAGRAM_MAX_WIDTH_PX,
  defaultGeometry2Set,
  diagramCssWidth,
  fitGeometry2Set,
  hitTest,
  IMAGE_TILE_CELL,
  MIN_TILE_PX,
  minTileScale,
  placedTileScale,
  TEXT_TILE_CELL,
  TILE_GAP,
  type Point,
  type Rect,
  type RegionLayout,
  type TileCell,
} from '../src/delivery/layout.js';

const baseModel = { circles: [{ label: 'A' }, { label: 'B' }] };
const REGION_KEYS = ['0', '0,1', '1', ''];
const CELLS: Array<[string, TileCell]> = [
  ['text', TEXT_TILE_CELL],
  ['image', IMAGE_TILE_CELL],
];
/** Tile counts to place in one region; more than any region holds at the base size. */
const MAX_TILES = 24;

/** True iff every sampled point of `rect` (its edges at 1-unit steps and an interior grid) is in `region`. */
function rectInRegion(region: RegionLayout, rect: Rect): boolean {
  const { x, y, w, h } = rect;
  for (let i = 0; i <= w; i++) {
    if (!region.pointInRegion(x + i, y) || !region.pointInRegion(x + i, y + h)) return false;
  }
  for (let j = 0; j <= h; j++) {
    if (!region.pointInRegion(x, y + j) || !region.pointInRegion(x + w, y + j)) return false;
  }
  for (let i = 0; i <= w; i += 4) {
    for (let j = 0; j <= h; j += 4) {
      if (!region.pointInRegion(x + i, y + j)) return false;
    }
  }
  return true;
}

function tileRect(slot: Point, cell: TileCell): Rect {
  return { x: slot.x - cell.w / 2, y: slot.y - cell.h / 2, w: cell.w, h: cell.h };
}

/** True iff no two tile cells overlap or come closer than `TILE_GAP`. */
function apart(slots: Point[], cell: TileCell): boolean {
  const eps = 1e-6;
  for (let a = 0; a < slots.length; a++) {
    for (let b = a + 1; b < slots.length; b++) {
      const dx = Math.abs(slots[a].x - slots[b].x);
      const dy = Math.abs(slots[a].y - slots[b].y);
      if (dx < cell.w + TILE_GAP - eps && dy < cell.h + TILE_GAP - eps) return false;
    }
  }
  return true;
}

function expectTilesFit(region: RegionLayout, slots: Point[], cell: TileCell, count: number) {
  expect(slots).toHaveLength(count);
  for (const slot of slots) {
    expect(rectInRegion(region, tileRect(slot, cell)), `tile at ${slot.x},${slot.y}`).toBe(true);
  }
  expect(apart(slots, cell)).toBe(true);
}

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

  for (const [name, cell] of CELLS) {
    it(`keeps every ${name} tile inside its region, whichever region holds them all`, () => {
      for (const key of REGION_KEYS) {
        for (let count = 1; count <= MAX_TILES; count++) {
          const layout = buildLayout2Set(baseModel, fitGeometry2Set({ [key]: count }, cell), cell);
          const region = layout.regionByKey[key];
          expectTilesFit(region, region.slots(count), cell, count);
        }
      }
    });

    it(`keeps ${name} tiles inside their regions when every region holds some`, () => {
      const counts = { '0': 7, '0,1': 9, '1': 4, '': 13 };
      const layout = buildLayout2Set(baseModel, fitGeometry2Set(counts, cell), cell);
      for (const [key, count] of Object.entries(counts)) {
        const region = layout.regionByKey[key];
        expectTilesFit(region, region.slots(count), cell, count);
      }
    });
  }

  it('fits what the base diagram holds without growing it', () => {
    const base = defaultGeometry2Set();
    const layout = buildLayout2Set(baseModel, base);
    for (const region of layout.regions) {
      expect(region.capacity).toBeGreaterThanOrEqual(4);
      const fitted = fitGeometry2Set({ [region.key]: region.capacity });
      expect(fitted).toEqual(base);
    }
  });

  it('grows the circles for a circle region out of cells', () => {
    const base = defaultGeometry2Set();
    const overlap = buildLayout2Set(baseModel, base).regionByKey['0,1'];
    const grown = fitGeometry2Set({ '0,1': overlap.capacity + 1 });
    expect(grown.scale).toBeGreaterThan(1);
    expect(grown.circles[0].r).toBeGreaterThan(base.circles[0].r);
  });

  it('grows only the outside strip for outside tiles', () => {
    const base = defaultGeometry2Set();
    const outside = buildLayout2Set(baseModel, base).regionByKey[''];
    const grown = fitGeometry2Set({ '': outside.capacity + 1 });
    expect(grown.scale).toBe(1);
    expect(grown.width).toBe(base.width);
    expect(grown.height).toBeGreaterThan(base.height);
  });

  it('centers a lone tile in its region', () => {
    const layout = buildLayout2Set(baseModel);
    const [c0] = layout.geometry.circles;
    for (const key of ['0', '0,1', '1']) {
      expect(layout.regionByKey[key].slots(1)[0].y).toBe(c0.cy);
    }
    const [lone] = layout.regionByKey[''].slots(1);
    expect(lone.x).toBe(layout.geometry.width / 2);
    expect(lone.y).toBe((layout.outsideStripTop + layout.geometry.height) / 2);
  });

  it('puts tiles past a region’s capacity on its last cell', () => {
    const layout = buildLayout2Set(baseModel);
    const overlap = layout.regionByKey['0,1'];
    const slots = overlap.slots(overlap.capacity + 2);
    expect(slots).toHaveLength(overlap.capacity + 2);
    expect(slots.at(-1)).toEqual(slots[overlap.capacity - 1]);
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
});

describe('layout (2-set) drop targets in CSS px', () => {
  const geometries = [
    ['base', defaultGeometry2Set()],
    ['grown circles', fitGeometry2Set({ '0': 20 }, IMAGE_TILE_CELL)],
    ['grown strip', fitGeometry2Set({ '': 30 })],
  ] as const;

  for (const [name, geometry] of geometries) {
    it(`holds a 120×120 CSS px drop target in every region at the max width (${name})`, () => {
      // At the max width the diagram renders `DIAGRAM_MAX_WIDTH_PX` wide.
      const cssPerUnit = DIAGRAM_MAX_WIDTH_PX / geometry.width;
      const layout = buildLayout2Set(baseModel, geometry);
      for (const region of layout.regions) {
        expect(region.hitRect.w * cssPerUnit, region.key).toBeGreaterThanOrEqual(120);
        expect(region.hitRect.h * cssPerUnit, region.key).toBeGreaterThanOrEqual(120);
        expect(rectInRegion(region, region.hitRect), region.key).toBe(true);
      }
    });
  }

  it("keeps the diagram box at the viewBox's aspect ratio when the viewport height caps it", () => {
    const geometry = defaultGeometry2Set();
    const { maxPx, capVh } = parseCssWidth(diagramCssWidth(geometry, TEXT_TILE_CELL));
    expect(maxPx).toBe(DIAGRAM_MAX_WIDTH_PX);
    // At the cap the height is DIAGRAM_MAX_VIEWPORT_HEIGHT × 100vh.
    expect(capVh / (DIAGRAM_MAX_VIEWPORT_HEIGHT * 100)).toBeCloseTo(
      geometry.width / geometry.height,
      6
    );
  });

  it('renders an uncrowded diagram at the max width in a tall viewport', () => {
    const geometry = defaultGeometry2Set();
    expect(renderedWidth(geometry, TEXT_TILE_CELL, 1200, 1400)).toBe(DIAGRAM_MAX_WIDTH_PX);
  });

  const crowded = [
    ['base', {}],
    ['a crowded crescent', { '0': 14 }],
    ['a crowded overlap', { '0,1': 12 }],
    ['a crowded strip', { '': 30 }],
  ] as const;
  for (const [name, cell] of CELLS) {
    for (const [what, counts] of crowded) {
      it(`keeps ${name} tiles within their cells in any viewport height (${what})`, () => {
        const geometry = fitGeometry2Set(counts, cell);
        for (const viewportHeight of [400, 650, 900, 1400]) {
          const width = renderedWidth(geometry, cell, 2000, viewportHeight);
          const cellScale = width / geometry.width;
          expect(placedTileScale(width, geometry, cell), `${viewportHeight}px`).toBeLessThanOrEqual(
            cellScale + 1e-9
          );
        }
      });
    }
  }
});

/** The terms of `diagramCssWidth`'s `min(100%, max(min(Apx, Bvh), Cpx))`. */
function parseCssWidth(css: string) {
  const match = css.match(/^min\(100%, max\(min\(([\d.]+)px, ([\d.]+)vh\), ([\d.]+)px\)\)$/);
  if (!match) throw new Error(`unexpected diagram width ${css}`);
  return { maxPx: Number(match[1]), capVh: Number(match[2]), floorPx: Number(match[3]) };
}

/** The width a browser gives `diagramCssWidth` in a container and viewport of the given px. */
function renderedWidth(
  geometry: ReturnType<typeof defaultGeometry2Set>,
  cell: TileCell,
  containerPx: number,
  viewportHeightPx: number
): number {
  const { maxPx, capVh, floorPx } = parseCssWidth(diagramCssWidth(geometry, cell));
  return Math.min(
    containerPx,
    Math.max(Math.min(maxPx, (capVh * viewportHeightPx) / 100), floorPx)
  );
}

describe('placed tile scale', () => {
  const geometry = defaultGeometry2Set();

  it('scales tiles with the rendered diagram so each fills its cell', () => {
    expect(placedTileScale(geometry.width, geometry, TEXT_TILE_CELL)).toBe(1);
    expect(placedTileScale(geometry.width * 0.9, geometry, TEXT_TILE_CELL)).toBeCloseTo(0.9, 10);
  });

  for (const [name, cell] of CELLS) {
    it(`keeps a ${name} tile at the 44 px minimum hit target`, () => {
      const scale = placedTileScale(geometry.width * 0.3, geometry, cell);
      expect(scale).toBe(minTileScale(cell));
      expect(scale * Math.min(cell.w, cell.h)).toBeCloseTo(MIN_TILE_PX, 10);
    });
  }

  it('renders at full size before the diagram is measured', () => {
    expect(placedTileScale(0, geometry, TEXT_TILE_CELL)).toBe(1);
  });
});
