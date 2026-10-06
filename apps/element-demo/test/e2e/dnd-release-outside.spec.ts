import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  deliveryContainer,
  getModelFromSource,
  getSessionState,
  mountedElement,
  openDeliverRoute,
  switchTab,
  updateModelInSource,
  waitForMathRendering,
} from './test-helpers';

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };
type Input = 'mouse' | 'touch';

const INPUTS: Input[] = ['mouse', 'touch'];
const DRAGGABLE = '[aria-roledescription="draggable"]';

async function boxOf(locator: Locator): Promise<Box> {
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('No bounding box');
  }
  return box;
}

const centreOf = (box: Box): Point => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/**
 * Presses at `from`, moves past the pointer sensor's 8px activation distance, travels to `to` and
 * releases there. Touch goes through CDP touch events, which Chromium turns into the touch pointer
 * events the sensor listens to.
 */
async function drag(page: Page, input: Input, from: Point, to: Point) {
  const start = { x: from.x + 12, y: from.y + 12 };
  const steps = 20;
  const path = [start];
  for (let i = 1; i <= steps; i += 1) {
    path.push({
      x: start.x + ((to.x - start.x) * i) / steps,
      y: start.y + ((to.y - start.y) * i) / steps,
    });
  }

  if (input === 'mouse') {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (const point of path) {
      await page.mouse.move(point.x, point.y);
    }
    // Collisions are found as the move renders; release once the last one has.
    await page.waitForTimeout(150);
    await page.mouse.up();
  } else {
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: string, point?: Point) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: point ? [{ x: Math.round(point.x), y: Math.round(point.y) }] : [],
      });
    await touch('touchStart', from);
    for (const point of path) {
      await touch('touchMove', point);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(150);
    await touch('touchEnd');
    await cdp.detach();
  }
  // dnd-kit swallows document clicks for 50ms after a drop.
  await page.waitForTimeout(100);
}

/** The keyboard sensor listens for keys from the task after a pick-up, so each key waits a moment. */
async function pressInTurn(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
}

/** The choice ids the categorize session places in each category, leaving out empty categories. */
async function placements(page: Page): Promise<Record<string, string[]>> {
  const session = await getSessionState(page);
  const placed: Record<string, string[]> = {};
  for (const answer of session?.answers ?? []) {
    if (answer.choices?.length) {
      placed[answer.category] = answer.choices;
    }
  }
  return placed;
}

test.describe('categorize: releasing a choice outside the element', () => {
  // math-equations has the pool above the categories True (id 0) and False (id 1);
  // geometry-shapes has it below 2D Shapes (id 0) and 3D Shapes (id 1).
  async function open(page: Page, demoId?: string) {
    await openDeliverRoute(page, 'categorize', demoId);
    const root = deliveryContainer(page);
    await expect(root.locator(DRAGGABLE).first()).toBeVisible();
    await waitForMathRendering(page);
    return root;
  }

  const category = (root: Locator, name: string | RegExp) =>
    root.getByRole('group', { name, exact: true });
  const choiceIn = (group: Locator) => group.locator(DRAGGABLE).first();

  /** Drags the pool's first choice into `target` with the mouse and returns its id. */
  async function placeFirstChoice(page: Page, pool: Locator, target: Locator): Promise<string> {
    const before = await placements(page);
    await drag(page, 'mouse', centreOf(await boxOf(choiceIn(pool))), centreOf(await boxOf(target)));
    await expect
      .poll(async () => JSON.stringify(await placements(page)))
      .not.toBe(JSON.stringify(before));
    const placed = Object.values(await placements(page)).flat();
    expect(placed).toHaveLength(1);
    return placed[0];
  }

  for (const input of INPUTS) {
    test.describe(input, () => {
      test.use({ hasTouch: input === 'touch' });

      test('a placed choice released above the element goes back to the pool', async ({ page }) => {
        const root = await open(page, 'geometry-shapes');
        const twoD = category(root, /^2D Shapes/);
        const id = await placeFirstChoice(page, category(root, 'Shape Formulas'), twoD);
        expect(await placements(page)).toEqual({ 0: [id] });

        const element = await boxOf(mountedElement(page));
        const over = centreOf(await boxOf(twoD));
        await drag(page, input, centreOf(await boxOf(choiceIn(twoD))), {
          x: over.x,
          y: element.y - 30,
        });
        await expect.poll(() => placements(page)).toEqual({});
      });

      test('a placed choice released below the element goes back to the pool', async ({ page }) => {
        const root = await open(page);
        const trueCategory = category(root, 'True');
        await placeFirstChoice(page, category(root, 'Equations'), trueCategory);
        expect(await placements(page)).toEqual({ 0: ['0'] });

        const element = await boxOf(mountedElement(page));
        const over = centreOf(await boxOf(trueCategory));
        await drag(page, input, centreOf(await boxOf(choiceIn(trueCategory))), {
          x: over.x,
          y: element.y + element.height + 80,
        });
        await expect.poll(() => placements(page)).toEqual({});
      });

      test('a placed choice released beside the element goes back to the pool', async ({
        page,
      }) => {
        const root = await open(page);
        // Narrows the element, an inline custom element by default, so the page has room beside it.
        await mountedElement(page).evaluate((node) => {
          Object.assign((node as HTMLElement).style, { display: 'block', maxWidth: '900px' });
        });
        const element = await boxOf(mountedElement(page));
        expect(element.x + element.width).toBeLessThan(1000);

        const trueCategory = category(root, 'True');
        await placeFirstChoice(page, category(root, 'Equations'), trueCategory);
        expect(await placements(page)).toEqual({ 0: ['0'] });

        const falseRow = centreOf(await boxOf(category(root, 'False')));
        await drag(page, input, centreOf(await boxOf(choiceIn(trueCategory))), {
          x: element.x + element.width + 300,
          y: falseRow.y,
        });
        await expect.poll(() => placements(page)).toEqual({});
      });

      test('a choice released just outside a category, overlapping it, lands there', async ({
        page,
      }) => {
        const root = await open(page);
        const trueCategory = category(root, 'True');
        const trueBox = await boxOf(trueCategory);
        const besideTrue = { x: trueBox.x - 4, y: trueBox.y + trueBox.height / 2 };

        await drag(
          page,
          input,
          centreOf(await boxOf(choiceIn(category(root, 'Equations')))),
          besideTrue
        );
        await expect.poll(() => placements(page)).toEqual({ 0: ['0'] });

        // The placed choice, released there again, stays.
        await drag(page, input, centreOf(await boxOf(choiceIn(trueCategory))), besideTrue);
        await expect.poll(() => placements(page)).toEqual({ 0: ['0'] });
      });
    });
  }

  test('keyboard: Space, Tab, Space moves a placed choice to the next category; Space, Space leaves it', async ({
    page,
  }) => {
    const root = await open(page);
    await placeFirstChoice(page, category(root, 'Equations'), category(root, 'True'));
    expect(await placements(page)).toEqual({ 0: ['0'] });

    await choiceIn(category(root, 'True')).focus();
    await pressInTurn(page, ['Space', 'Tab', 'Space']);
    await expect.poll(() => placements(page)).toEqual({ 1: ['0'] });

    await choiceIn(category(root, 'False')).focus();
    await pressInTurn(page, ['Space', 'Space']);
    expect(await placements(page)).toEqual({ 1: ['0'] });
  });
});

test.describe('placement-ordering: releasing a tile outside the element', () => {
  // The demo with a placement area and no column labels, so the tiles' grid starts at the first
  // slot: Blueberry (c1), Lemon (c2), Melon (c3) and Pear (c4) in the pool, beside four slots.
  async function open(page: Page) {
    await page.goto('/placement-ordering/source?demo=default');
    await page.locator('[data-testid="source-editor"]').waitFor({ timeout: 60_000 });
    const model = await getModelFromSource(page);
    await updateModelInSource(page, {
      ...model,
      placementArea: true,
      choiceLabel: '',
      targetLabel: '',
    });
    await switchTab(page, 'deliver');
    const root = deliveryContainer(page);
    await expect(root.locator(DRAGGABLE).first()).toBeVisible();
    return root;
  }

  /** A pool tile by choice id, `choice-c1`, or a slot by index, `target-0`. */
  const tile = (root: Locator, name: string) => root.locator(`[data-tile-id$=":${name}"]`);

  /** The choice id in each slot, null for an empty one. */
  async function slots(page: Page): Promise<(string | null)[]> {
    const value = (await getSessionState(page))?.value ?? [];
    return [0, 1, 2, 3].map((index) => value[index] ?? null);
  }

  /** Drags a pool tile into a slot with the mouse. */
  async function place(page: Page, root: Locator, choice: string, slot: number) {
    await drag(
      page,
      'mouse',
      centreOf(await boxOf(tile(root, `choice-${choice}`))),
      centreOf(await boxOf(tile(root, `target-${slot}`)))
    );
    await expect.poll(async () => (await slots(page))[slot]).toBe(choice);
  }

  const EMPTY = [null, null, null, null];

  for (const input of INPUTS) {
    test.describe(input, () => {
      test.use({ hasTouch: input === 'touch' });

      test('a first-slot tile released above the element goes back to the pool', async ({
        page,
      }) => {
        const root = await open(page);
        await place(page, root, 'c1', 0);

        const element = await boxOf(mountedElement(page));
        const first = centreOf(await boxOf(tile(root, 'target-0')));
        await drag(page, input, first, { x: first.x, y: element.y - 30 });
        await expect.poll(() => slots(page)).toEqual(EMPTY);
      });

      test('a last-slot tile released below the element goes back to the pool', async ({
        page,
      }) => {
        const root = await open(page);
        await place(page, root, 'c4', 3);

        const element = await boxOf(mountedElement(page));
        const last = centreOf(await boxOf(tile(root, 'target-3')));
        await drag(page, input, last, { x: last.x, y: element.y + element.height + 80 });
        await expect.poll(() => slots(page)).toEqual(EMPTY);
      });

      test('a placed tile released beside the element goes back to the pool', async ({ page }) => {
        const root = await open(page);
        // Narrows the element, an inline custom element by default, so the page has room beside it.
        await mountedElement(page).evaluate((node) => {
          Object.assign((node as HTMLElement).style, { display: 'block', maxWidth: '900px' });
        });
        const element = await boxOf(mountedElement(page));
        expect(element.x + element.width).toBeLessThan(1000);
        await place(page, root, 'c1', 0);

        const first = centreOf(await boxOf(tile(root, 'target-0')));
        await drag(page, input, first, { x: element.x + element.width + 300, y: first.y });
        await expect.poll(() => slots(page)).toEqual(EMPTY);
      });

      test('a tile released just outside a slot, overlapping it, lands there', async ({ page }) => {
        const root = await open(page);
        const first = await boxOf(tile(root, 'target-0'));

        await drag(page, input, centreOf(await boxOf(tile(root, 'choice-c1'))), {
          x: first.x + first.width + 4,
          y: first.y + first.height / 2,
        });
        await expect.poll(() => slots(page)).toEqual(['c1', null, null, null]);
      });
    });
  }

  test('keyboard: Space, Tab, Space moves a placed tile to the next slot; Space, Space leaves it', async ({
    page,
  }) => {
    const root = await open(page);
    await place(page, root, 'c1', 0);

    await tile(root, 'target-0').focus();
    await pressInTurn(page, ['Space', 'Tab', 'Space']);
    await expect.poll(() => slots(page)).toEqual([null, 'c1', null, null]);

    await tile(root, 'target-1').focus();
    await pressInTurn(page, ['Space', 'Space']);
    expect(await slots(page)).toEqual([null, 'c1', null, null]);
  });
});
