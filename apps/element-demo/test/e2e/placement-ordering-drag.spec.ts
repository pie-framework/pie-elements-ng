import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  deliveryContainer,
  getModelFromSource,
  openDeliverRoute,
  switchTab,
  updateModelInSource,
} from './test-helpers';

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

const PREVIEW = '.placement-ordering-drag-preview';

async function boxOf(locator: Locator): Promise<Box> {
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('No bounding box');
  }
  return box;
}

const centreOf = (box: Box): Point => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/** Presses on `from`, travels to `to` in steps and leaves the pointer there, down, unless `release`. */
async function dragTo(page: Page, from: Point, to: Point, { release = true } = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  const steps = 14;
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(
      from.x + ((to.x - from.x) * i) / steps,
      from.y + ((to.y - from.y) * i) / steps
    );
  }
  // Collisions are found as the move renders; settle before reading or releasing.
  await page.waitForTimeout(150);
  if (release) {
    await page.mouse.up();
    await page.waitForTimeout(150);
  }
}

test.describe('placement-ordering: dragging a choice', () => {
  let root: Locator;

  const tile = (slot: string) => root.locator(`[data-tile-id$=":${slot}"]`);
  const isOver = async (slot: string) => (await tile(slot).locator('.over').count()) > 0;

  /** Whether a slot shows the hover effect: `over` on an empty slot, a dashed border on a filled one. */
  const isLit = (slot: string) =>
    tile(slot).evaluate((node) => {
      const content = node.firstElementChild;
      return (
        node.querySelector('.over') !== null ||
        (content !== null &&
          !node.querySelector('.placeholder') &&
          getComputedStyle(content).borderStyle.includes('dashed'))
      );
    });

  /** The element's scroll region: its horizontal scroller, which contains the tiles. */
  const scrollRegion = (page: Page) =>
    page.evaluate(() => {
      const region = [...document.querySelectorAll('div')].find((el) => {
        const style = getComputedStyle(el);
        return (
          style.overflowX === 'auto' &&
          style.overflowY === 'hidden' &&
          el.querySelector('[data-tile-id]')
        );
      });
      if (!region) {
        throw new Error('No scroll region');
      }
      const box = region.getBoundingClientRect();
      return {
        scrollTop: region.scrollTop,
        scrollHeight: region.scrollHeight,
        clientHeight: region.clientHeight,
        bottom: box.bottom,
      };
    });

  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, 'placement-ordering');
    // The default demo has no placement area; its response areas are what the drops below need.
    await switchTab(page, 'source');
    const model = await getModelFromSource(page);
    await updateModelInSource(page, { ...model, placementArea: true });
    await switchTab(page, 'deliver');
    root = deliveryContainer(page);
    await expect(tile('target-0')).toBeVisible();

    // The model change keeps the session, which the default demo starts with every choice placed in
    // order. Return the first two to the source column, leaving choices to drag from and empty
    // response areas to drop on.
    for (const index of [0, 1]) {
      await dragTo(
        page,
        centreOf(await boxOf(tile(`target-${index}`))),
        centreOf(await boxOf(tile(`choice-c${index + 1}`)))
      );
    }
    await expect(tile('choice-c1')).toContainText('Blueberry');
    await expect(tile('choice-c2')).toContainText('Lemon');
  });

  test('follows the pointer past the grid and the element, without scrolling the element', async ({
    page,
  }) => {
    const choice = tile('choice-c1');
    const start = await boxOf(choice);
    const before = await scrollRegion(page);

    // Well right of the grid and below the element's bottom edge, while still inside the viewport.
    const to = { x: start.x + 600, y: before.bottom + 120 };
    await dragTo(page, centreOf(start), to, { release: false });

    const preview = await boxOf(page.locator(PREVIEW));
    expect(preview.x).toBeGreaterThan(start.x + 400);
    expect(preview.y).toBeGreaterThan(before.bottom);

    // The preview is drawn outside the tile, and lays its label out as the tile does: centred.
    const gaps = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      const text = element && document.createTreeWalker(element, NodeFilter.SHOW_TEXT).nextNode();
      if (!element || !text) {
        throw new Error('No label in the preview');
      }
      const range = document.createRange();
      range.selectNodeContents(text);
      const label = range.getBoundingClientRect();
      const outer = element.getBoundingClientRect();
      return { left: label.left - outer.left, right: outer.right - label.right };
    }, PREVIEW);
    expect(Math.abs(gaps.left - gaps.right)).toBeLessThan(3);

    const during = await scrollRegion(page);
    expect(during.scrollTop).toBe(0);
    expect(during.scrollHeight).toBe(during.clientHeight);

    await page.mouse.up();
    // Dropped where nothing takes it, a choice that was never placed stays in the source column.
    await expect(choice).toContainText(/\S/);
    await expect(page.locator(PREVIEW)).toHaveCount(0);
  });

  test('is received by a response area it overlaps by a few pixels', async ({ page }) => {
    const choice = await boxOf(tile('choice-c1'));
    const target = await boxOf(tile('target-1'));

    // The tile's right edge 8px into the response area, a row down: it still overlaps the source slots
    // of the choices beside it far more.
    await dragTo(
      page,
      centreOf(choice),
      { x: target.x + 8 - choice.width / 2, y: target.y + target.height / 2 },
      { release: false }
    );

    await expect.poll(() => isOver('target-1')).toBe(true);
    await page.mouse.up();

    await expect(tile('target-1')).toContainText('Blueberry');
  });

  test('highlights the source slot a placed choice belongs to, and returns it there', async ({
    page,
  }) => {
    await dragTo(
      page,
      centreOf(await boxOf(tile('choice-c1'))),
      centreOf(await boxOf(tile('target-0')))
    );
    await expect(tile('target-0')).toContainText('Blueberry');

    const own = await boxOf(tile('choice-c1'));
    await dragTo(page, centreOf(await boxOf(tile('target-0'))), centreOf(own), { release: false });

    await expect.poll(() => isOver('choice-c1')).toBe(true);
    // Another choice's source slot, whether it still holds its choice or not, takes no part.
    expect(await isOver('choice-c2')).toBe(false);

    await page.mouse.up();

    await expect(tile('choice-c1')).toContainText('Blueberry');
    await expect(tile('target-0')).not.toContainText('Blueberry');
  });

  test('lights up only the slot the dragged tile is over, not the one under the pointer', async ({
    page,
  }) => {
    // Melon is placed in the third response area; its source slot is on the same row.
    const own = await boxOf(tile('target-2'));
    const source = await boxOf(tile('choice-c3'));
    const y = own.y + own.height / 2;

    // Held by its right edge and brought to the left of its slot, the tile covers the source slot while
    // the pointer is over the response area it came from.
    await dragTo(page, { x: own.x + own.width - 6, y }, { x: own.x + 6, y }, { release: false });

    await expect.poll(() => isLit('choice-c3')).toBe(true);
    expect(source.x + source.width).toBeLessThan(own.x);
    expect(await isLit('target-2')).toBe(false);

    await page.mouse.up();
  });
});
