import { expect, type Locator, type Page } from '@playwright/test';
import { touchTap } from './touch-helpers';

/**
 * Locating and seeding the graph-style elements (charting, graphing,
 * graphing-solution-set, number-line) for the touch specs.
 */

/** A point inside the graph, as a fraction of its box. */
export type GraphPoint = { fx: number; fy: number };

export const CENTER: GraphPoint[] = [{ fx: 0.5, fy: 0.5 }];
/** Two distinct points, so a line tool produces a line rather than nothing. */
export const TWO_POINTS: GraphPoint[] = [
  { fx: 0.35, fy: 0.4 },
  { fx: 0.65, fy: 0.6 },
];

/**
 * The graph itself, not the icon sprites these elements also render - the first
 * `svg` in the container is a hidden 34x35 icon, so pick the largest visible one
 * rather than relying on document order.
 */
export async function graphSvg(root: Locator): Promise<Locator> {
  const svgs = root.locator('svg');
  await expect.poll(() => svgs.count(), { timeout: 15_000 }).toBeGreaterThan(0);

  let best: Locator | null = null;
  let bestArea = 0;
  const count = await svgs.count();
  for (let index = 0; index < count; index++) {
    const candidate = svgs.nth(index);
    if (!(await candidate.isVisible().catch(() => false))) {
      continue;
    }
    const box = await candidate.boundingBox().catch(() => null);
    if (!box) {
      continue;
    }
    const area = box.width * box.height;
    if (area > bestArea) {
      bestArea = area;
      best = candidate;
    }
  }

  if (!best) {
    throw new Error('No visible graph SVG in the delivery container');
  }
  return best;
}

/** Select the first drawing tool, for the graphing-family toolbars. */
export async function selectFirstTool(root: Locator) {
  const toolbarButton = root
    .locator(
      'button.MuiButtonBase-root, button[aria-label*="tool" i], button[aria-label*="line" i]'
    )
    .first();
  if (await toolbarButton.isVisible().catch(() => false)) {
    await toolbarButton.click({ force: true });
  }
}

/** Tap the given fractional positions inside the graph. */
export async function tapGraph(page: Page, root: Locator, points: GraphPoint[]) {
  const svg = await graphSvg(root);
  const box = await svg.boundingBox();
  if (!box) {
    throw new Error('Graph SVG has no bounding box');
  }
  for (const { fx, fy } of points) {
    await touchTap(page, { x: box.x + box.width * fx, y: box.y + box.height * fy });
    await page.waitForTimeout(250);
  }
}

/**
 * The draggable handles are SVG shapes - charting renders a transparent
 * `ellipse` over each bar, the graphing family and number-line render `circle`
 * points. Take the first visibly-sized one rather than encoding per-element DOM
 * that would rot.
 */
export async function firstDragHandle(root: Locator): Promise<Locator | null> {
  const svg = await graphSvg(root);

  for (const selector of ['ellipse', 'circle', 'rect[cursor]', '[class*="handle"]']) {
    const candidates = svg.locator(selector);
    const count = await candidates.count();
    for (let index = 0; index < Math.min(count, 8); index++) {
      const candidate = candidates.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }
      const box = await candidate.boundingBox().catch(() => null);
      // A zero-size shape is decoration, not a handle.
      if (box && box.width > 0 && box.height > 0) {
        return candidate;
      }
    }
  }
  return null;
}
