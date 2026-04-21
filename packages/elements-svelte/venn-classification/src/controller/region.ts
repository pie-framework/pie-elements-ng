/**
 * Region helpers for the venn-classification controller.
 *
 * A region is a sorted-ascending array of circle indexes. These helpers deal
 * with keying, labelling, and equality in a layout-agnostic way so that both
 * the controller (for scoring / validation) and delivery (for rendering)
 * can share them.
 */

import type { Region, VennCircle, VennModel } from '../types.js';

/**
 * Returns the canonical region key: sorted-ascending indexes joined by commas.
 * Outside / "neither" region is the empty string.
 */
export function regionKey(region: Region | null | undefined): string {
  if (!region || region.length === 0) return '';
  return [...region].sort((a, b) => a - b).join(',');
}

/** Return a fresh sorted-ascending copy of a region. */
export function normalizeRegion(region: Region | null | undefined): Region {
  if (!region || region.length === 0) return [];
  return [...region].sort((a, b) => a - b);
}

export function regionsEqual(a: Region | null | undefined, b: Region | null | undefined): boolean {
  if (!a || !b) return !a === !b && (a?.length ?? 0) === (b?.length ?? 0);
  if (a.length !== b.length) return false;
  const sa = normalizeRegion(a);
  const sb = normalizeRegion(b);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

/**
 * Enumerate every valid region for a given number of circles.
 * Returns an array of `Region` covering the powerset of `[0..n)`, starting
 * with the outside region (`[]`). Order:
 *   2-set: [], [0], [1], [0,1]         (4 regions)
 *   3-set: [], [0], [1], [2], [0,1], [0,2], [1,2], [0,1,2]   (8 regions)
 */
export function enumerateRegions(circleCount: number): Region[] {
  const regions: Region[] = [];
  const total = 1 << circleCount;
  for (let mask = 0; mask < total; mask++) {
    const r: Region = [];
    for (let i = 0; i < circleCount; i++) {
      if (mask & (1 << i)) r.push(i);
    }
    regions.push(r);
  }
  return regions;
}

/**
 * Auto-compose the accessible/visible label for a region from the circle labels.
 *
 * 2-set:
 *   []     -> "Neither X nor Y"
 *   [i]    -> "<label(i)> only"
 *   [0,1]  -> "<X> and <Y>"
 *
 * 3-set (data shape supported; delivery layout ships in v2):
 *   []         -> "None of X, Y, Z"
 *   [i]        -> "<label(i)> only"
 *   [0,1]      -> "<X> and <Y>"
 *   [0,1,2]    -> "<X> and <Y> and <Z>"
 */
export function composeRegionLabel(circles: VennCircle[], region: Region): string {
  const norm = normalizeRegion(region);
  const labels = norm.map((i) => circles[i]?.label ?? `Set ${i + 1}`);
  const circleCount = circles.length;

  if (norm.length === 0) {
    if (circleCount === 2) {
      const a = circles[0]?.label ?? 'Set 1';
      const b = circles[1]?.label ?? 'Set 2';
      return `Neither ${a} nor ${b}`;
    }
    const all = circles.map((c, i) => c?.label ?? `Set ${i + 1}`).join(', ');
    return `None of ${all}`;
  }

  if (norm.length === 1) {
    return `${labels[0]} only`;
  }

  return labels.join(' and ');
}

/**
 * Resolve the label for a region, preferring an author-supplied override from
 * `model.regionLabels` keyed by region-key, falling back to the auto-composed
 * label.
 */
export function getRegionLabel(
  model: Pick<VennModel, 'circles' | 'regionLabels'>,
  region: Region
): string {
  const key = regionKey(region);
  const override = model.regionLabels?.[key];
  if (typeof override === 'string' && override.trim().length > 0) {
    return override;
  }
  return composeRegionLabel(model.circles ?? [], region);
}
