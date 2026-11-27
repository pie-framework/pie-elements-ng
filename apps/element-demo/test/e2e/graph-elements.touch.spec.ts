import { expect, test, type Locator, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';
import {
  CENTER,
  firstDragHandle,
  type GraphPoint,
  selectFirstTool,
  TWO_POINTS,
  tapGraph,
} from './graph-helpers';
import { assertTouchEnabled, centerOf, touchDragBy, touchDragCancelled } from './touch-helpers';

/**
 * Can a finger actually operate the graph-style elements?
 *
 * `phase1-spatial-dnd.spec.ts` already taps and drags all of these, but only
 * with `page.mouse`. Touch input goes through different listeners, so mouse
 * coverage says nothing about touch - charting was green in that suite the whole
 * time it was unusable on iPads (PIE-1074).
 *
 * These specs run under the `touch` and `touch-phone` projects (see playwright.config.ts) and
 * assert the two things a learner does with a finger: place a mark, and drag one.
 * They are deliberately shallow per element - most of the plumbing they guard is
 * shared through `@pie-lib/plot`'s `gridDraggable`, so breadth across elements is
 * worth more here than depth in any one of them.
 */

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

const DEFAULT_DRAG = { y: -120 };

const CASES: TouchCase[] = [
  // Charting renders its bars up front, so a handle is draggable immediately. It
  // has no place-a-mark test because a tap places nothing: a bar's value only
  // changes by drag or keyboard, so the drag test is its mark-setting coverage.
  { element: 'charting' },
  { element: 'graphing', selectTool: true, seedTaps: CENTER },
  // The default tool is a solid line: one tap starts it, the second commits it.
  {
    element: 'graphing-solution-set',
    selectTool: true,
    seedTaps: TWO_POINTS,
  },
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

    test(`${title}: a finger can drag a handle`, async ({ page }) => {
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

  // A ray draws its line from the drag position while a drag is live. When the system cancels the
  // touch (an edge swipe, a palm), the point goes back, and the line must go back with it.
  test('number-line [demo=inequality-rays]: a drag the system cancels leaves the ray as it was', async ({
    page,
  }) => {
    const root = await openForTouch(page, { element: 'number-line', demoId: 'inequality-rays' });
    await tapGraph(page, root, CENTER);
    await expect.poll(() => firstDragHandle(root), { timeout: 10_000 }).not.toBeNull();
    const handle = (await firstDragHandle(root)) as Locator;

    /** How far each ray's line ends from the point that should end it, in px. */
    const rayGaps = () =>
      handle.evaluate((circle) =>
        [...(circle.ownerSVGElement?.querySelectorAll('line.line-handle') ?? [])].map((line) => {
          const point = line.parentElement?.querySelector(
            ':scope > g[aria-roledescription] > circle'
          );
          // A point follows a drag through its group's translate.
          const group = point?.parentElement as unknown as SVGGraphicsElement;
          const shift = group.transform.baseVal.consolidate()?.matrix.e ?? 0;
          const x = Number(point?.getAttribute('cx')) + shift;
          return Math.min(
            Math.abs(Number(line.getAttribute('x1')) - x),
            Math.abs(Number(line.getAttribute('x2')) - x)
          );
        })
      );
    expect(await rayGaps()).toEqual([0]);

    const before = await sessionSignature(page);
    const from = await centerOf(handle);
    await touchDragCancelled(page, from, { x: from.x + 160, y: from.y });

    await page.waitForTimeout(300);
    expect(await sessionSignature(page)).toBe(before);
    expect(await rayGaps()).toEqual([0]);
  });
});
