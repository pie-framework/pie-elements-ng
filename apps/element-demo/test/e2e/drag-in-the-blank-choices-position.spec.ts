import { test, expect, type Locator } from '@playwright/test';
import {
  deliveryContainer,
  getModelFromSource,
  switchTab,
  updateModelInSource,
} from './test-helpers';

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Box> {
  await locator.waitFor({ state: 'visible' });
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('No bounding box');
  }
  return box;
}

// The pool shows where choicesPosition puts it through the DOM order, not a reversed flex direction,
// so the tab path, the reading order and text-to-speech meet the choices where they show.
test.describe('drag-in-the-blank: choicesPosition', () => {
  for (const [position, choicesFirst] of [
    ['above', true],
    ['below', false],
    ['left', true],
    ['right', false],
  ] as const) {
    test(`${position} puts the choices there on screen and in the DOM`, async ({ page }) => {
      await page.goto('/drag-in-the-blank/source?demo=basic-sentence');
      await page.locator('[data-testid="source-editor"]').waitFor({ timeout: 60_000 });
      await updateModelInSource(page, {
        ...(await getModelFromSource(page)),
        choicesPosition: position,
      });
      await switchTab(page, 'deliver');
      const root = deliveryContainer(page);
      const choice = root.locator('.MuiChip-root', { hasText: 'Jupiter' });
      const markup = root.getByText('is the largest planet').first();

      const pool = await boxOf(choice);
      const text = await boxOf(markup);
      const shown = {
        above: pool.y + pool.height <= text.y,
        below: text.y + text.height <= pool.y,
        left: pool.x + pool.width <= text.x,
        right: text.x + text.width <= pool.x,
      };
      expect(shown[position]).toBe(true);

      const precedesMarkup = await choice.evaluate(
        (node, other) =>
          !!(node.compareDocumentPosition(other as Node) & Node.DOCUMENT_POSITION_FOLLOWING),
        await markup.elementHandle()
      );
      expect(precedesMarkup).toBe(choicesFirst);
    });
  }
});
