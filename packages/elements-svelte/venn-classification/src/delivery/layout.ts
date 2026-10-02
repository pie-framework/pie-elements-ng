/**
 * 2-set Venn layout + hit-testing helpers.
 *
 * Geometry lives in SVG viewBox coordinates. At the base size one unit is one
 * CSS px when the diagram renders at `DIAGRAM_MAX_WIDTH_PX`; the delivery
 * component scales everything, placed tiles included, with the rendered width.
 * The layout returns per-region descriptors: label, `hitRect` (a rectangle
 * inside the region, used for the 120×120 drop-target minimum from the PRD and
 * to anchor the region's accessible element), `pointInRegion` for pointer
 * hit-testing, and `slots` for placing tiles on a grid fitted to the region's
 * shape.
 *
 * The diagram rectangle IS the universal set: circles live in the upper
 * portion, and the "outside" region is everything inside the rect that
 * doesn't fall inside a circle. Outside-region tiles land in the bottom strip
 * (below the circles, still inside the rect). `pointInRegion` for outside is
 * the broader "inside rect, not in any circle" check, so the learner can drop
 * anywhere around the circles naturally.
 *
 * Every slot keeps its whole tile cell, plus `REGION_MARGIN`, inside its
 * region, and no two cells of one region overlap. A region holds a fixed number
 * of cells for a given geometry; `fitGeometry2Set` grows the geometry until each
 * region holds the tiles placed in it.
 */

import type { Region, VennCircle, VennModel } from '../types.js';
import { enumerateRegions, getRegionLabel, regionKey } from '../controller/region.js';

/** A placed tile's grid cell, in viewBox units. */
export interface TileCell {
  w: number;
  h: number;
}

/** Cell of a text (or math) tile: two lines of label. */
export const TEXT_TILE_CELL: TileCell = { w: 120, h: 52 };
/** Cell of a tile with an image and a one-line caption. */
export const IMAGE_TILE_CELL: TileCell = { w: 120, h: 84 };
/** Space between neighbouring cells. */
export const TILE_GAP = 8;
/** Clearance between a cell and its region's edge; the circle stroke is 2 wide. */
export const REGION_MARGIN = 6;

/** CSS max width of the diagram. */
export const DIAGRAM_MAX_WIDTH_PX = 720;
/** Share of the viewport height the diagram may take, so the tray stays in view. */
export const DIAGRAM_MAX_VIEWPORT_HEIGHT = 0.6;
/** The PRD's minimum tile hit target, in CSS px. */
export const MIN_TILE_PX = 44;

/**
 * Placed tiles shrink with the diagram down to this factor of their cell,
 * which keeps the cell's shorter side at `MIN_TILE_PX`. A diagram rendered at
 * less than this factor of its viewBox width draws its tiles larger than their
 * cells.
 */
export function minTileScale(cell: TileCell): number {
  return Math.min(1, MIN_TILE_PX / Math.min(cell.w, cell.h));
}

/** Base 2-set geometry, before `scale`. Width: 2 × side + 2 × radius + distance = 720. */
const BASE = {
  side: 24,
  top: 40,
  radius: 236,
  centerDistance: 200,
  outsideGap: 12,
  outsideStripHeight: 136,
};

/** Growth step of `fitGeometry2Set`. */
const SCALE_STEP = 0.05;

export interface DiagramGeometry {
  width: number;
  height: number;
  /**
   * Size of the diagram chrome (labels, strokes, margins) relative to the base
   * geometry. Tile cells do not grow with it.
   */
  scale: number;
  /** Vertical gap between the bottom of the circles and the outside landing strip. */
  outsideGap: number;
  /** Height reserved below the circles for outside tiles. */
  outsideStripHeight: number;
  circles: Array<{ cx: number; cy: number; r: number }>;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RegionLayout {
  region: Region;
  key: string;
  label: string;
  /** A rectangle inside the region, in viewBox coords: the guaranteed drop target. */
  hitRect: Rect;
  /** True iff `(x, y)` falls in this region, given the geometry. */
  pointInRegion: (x: number, y: number) => boolean;
  /** How many cells the region holds. */
  capacity: number;
  /**
   * Cell centers for `count` tiles in this region, in reading order. Past
   * `capacity` (a geometry `fitGeometry2Set` did not size for the count) the
   * extra tiles share the last cell, or the middle of `hitRect` in a region
   * too small for one.
   */
  slots: (count: number) => Point[];
}

export interface DiagramLayout {
  geometry: DiagramGeometry;
  cell: TileCell;
  regions: RegionLayout[];
  regionByKey: Record<string, RegionLayout>;
  /**
   * Y-coordinate in viewBox space where the outside strip (and its divider
   * hint) begins. The strip extends from here to `geometry.height`.
   */
  outsideStripTop: number;
}

/**
 * The 2-set geometry at `scale` times the base size, with an outside strip at
 * least `outsideStripHeight` tall. The base holds a 120×120 CSS px square in
 * each region at the 720 px max width:
 *   left-only / right-only  ≈ 182 × 182 around the circle's center line
 *   overlap                 ≈ 235 × 235
 *   outside                 = 720 × 136 strip at the bottom of the rect
 */
export function geometry2Set(scale = 1, outsideStripHeight = 0): DiagramGeometry {
  const side = BASE.side * scale;
  const r = BASE.radius * scale;
  const d = BASE.centerDistance * scale;
  const cy = BASE.top * scale + r;
  const outsideGap = BASE.outsideGap * scale;
  const strip = Math.max(BASE.outsideStripHeight * scale, outsideStripHeight);
  return {
    width: 2 * side + 2 * r + d,
    height: cy + r + outsideGap + strip,
    scale,
    outsideGap,
    outsideStripHeight: strip,
    circles: [
      { cx: side + r, cy, r },
      { cx: side + r + d, cy, r },
    ],
  };
}

/** The base 2-set geometry. */
export function defaultGeometry2Set(): DiagramGeometry {
  return geometry2Set();
}

/**
 * The diagram's CSS width: `DIAGRAM_MAX_WIDTH_PX`, or less where the height
 * would pass `DIAGRAM_MAX_VIEWPORT_HEIGHT` of the viewport. It never drops
 * below the width that draws `cell` tiles at `minTileScale`, where each tile
 * exactly fills its cell at the 44 px minimum; a crowded region can push that
 * past the max width. Only a narrower container renders it smaller, and there
 * tiles outgrow their cells. The aspect ratio sets the height, so the box
 * matches the viewBox: tile positions and pointer hits map onto the box, and a
 * letterboxed drawing would leave them off the circles.
 */
export function diagramCssWidth(geometry: DiagramGeometry, cell: TileCell): string {
  const vh = (DIAGRAM_MAX_VIEWPORT_HEIGHT * 100 * geometry.width) / geometry.height;
  const floor = geometry.width * minTileScale(cell);
  return `min(100%, max(min(${DIAGRAM_MAX_WIDTH_PX}px, ${vh}vh), ${floor}px))`;
}

/**
 * Scale for placed tiles when the diagram renders `renderedWidth` CSS px wide:
 * each tile stays the size of its cell, down to `minTileScale(cell)`.
 * Unmeasured (0) renders at full size.
 */
export function placedTileScale(
  renderedWidth: number,
  geometry: DiagramGeometry,
  cell: TileCell
): number {
  if (!(renderedWidth > 0)) return 1;
  return Math.max(minTileScale(cell), Math.min(1, renderedWidth / geometry.width));
}

type Circle = DiagramGeometry['circles'][number];

/** One row of cells: its center line, the x-range cells may use, and how many fit. */
interface Row {
  y: number;
  lo: number;
  hi: number;
  n: number;
}

function cellsIn(length: number, cell: TileCell): number {
  // The epsilon keeps float noise in a scaled geometry from dropping an exact fit.
  return Math.max(0, Math.floor((length + TILE_GAP) / (cell.w + TILE_GAP) + 1e-9));
}

/** Half-width of circle `c` at vertical distance `dy` from its center, or -1 past it. */
function halfChord(c: Circle, dy: number): number {
  return dy > c.r ? -1 : Math.sqrt(c.r * c.r - dy * dy);
}

/** The x-range where a rectangle spanning `[y0, y1]` lies inside `c`. */
function insideSpan(c: Circle, y0: number, y1: number): [number, number] | null {
  const hw = halfChord(c, Math.max(Math.abs(y0 - c.cy), Math.abs(y1 - c.cy)));
  return hw < 0 ? null : [c.cx - hw, c.cx + hw];
}

/** How far `c` reaches horizontally from its center within `[y0, y1]`, or -1 if not at all. */
function reach(c: Circle, y0: number, y1: number): number {
  const dy = y0 <= c.cy && c.cy <= y1 ? 0 : Math.min(Math.abs(y0 - c.cy), Math.abs(y1 - c.cy));
  return halfChord(c, dy);
}

/**
 * The x-range where a rectangle spanning `[y0, y1]` lies in the circle region
 * `key`, or null. Exact: a rectangle is inside a circle iff its corners are,
 * and misses one iff it clears the circle's widest chord within its rows.
 */
function regionSpan(
  key: string,
  c0: Circle,
  c1: Circle,
  y0: number,
  y1: number
): [number, number] | null {
  const in0 = insideSpan(c0, y0, y1);
  const in1 = insideSpan(c1, y0, y1);
  let lo: number;
  let hi: number;
  if (key === '0') {
    if (!in0) return null;
    const r1 = reach(c1, y0, y1);
    [lo, hi] = [in0[0], r1 < 0 ? in0[1] : Math.min(in0[1], c1.cx - r1)];
  } else if (key === '1') {
    if (!in1) return null;
    const r0 = reach(c0, y0, y1);
    [lo, hi] = [r0 < 0 ? in1[0] : Math.max(in1[0], c0.cx + r0), in1[1]];
  } else {
    if (!in0 || !in1) return null;
    [lo, hi] = [Math.max(in0[0], in1[0]), Math.min(in0[1], in1[1])];
  }
  return hi > lo ? [lo, hi] : null;
}

/**
 * Rows of cells in a circle region in its two vertical phases: a row on the
 * circles' center line, and two rows straddling it.
 */
function circlePhases(key: string, c0: Circle, c1: Circle, cell: TileCell): Row[][] {
  const pitch = cell.h + TILE_GAP;
  const cy = c0.cy;
  const reachY = Math.max(c0.r, c1.r);
  return [0, 0.5].map((phase) => {
    const rows: Row[] = [];
    const steps = Math.ceil(reachY / pitch) + 1;
    for (let i = -steps; i <= steps; i++) {
      const y = cy + (i + phase) * pitch;
      const span = regionSpan(
        key,
        c0,
        c1,
        y - cell.h / 2 - REGION_MARGIN,
        y + cell.h / 2 + REGION_MARGIN
      );
      if (!span) continue;
      const lo = span[0] + REGION_MARGIN;
      const hi = span[1] - REGION_MARGIN;
      const n = cellsIn(hi - lo, cell);
      if (n > 0) rows.push({ y, lo, hi, n });
    }
    return rows;
  });
}

function rowsCapacity(rows: Row[]): number {
  return rows.reduce((sum, row) => sum + row.n, 0);
}

/**
 * Slots in the outside strip: as many full-width rows as `count` needs, the
 * block of them centered in the strip.
 */
function stripSlots(
  geometry: DiagramGeometry,
  stripTop: number,
  cell: TileCell
): { capacity: number; slots: RegionLayout['slots'] } {
  const lo = REGION_MARGIN;
  const hi = geometry.width - REGION_MARGIN;
  const n = cellsIn(hi - lo, cell);
  const pitch = cell.h + TILE_GAP;
  const stripHeight = geometry.height - stripTop;
  const rowCount = Math.max(
    0,
    Math.floor((stripHeight - 2 * REGION_MARGIN + TILE_GAP) / pitch + 1e-9)
  );
  const capacity = n * rowCount;
  const fallback = { x: geometry.width / 2, y: stripTop + stripHeight / 2 };
  const slots = (count: number): Point[] => {
    if (count <= 0) return [];
    const fitting = Math.min(count, capacity);
    const used = n > 0 ? Math.ceil(fitting / n) : 0;
    const top = stripTop + (stripHeight - (used * pitch - TILE_GAP)) / 2;
    const rows = Array.from({ length: used }, (_, i) => ({
      y: top + cell.h / 2 + i * pitch,
      lo,
      hi,
      n,
    }));
    return padSlots(fillRows(rows, fitting, cell), count, fallback);
  };
  return { capacity, slots };
}

function rectCenter(rect: Rect): Point {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

/** `k` cell centers spread evenly around the middle of `row`. */
function rowCenters(row: Row, k: number, cell: TileCell): Point[] {
  const width = k * cell.w + (k - 1) * TILE_GAP;
  const start = (row.lo + row.hi) / 2 - width / 2 + cell.w / 2;
  return Array.from({ length: k }, (_, i) => ({ x: start + i * (cell.w + TILE_GAP), y: row.y }));
}

/** The rows nearest `centerY` that together hold `count` cells, top to bottom. */
function rowsNearCenter(rows: Row[], centerY: number, count: number): Row[] {
  const ranked = [...rows].sort(
    (a, b) => Math.abs(a.y - centerY) - Math.abs(b.y - centerY) || a.y - b.y
  );
  const used: Row[] = [];
  let room = 0;
  for (const row of ranked) {
    if (room >= count) break;
    used.push(row);
    room += row.n;
  }
  return used.sort((a, b) => a.y - b.y);
}

/** Fill `rows` top to bottom with `count` tiles, each row's tiles centered in it. */
function fillRows(rows: Row[], count: number, cell: TileCell): Point[] {
  const out: Point[] = [];
  let left = count;
  for (const row of rows) {
    const k = Math.min(row.n, left);
    out.push(...rowCenters(row, k, cell));
    left -= k;
  }
  return out;
}

/** Tiles past what the cells hold share the last cell, or `fallback` without one. */
function padSlots(slots: Point[], count: number, fallback: Point): Point[] {
  const last = slots[slots.length - 1] ?? fallback;
  while (slots.length < count) slots.push({ ...last });
  return slots;
}

/**
 * Slots in a circle region: the rows nearest the center line that hold
 * `count`, in the phase that needs fewer rows and, on a tie, sits closer to
 * centered on the line.
 */
function circleSlots(phases: Row[][], centerY: number, cell: TileCell, fallback: Point) {
  const capacity = Math.max(...phases.map(rowsCapacity));
  return (count: number): Point[] => {
    if (count <= 0) return [];
    const fitting = Math.min(count, capacity);
    let best: Row[] | null = null;
    let bestScore: [number, number] = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
    for (const rows of phases) {
      if (rowsCapacity(rows) < fitting) continue;
      const used = rowsNearCenter(rows, centerY, fitting);
      const offCenter = Math.abs(used.reduce((sum, row) => sum + row.y, 0) / used.length - centerY);
      const score: [number, number] = [used.length, offCenter];
      if (
        score[0] < bestScore[0] ||
        (score[0] === bestScore[0] && score[1] < bestScore[1] - 1e-9)
      ) {
        best = used;
        bestScore = score;
      }
    }
    return padSlots(best ? fillRows(best, fitting, cell) : [], count, fallback);
  };
}

/**
 * The largest band around `cy` whose rows fit region `key` at least as wide as
 * they are tall, one unit inside the region's edge: the region's guaranteed
 * square-or-wider drop target.
 */
function circleHitRect(key: string, c0: Circle, c1: Circle): Rect {
  const cy = c0.cy;
  let lo = 0;
  let hi = Math.min(c0.r, c1.r);
  for (let i = 0; i < 40; i++) {
    const t = (lo + hi) / 2;
    const span = regionSpan(key, c0, c1, cy - t, cy + t);
    if (span && span[1] - span[0] >= 2 * t) lo = t;
    else hi = t;
  }
  const span = regionSpan(key, c0, c1, cy - lo, cy + lo) ?? [0, 0];
  return { x: span[0] + 1, y: cy - lo + 1, w: span[1] - span[0] - 2, h: 2 * lo - 2 };
}

function circleCapacity(key: string, geometry: DiagramGeometry, cell: TileCell): number {
  const [c0, c1] = geometry.circles;
  return Math.max(...circlePhases(key, c0, c1, cell).map(rowsCapacity));
}

const CIRCLE_KEYS = ['0', '0,1', '1'];

/**
 * The smallest geometry holding `counts[key]` tiles of `cell` in each region:
 * the diagram grows in `SCALE_STEP`s while a circle region is short of cells,
 * and the outside strip adds rows for the outside tiles. Tile cells keep their
 * size, so a grown diagram renders them smaller at the same CSS width.
 */
export function fitGeometry2Set(
  counts: Record<string, number>,
  cell: TileCell = TEXT_TILE_CELL
): DiagramGeometry {
  let geometry = geometry2Set();
  for (let step = 1; ; step++) {
    const current = geometry;
    if (CIRCLE_KEYS.every((key) => circleCapacity(key, current, cell) >= (counts[key] ?? 0))) {
      break;
    }
    geometry = geometry2Set(1 + step * SCALE_STEP);
  }
  const outside = counts[''] ?? 0;
  const perRow = cellsIn(geometry.width - 2 * REGION_MARGIN, cell);
  const rows = Math.ceil(outside / perRow);
  const needed = rows * (cell.h + TILE_GAP) - TILE_GAP + 2 * REGION_MARGIN;
  return needed > geometry.outsideStripHeight ? geometry2Set(geometry.scale, needed) : geometry;
}

/**
 * Build the 2-set layout for a concrete model (uses model circle labels to
 * compose accessible names, and `model.regionLabels` for overrides).
 */
export function buildLayout2Set(
  model: Pick<VennModel, 'circles' | 'regionLabels' | 'language'>,
  geometry: DiagramGeometry = defaultGeometry2Set(),
  cell: TileCell = TEXT_TILE_CELL
): DiagramLayout {
  if (model.circles?.length !== 2) {
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

  const regionByKey: Record<string, RegionLayout> = {};
  const out: RegionLayout[] = regions.map((region) => {
    const key = regionKey(region);
    const label = getRegionLabel(model as VennModel, region);
    let pointInRegion: RegionLayout['pointInRegion'];
    let hitRect: Rect;
    let capacity: number;
    let slots: RegionLayout['slots'];

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
      hitRect = {
        x: 0,
        y: outsideStripTop,
        w: geometry.width,
        h: geometry.height - outsideStripTop,
      };
      // Tiles land in rows in the bottom strip, which has width for several
      // per row and holds the 120×120 minimum.
      ({ capacity, slots } = stripSlots(geometry, outsideStripTop, cell));
    } else if (key === '0' || key === '1' || key === '0,1') {
      pointInRegion =
        key === '0'
          ? (x, y) => inC0(x, y) && !inC1(x, y)
          : key === '1'
            ? (x, y) => inC1(x, y) && !inC0(x, y)
            : (x, y) => inC0(x, y) && inC1(x, y);
      hitRect = circleHitRect(key, c0, c1);
      const phases = circlePhases(key, c0, c1, cell);
      capacity = Math.max(...phases.map(rowsCapacity));
      slots = circleSlots(phases, c0.cy, cell, rectCenter(hitRect));
    } else {
      // Defensive fallback (shouldn't happen for 2-set).
      pointInRegion = () => false;
      hitRect = { x: 0, y: 0, w: 0, h: 0 };
      capacity = 0;
      slots = () => [];
    }

    const layout: RegionLayout = {
      region,
      key,
      label,
      hitRect,
      pointInRegion,
      capacity,
      slots,
    };
    regionByKey[key] = layout;
    return layout;
  });

  return {
    geometry,
    cell,
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
    if (r?.pointInRegion(x, y)) return r;
  }
  return null;
}

/** Re-export for convenience so consumers can import everything from layout.ts. */
export { enumerateRegions, regionKey, getRegionLabel };
export type { VennCircle };
