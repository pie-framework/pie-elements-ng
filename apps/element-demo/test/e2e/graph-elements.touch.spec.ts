import { expect, test, type Locator, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';
import { assertTouchEnabled, touchDragBy, touchTap } from './touch-helpers';

/**
 * Can a finger actually operate the graph-style elements?
 *
 * `phase1-spatial-dnd.spec.ts` already taps and drags all of these, but only
 * with `page.mouse`. Touch input goes through different listeners, so mouse
 * coverage says nothing about touch - charting was green in that suite the whole
 * time it was unusable on iPads (PIE-1074).
 *
 * These specs run under the `touch` project only (see playwright.config.ts) and
 * assert the two things a learner does with a finger: place a mark, and drag one.
 * They are deliberately shallow per element - most of the plumbing they guard is
 * shared through `@pie-lib/plot`'s `gridDraggable`, so breadth across elements is
 * worth more here than depth in any one of them.
 */

/** A point inside the graph, as a fraction of its box. */
type GraphPoint = { fx: number; fy: number };

type TouchCase = {
  element: string;
  demoId?: string;
  /**
   * Taps that create something draggable, for graphs that start empty. A single
   * centre tap places a point; a line tool needs two taps at distinct spots
   * before it commits anything to the session.
   */
  seedTaps?: GraphPoint[];
  /** Graphing-family toolbars need a tool selected before a tap places anything. */
  selectTool?: boolean;
  /**
   * Finger travel, in CSS pixels, large enough to clear grid snapping. The axis
   * matters: charting bars and graphing points move vertically, but a number
   * line only has an x axis, so a vertical drag there is a no-op.
   */
  drag?: { x?: number; y?: number };
};

const CENTER: GraphPoint[] = [{ fx: 0.5, fy: 0.5 }];
/** Two distinct points, so a line tool produces a line rather than nothing. */
const TWO_POINTS: GraphPoint[] = [
  { fx: 0.35, fy: 0.4 },
  { fx: 0.65, fy: 0.6 },
];
const DEFAULT_DRAG = { y: -120 };

const CASES: TouchCase[] = [
  // Charting renders its bars up front, so a handle is draggable immediately.
  { element: 'charting' },
  { element: 'graphing', selectTool: true, seedTaps: CENTER },
  // The default tool is a solid line: one tap starts it, the second commits it.
  { element: 'graphing-solution-set', selectTool: true, seedTaps: TWO_POINTS },
  { element: 'number-line', seedTaps: CENTER, drag: { x: 120 } },
];

function sessionSignature(page: Page): Promise<string> {
  return getSessionState(page).then((session) => JSON.stringify(session ?? {}));
}

async function expectSessionToChange(page: Page, before: string, action: () => Promise<void>) {
  await action();
  // Elements commit their session asynchronously.
  await expect.poll(() => sessionSignature(page), { timeout: 10_000 }).not.toBe(before);
}

/**
 * The graph itself, not the icon sprites these elements also render - the first
 * `svg` in the container is a hidden 34x35 icon, so pick the largest visible one
 * rather than relying on document order.
 */
async function graphSvg(root: Locator): Promise<Locator> {
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
async function selectFirstTool(root: Locator) {
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
async function tapGraph(page: Page, root: Locator, points: GraphPoint[]) {
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
async function firstDragHandle(root: Locator): Promise<Locator | null> {
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

async function openForTouch(page: Page, item: TouchCase): Promise<Locator> {
  await assertTouchEnabled(page);
  await openDeliverRoute(page, item.element, item.demoId);
  const root = deliveryContainer(page);
  await expect(root).toBeVisible();
  if (item.selectTool) {
    await selectFirstTool(root);
  }
  return root;
}

test.describe('graph elements under touch', () => {
  for (const item of CASES) {
    const title = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;
    const seedTaps = item.seedTaps;

    if (seedTaps) {
      test(`${title}: a finger can place a mark`, async ({ page }) => {
        const root = await openForTouch(page, item);

        const before = await sessionSignature(page);
        await expectSessionToChange(page, before, () => tapGraph(page, root, seedTaps));
      });
    }

    const dragTest = item.element === 'number-line' ? test.fixme : test;

    // number-line is a confirmed touch defect, not a flaky test: its dnd-kit
    // handles leave `touch-action` at `auto`, so Chromium claims the gesture as
    // a pan and fires `pointercancel` after the first `pointermove`. dnd-kit's
    // PointerSensor aborts there and the point never moves. The same drag with
    // `page.mouse` moves it, so this is touch-only. Un-fixme this once the
    // handles set `touch-action: none`, as @dnd-kit requires.
    dragTest(`${title}: a finger can drag a handle`, async ({ page }) => {
      const root = await openForTouch(page, item);

      if (seedTaps) {
        // Seeded with taps so there is something to drag; the drag itself is
        // what this test asserts on.
        await tapGraph(page, root, seedTaps);
        await expect.poll(() => firstDragHandle(root), { timeout: 10_000 }).not.toBeNull();
      }

      const handle = await firstDragHandle(root);
      expect(handle, 'no visible drag handle found in the graph SVG').not.toBeNull();

      const before = await sessionSignature(page);
      await expectSessionToChange(page, before, () =>
        touchDragBy(page, handle as Locator, item.drag ?? DEFAULT_DRAG)
      );
    });
  }
});
