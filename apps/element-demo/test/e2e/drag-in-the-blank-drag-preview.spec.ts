import { test, expect, type Locator } from '@playwright/test';
import { deliveryContainer, openDeliverRoute } from './test-helpers';

// Sentence choices, which can wrap, at 1.3 times the text size.
const DEMO = 'story-events-in-order';
const CHOICES = [
  'Mona practices for the game.',
  'Mona wakes up.',
  'Mona goes to the field.',
  'Mona eats her breakfast.',
];

type Copy = { overlay: boolean; width: number; height: number; textHeight: number };

/** Every chip showing `text`: its size, its text's height, and whether it is the drag overlay's copy. */
const copiesOf = (root: Locator, text: string): Promise<Copy[]> =>
  root.evaluate(
    (node, text) =>
      [...node.querySelectorAll('.MuiChip-root')]
        .filter((chip) => chip.textContent === text)
        .map((chip) => {
          const box = chip.getBoundingClientRect();
          const label = chip.querySelector('.MuiChip-label > span') as HTMLElement;
          return {
            // dnd-kit's overlay wrapper is fixed-position.
            overlay: chip.closest('[style*="position: fixed"]') !== null,
            width: box.width,
            height: box.height,
            textHeight: label.getBoundingClientRect().height,
          };
        }),
    text
  );

// A drag holds the token at its size and draws a copy at that size; neither may wrap its text.
test.describe('drag-in-the-blank: the drag preview', () => {
  let root: Locator;

  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, 'drag-in-the-blank', DEMO);
    root = deliveryContainer(page);
    await expect(root.locator('.MuiChip-root', { hasText: CHOICES[0] })).toBeVisible();
  });

  for (const text of CHOICES) {
    test(`keeps "${text}" the size it is in the pool`, async ({ page }) => {
      const [before] = await copiesOf(root, text);
      const box = await root.locator('.MuiChip-root', { hasText: text }).boundingBox();
      if (!box) {
        throw new Error('No bounding box');
      }

      // Press and travel past dnd-kit's 8px activation distance, holding the drag.
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 20, box.y - 100, { steps: 10 });
      await page.waitForTimeout(150);

      const copies = await copiesOf(root, text);
      const preview = copies.find((copy) => copy.overlay);
      const source = copies.find((copy) => !copy.overlay);
      await page.mouse.up();
      if (!preview || !source) {
        throw new Error('The drag shows no overlay copy beside the held token');
      }

      expect(Math.abs(preview.width - before.width)).toBeLessThanOrEqual(1);
      expect(preview.height).toBeCloseTo(before.height, 0);
      expect(preview.textHeight).toBeCloseTo(before.textHeight, 0);
      expect(source.textHeight).toBeCloseTo(before.textHeight, 0);
    });
  }

  // A response area shows the choice held over it where the choice would land.
  test('previews a choice held over a response area in full, where it lands', async ({ page }) => {
    const text = CHOICES[0];
    const area = root.locator('[aria-label="Blank 1"]');

    /** The box of the text in `selector`, from the area's left edge, and whether it is cut off. */
    const textIn = (selector: string) =>
      area.evaluate((node, selector) => {
        const chip = (node.querySelector('.MuiChip-root') as HTMLElement).getBoundingClientRect();
        const label = node.querySelector(selector) as HTMLElement;
        const range = document.createRange();
        range.selectNodeContents(label);
        const box = range.getBoundingClientRect();
        return {
          left: box.left - chip.left,
          width: box.width,
          cut: label.scrollWidth > label.clientWidth,
        };
      }, selector);

    const from = await root.locator('.MuiChip-root', { hasText: text }).boundingBox();
    const to = await area.boundingBox();
    if (!from || !to) {
      throw new Error('No bounding box');
    }
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 14 });
    await page.waitForTimeout(150);

    const held = await textIn('.dragged');
    await page.mouse.up();
    await expect(area).toContainText(text);
    const placed = await textIn('.MuiChip-label > span');

    expect(held.cut).toBe(false);
    expect(held.width).toBeCloseTo(placed.width, 0);
    expect(Math.abs(held.left - placed.left)).toBeLessThanOrEqual(1);
  });
});
