/**
 * 2-set Venn layout + hit-testing helpers.
 *
 * Geometry lives in SVG viewBox coordinates so the delivery component can
 * render on any responsive size; the layout returns per-region descriptors
 * (label, hitRect for the rectangular drop-zone highlight, `pointInRegion`
 * for pointer hit-testing, and a `gridSlot` function for neatly placing
 * multiple tiles in the same region).
 *
 * The diagram rectangle IS the universal set: circles live in the upper
 * portion, and the "outside" region is everything inside the rect that
 * doesn't fall inside a circle. Outside-region tiles land in the bottom
 * strip (below the circles, still inside the rect) where there's room for
 * a horizontal row of tiles — that strip is what `hitRect` for the outside
 * region describes (used for the drop-highlight overlay and the 120×120
 * a11y minimum from the PRD). `pointInRegion` for outside is the broader
 * "inside rect, not in any circle" check, so the learner can drop anywhere
 * around the circles naturally.
 */

import type { Region, VennCircle, VennModel } from '../types.js';
import { enumerateRegions, getRegionLabel, regionKey } from '../controller/region.js';

export interface DiagramGeometry {
  width: number;
  height: number;
  /** Vertical gap between the bottom of the circles and the outside landing strip. */
  outsideGap: number;
  /** Minimum height reserved below the circles for outside tiles. */
  outsideStripHeight: number;
  circles: Array<{ cx: number; cy: number; r: number }>;
}

export interface RegionLayout {
  region: Region;
  key: string;
  label: string;
  /** Rectangular drop-zone bounds in viewBox coords. Used for highlight + keyboard focus rect. */
  hitRect: { x: number; y: number; w: number; h: number };
  /** True iff `(x, y)` falls in this region, given the geometry. */
  pointInRegion: (x: number, y: number) => boolean;
  /** Return the (x, y) center where tile `index` should land within this region. */
  gridSlot: (index: number, tileWidth: number, tileHeight: number) => { x: number; y: number };
}

export interface DiagramLayout {
  geometry: DiagramGeometry;
  regions: RegionLayout[];
  regionByKey: Record<string, RegionLayout>;
  /**
   * Y-coordinate in viewBox space where the outside strip (and its divider
   * hint) begins. The strip extends from here to `geometry.height`.
   */
  outsideStripTop: number;
}

/**
 * Default 2-set geometry. The entire rectangle is the "universal set":
 * circles occupy the top portion, and the outside strip beneath them is
 * where outside-region tiles land. Tuned so each region's `hitRect` clears
 * the 120×120 minimum hit-target from the PRD:
 *   left-only   ≈ 230 × 340
 *   right-only  ≈ 230 × 340
 *   overlap     ≈ 120 × 340
 *   outside     = 900 × 140 strip at the bottom of the rect
 */
export function defaultGeometry2Set(): DiagramGeometry {
  return {
    width: 900,
    height: 540,
    outsideGap: 20,
    outsideStripHeight: 140,
    circles: [
      { cx: 340, cy: 210, r: 170 },
      { cx: 560, cy: 210, r: 170 },
    ],
  };
}

function makeGridSlot(
  center: { x: number; y: number },
  slotsPerRow: number
): RegionLayout['gridSlot'] {
  return (index, tileWidth, tileHeight) => {
    const col = index % slotsPerRow;
    const row = Math.floor(index / slotsPerRow);
    const colGap = 8;
    const rowGap = 8;
    const rowWidth = slotsPerRow * tileWidth + (slotsPerRow - 1) * colGap;
    const startX = center.x - rowWidth / 2 + tileWidth / 2;
    return {
      x: startX + col * (tileWidth + colGap),
      y: center.y + row * (tileHeight + rowGap),
    };
  };
}

/**
 * Build the 2-set layout for a concrete model (uses model circle labels to
 * compose accessible names, and `model.regionLabels` for overrides).
 */
export function buildLayout2Set(
  model: Pick<VennModel, 'circles' | 'regionLabels'>,
  geometry: DiagramGeometry = defaultGeometry2Set()
): DiagramLayout {
  if (!model.circles || model.circles.length !== 2) {
    throw new Error(
      `buildLayout2Set requires exactly 2 circles (got ${model.circles?.length ?? 0})`
    );
  }

  const [c0, c1] = geometry.circles;
  const regions = enumerateRegions(2);

  // Outside strip sits below the circles, inside the rect. We compute its top
  // from the bottom of the tallest circle (+ outsideGap) rather than relying
  // on a fixed diagramHeight so custom geometries don't have to be coupled.
  const circleBottom = Math.max(c0.cy + c0.r, c1.cy + c1.r);
  const outsideStripTop = Math.min(
    geometry.height - geometry.outsideStripHeight,
    circleBottom + geometry.outsideGap
  );

  const pointInCircle = (cx: number, cy: number, r: number) => (x: number, y: number) => {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r;
  };
  const inC0 = pointInCircle(c0.cx, c0.cy, c0.r);
  const inC1 = pointInCircle(c1.cx, c1.cy, c1.r);

  const overlapLeft = c1.cx - c1.r;
  const overlapRight = c0.cx + c0.r;
  const overlapCenterX = (overlapLeft + overlapRight) / 2;

  const hitRectLeftOnly = {
    x: Math.max(0, c0.cx - c0.r - 10),
    y: Math.max(0, c0.cy - c0.r),
    w: overlapLeft - Math.max(0, c0.cx - c0.r - 10),
    h: 2 * c0.r,
  };
  const hitRectRightOnly = {
    x: overlapRight,
    y: Math.max(0, c1.cy - c1.r),
    w: Math.min(geometry.width, c1.cx + c1.r + 10) - overlapRight,
    h: 2 * c1.r,
  };
  const hitRectOverlap = {
    x: overlapLeft,
    y: Math.max(0, Math.min(c0.cy, c1.cy) - Math.min(c0.r, c1.r)),
    w: overlapRight - overlapLeft,
    h: 2 * Math.min(c0.r, c1.r),
  };
  const hitRectOutside = {
    x: 0,
    y: outsideStripTop,
    w: geometry.width,
    h: geometry.height - outsideStripTop,
  };

  const regionByKey: Record<string, RegionLayout> = {};
  const out: RegionLayout[] = regions.map((region) => {
    const key = regionKey(region);
    const label = getRegionLabel(model as VennModel, region);
    let pointInRegion: RegionLayout['pointInRegion'];
    let hitRect: RegionLayout['hitRect'];
    let center: { x: number; y: number };
    let slotsPerRow: number;

    if (key === '') {
      // Outside = inside the diagram rect, but not inside any circle. This is
      // the classic "universal set" visual: learners can drop anywhere outside
      // the circles and it counts as the outside region.
      pointInRegion = (x, y) =>
        x >= 0 &&
        x <= geometry.width &&
        y >= 0 &&
        y <= geometry.height &&
        !inC0(x, y) &&
        !inC1(x, y);
      hitRect = hitRectOutside;
      // Tiles still land in a neat row in the bottom strip, which is where
      // there's guaranteed width for multiple tiles and the 120×120 minimum.
      center = { x: geometry.width / 2, y: outsideStripTop + hitRectOutside.h / 2 };
      slotsPerRow = 6;
    } else if (key === '0') {
      pointInRegion = (x, y) => inC0(x, y) && !inC1(x, y);
      hitRect = hitRectLeftOnly;
      center = { x: c0.cx - c0.r / 3, y: c0.cy };
      slotsPerRow = 1;
    } else if (key === '1') {
      pointInRegion = (x, y) => inC1(x, y) && !inC0(x, y);
      hitRect = hitRectRightOnly;
      center = { x: c1.cx + c1.r / 3, y: c1.cy };
      slotsPerRow = 1;
    } else if (key === '0,1') {
      pointInRegion = (x, y) => inC0(x, y) && inC1(x, y);
      hitRect = hitRectOverlap;
      center = { x: overlapCenterX, y: (c0.cy + c1.cy) / 2 };
      slotsPerRow = 1;
    } else {
      // Defensive fallback (shouldn't happen for 2-set).
      pointInRegion = () => false;
      hitRect = { x: 0, y: 0, w: 0, h: 0 };
      center = { x: 0, y: 0 };
      slotsPerRow = 1;
    }

    const layout: RegionLayout = {
      region,
      key,
      label,
      hitRect,
      pointInRegion,
      gridSlot: makeGridSlot(center, slotsPerRow),
    };
    regionByKey[key] = layout;
    return layout;
  });

  return {
    geometry,
    regions: out,
    regionByKey,
    outsideStripTop,
  };
}

/**
 * Resolve a pointer hit to its region. `pointer` is in viewBox coords.
 * Returns the matched region's descriptor, or `null` for "no region".
 * Regions are tested in an order that prefers overlap > single-circle > outside.
 */
export function hitTest(layout: DiagramLayout, x: number, y: number): RegionLayout | null {
  const order = ['0,1', '0', '1', ''];
  for (const key of order) {
    const r = layout.regionByKey[key];
    if (r && r.pointInRegion(x, y)) return r;
  }
  return null;
}

/** Re-export for convenience so consumers can import everything from layout.ts. */
export { enumerateRegions, regionKey, getRegionLabel };
export type { VennCircle };
