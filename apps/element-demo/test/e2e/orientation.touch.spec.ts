import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  clickNumberLineTick,
  deliveryContainer,
  getSessionState,
  openDeliverRoute,
} from './test-helpers';
import { assertTouchEnabled, rotateTo, touchTap } from './touch-helpers';

/**
 * A learner turns the tablet or phone half way through an item. The viewport
 * swaps its width and height without a reload, so the response must still be
 * there, the controls must still be on screen where the layout puts them, and
 * a finger must still be able to answer afterwards.
 *
 * Each case starts from the viewport of the project it runs under (the
 * `touch` tablet is landscape, `touch-phone` portrait), rotates to the other
 * orientation, checks, rotates back, and checks again.
 */

type Case = {
  element: string;
  demoId?: string;
  /** A control that makes a response when tapped. */
  first: (root: Locator) => Locator;
  /** A second control, tapped after the rotation to show the item still answers. */
  second: (root: Locator) => Locator;
};

const visibleAt = (root: Locator, selector: string, index: number) =>
  root.locator(selector).filter({ visible: true }).nth(index);

const CASES: Case[] = [
  {
    element: 'multiple-choice',
    demoId: 'basic-checkbox',
    first: (root) => visibleAt(root, 'input[type="checkbox"]', 0),
    second: (root) => visibleAt(root, 'input[type="checkbox"]', 1),
  },
  {
    element: 'mc-populated-blank',
    demoId: 'variant-sr-vic',
    first: (root) => visibleAt(root, 'input[type="radio"]', 0),
    second: (root) => visibleAt(root, 'input[type="radio"]', 1),
  },
  {
    element: 'fraction-model',
    first: (root) => visibleAt(root, '.recharts-bar-rectangle rect', 0),
    second: (root) => visibleAt(root, '.recharts-bar-rectangle rect', 1),
  },
];

const signature = async (page: Page) => JSON.stringify((await getSessionState(page)) ?? {});

/** Where a control sits across the width of the delivery view, 0 to 1. */
async function horizontalPosition(control: Locator, root: Locator): Promise<number> {
  const [box, frame] = await Promise.all([control.boundingBox(), root.boundingBox()]);
  if (!box || !frame) {
    throw new Error('Cannot place a control that has no bounding box');
  }
  return (box.x + box.width / 2 - frame.x) / frame.width;
}

/** The page must not have grown a sideways scroll the portrait layout did not have. */
const overflowsSideways = (page: Page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );

async function expectStillThere(page: Page, root: Locator, control: Locator, response: string) {
  await expect(control).toBeVisible();
  expect(await signature(page), 'the response changed with the rotation').toBe(response);
  const box = await control.boundingBox();
  if (!box) {
    throw new Error('Cannot place the control after the rotation');
  }
  const width = await page.evaluate(() => window.innerWidth);
  expect(box.x, 'the control starts left of the viewport').toBeGreaterThanOrEqual(-1);
  expect(box.x + box.width, 'the control runs past the right of the viewport').toBeLessThanOrEqual(
    width + 1
  );
  await expect(root).toBeVisible();
}

test.describe('rotating the device mid-session', () => {
  for (const item of CASES) {
    const title = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;

    test(`${title}: the response and the controls survive a rotation`, async ({ page }) => {
      await openDeliverRoute(page, item.element, item.demoId);
      await assertTouchEnabled(page);
      const root = deliveryContainer(page);
      const first = item.first(root);
      await first.waitFor({ state: 'visible', timeout: 15_000 });

      const empty = await signature(page);
      await touchTap(page, first);
      await expect.poll(() => signature(page)).not.toBe(empty);
      let response = await signature(page);
      const startedLandscape = await page.evaluate(() => innerWidth > innerHeight);
      const before = await horizontalPosition(first, root);
      const overflowedBefore = await overflowsSideways(page);

      await rotateTo(page, startedLandscape ? 'portrait' : 'landscape');
      await expectStillThere(page, root, first, response);
      expect(
        (await overflowsSideways(page)) && !overflowedBefore,
        'a sideways scroll appeared'
      ).toBe(false);

      // The item still answers: a finger on a second control adds to the response.
      const second = item.second(root);
      await second.scrollIntoViewIfNeeded();
      await touchTap(page, second);
      await expect.poll(() => signature(page)).not.toBe(response);
      response = await signature(page);

      await rotateTo(page, startedLandscape ? 'landscape' : 'portrait');
      await expectStillThere(page, root, first, response);
      // Back where it started: the layout returns to the same place.
      expect(Math.abs((await horizontalPosition(first, root)) - before)).toBeLessThan(0.02);
    });
  }

  test('number-line: a placed point keeps its place on the line', async ({ page }) => {
    await openDeliverRoute(page, 'number-line');
    await assertTouchEnabled(page);
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();
    const empty = await signature(page);
    await clickNumberLineTick(page, root);
    await expect.poll(() => signature(page)).not.toBe(empty);
    const response = await signature(page);

    const svg = root.locator('svg').filter({ visible: true }).last();
    const point = svg.locator('circle').filter({ visible: true }).first();
    await expect(point).toBeVisible();
    const placed = await horizontalPosition(point, svg);
    const startedLandscape = await page.evaluate(() => innerWidth > innerHeight);

    await rotateTo(page, startedLandscape ? 'portrait' : 'landscape');

    await expect(point).toBeVisible();
    expect(await signature(page), 'the response changed with the rotation').toBe(response);
    // The line is redrawn at the new width; the point stays at the same value along it.
    expect(Math.abs((await horizontalPosition(point, svg)) - placed)).toBeLessThan(0.02);
  });
});
