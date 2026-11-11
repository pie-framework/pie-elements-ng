import { test, expect, type Locator, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';

/**
 * image-cloze-association's tab path follows the selection: with nothing selected it runs through
 * every choice, in the pool or in a response area, and with a choice selected through the response
 * areas and the pool, the places it can go.
 */

const CHOICE = '[aria-roledescription="draggable"][aria-disabled="false"]';
// The default demo's two response areas, by their authored names.
const STEEPER = 'Label for the steeper line';
const LESS_STEEP = 'Label for the less steep line';

async function placed(page: Page): Promise<number> {
  const session = await getSessionState(page);
  return (session?.answers ?? []).length;
}

/** The response area each placed choice sits in. */
async function areasHolding(page: Page): Promise<number[]> {
  const session = await getSessionState(page);
  return (session?.answers ?? []).map(
    (answer: { containerIndex: number }) => answer.containerIndex
  );
}

/** The keyboard sensor listens for keys from the task after a pick-up, so each key waits a moment. */
async function pressInTurn(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
}

/** Walks the tab path from its first stop inside `root`, checking that each stop matches `stop`. */
async function walkTabPath(page: Page, root: Locator, stop: Locator) {
  const stops = root.locator('[tabindex="0"]');
  const count = await stops.count();
  expect(count).toBeGreaterThan(1);

  await stops.first().focus();
  await expect(stop.and(root.locator(':focus'))).toHaveCount(1);
  for (let i = 1; i < count; i += 1) {
    await page.keyboard.press('Tab');
    await expect(stop.and(root.locator(':focus'))).toHaveCount(1);
  }
}

test.describe('image-cloze-association: the tab path', () => {
  test('runs through the choices until one is selected, then through the response areas and the pool', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'image-cloze-association');
    const root = deliveryContainer(page);
    const choices = root.locator(CHOICE);
    await expect(choices.first()).toBeVisible();
    const areas = root
      .getByRole('group', { name: STEEPER })
      .or(root.getByRole('group', { name: LESS_STEEP }));
    const pool = root.locator('[role="group"]:not([aria-label])');
    const tabStops = root.locator('[tabindex="0"]');

    // Placed by click, so one choice sits in a response area.
    await choices.first().click();
    await root.getByRole('button', { name: STEEPER }).click();
    await expect.poll(() => placed(page)).toBe(1);

    // Nothing selected: every choice, placed or in the pool, and no response area or pool.
    await expect(tabStops).toHaveCount(await choices.count());
    await expect(areas.and(tabStops)).toHaveCount(0);
    await expect(pool.and(tabStops)).toHaveCount(0);
    await walkTabPath(page, root, choices);

    // The placed choice selected by click: the two response areas and the pool, and no choice. A
    // click placement ignores clicks for the next 250ms, as a drop does.
    await page.waitForTimeout(300);
    await root.getByRole('group', { name: STEEPER }).locator(CHOICE).click();
    await expect(tabStops).toHaveCount(3);
    await expect(choices.and(tabStops)).toHaveCount(0);
    const targets = root
      .getByRole('group', { name: STEEPER })
      .or(root.getByRole('button', { name: LESS_STEEP }))
      .or(pool);
    await walkTabPath(page, root, targets);

    // Enter on the pool takes the selection back.
    await pool.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => placed(page)).toBe(0);
    await expect(tabStops).toHaveCount(await choices.count());
  });

  test('leaves a keyboard drag its Tab and its drop, in the pool and in a response area', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'image-cloze-association');
    const root = deliveryContainer(page);
    await expect(root.locator(CHOICE).first()).toBeVisible();

    // Picked up in the pool, carried to the first response area and dropped there.
    await root.locator(CHOICE).first().focus();
    await pressInTurn(page, ['Space', 'Tab', 'Space']);
    await expect.poll(() => areasHolding(page)).toEqual([0]);

    // Picked up in that area and carried on to the next one: the drop is not taken by the area it
    // leaves.
    await root.getByRole('group', { name: STEEPER }).locator(CHOICE).focus();
    await pressInTurn(page, ['Space', 'Tab', 'Space']);
    await expect.poll(() => areasHolding(page)).toEqual([1]);
  });
});
