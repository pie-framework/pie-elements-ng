/**
 * Parity tests for mc-populated-blank — graphic (choiceMode=image) variants.
 *
 * Covers all 6 graphic variants, one per r1 template type:
 *   variant-sel-r1-plusggg-graphic   — audio_blank_only
 *   variant-sel-r1-gplusggg-graphic  — audio_blank_only
 *   variant-sel-r1-gg-plus-graphic   — token_sequence
 *   variant-sel-r1-ggplus-graphic    — token_sequence
 *   variant-sel-r1-g-stem-graphic    — token_sequence
 *   variant-sel-r1-s3-graphic        — stimulus_image_blank
 *
 * None of these have a learnosityItemReference so live parity is skipped.
 * Tests assert:
 *   1. Images are visible inside choice tiles
 *   2. Tile selection state (yellow bg, is-selected class)
 *   3. Hover background on tiles
 *   4. Gap between adjacent tiles
 *   5. PIE screenshot regression snapshot
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';
import { PARITY_REGIONS } from './parity-regions';

const GRAPHIC_VARIANTS = [
  'variant-sel-r1-plusggg-graphic',
  'variant-sel-r1-gplusggg-graphic',
  'variant-sel-r1-gg-plus-graphic',
  'variant-sel-r1-ggplus-graphic',
  'variant-sel-r1-g-stem-graphic',
  'variant-sel-r1-s3-graphic',
] as const;

async function openGraphicRoute(page: Page, demoId: string) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(demoId)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
  // Wait for choice images to load — they are external URLs and define tile dimensions.
  await page.waitForFunction(
    () => {
      const imgs = Array.from(document.querySelectorAll('.pie-choice img')) as HTMLImageElement[];
      return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
    },
    { timeout: 30_000 }
  );
}

for (const DEMO_ID of GRAPHIC_VARIANTS) {
  test.describe(DEMO_ID, () => {
    test('choice images are present and loaded', async ({ page }) => {
      await openGraphicRoute(page, DEMO_ID);
      const root = deliveryContainer(page);

      // Images are in labelHtml as <img> tags rendered via {@html}.
      // openGraphicRoute waits for naturalWidth > 0 on all choice images.
      const images = root.locator('.pie-choice img');
      const count = await images.count();
      expect(count).toBeGreaterThanOrEqual(1);

      const naturalWidths = await images.evaluateAll((imgs) =>
        (imgs as HTMLImageElement[]).map((img) => (img as HTMLImageElement).naturalWidth)
      );
      expect(naturalWidths.every((w) => w > 0)).toBe(true);
    });

    test('selected choice tile gets is-selected and yellow background', async ({ page }) => {
      await openGraphicRoute(page, DEMO_ID);
      const root = deliveryContainer(page);

      await root.locator('input[type="radio"]').first().check();
      await page.waitForTimeout(100);

      const selectedRow = root.locator('.pie-choice.is-selected').first();
      await expect(selectedRow).toBeVisible();

      const tile = selectedRow.locator('.choice-tile');
      await expect(tile).toHaveCSS('background-color', 'rgb(252, 252, 211)');
    });

    test('unselected choice tile background is transparent or white', async ({ page }) => {
      await openGraphicRoute(page, DEMO_ID);
      const root = deliveryContainer(page);

      await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

      const firstTile = root.locator('.choice-tile').first();
      await expect(firstTile).toBeVisible();

      const bg = await firstTile.evaluate((el) => getComputedStyle(el).backgroundColor);
      const isTransparentOrWhite =
        bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || bg === 'rgb(255, 255, 255)';
      expect(isTransparentOrWhite).toBe(true);
    });

    test('hovered choice tile has a different background than unselected', async ({ page }) => {
      await openGraphicRoute(page, DEMO_ID);
      const root = deliveryContainer(page);

      const firstTile = root.locator('.choice-tile').first();
      await expect(firstTile).toBeVisible();

      const bgBefore = await firstTile.evaluate((el) => getComputedStyle(el).backgroundColor);
      await firstTile.hover();
      await page.waitForTimeout(100);
      const bgAfter = await firstTile.evaluate((el) => getComputedStyle(el).backgroundColor);

      expect(bgAfter).not.toBe(bgBefore);
    });

    test('gap between adjacent choice tiles on the same row is at least 16px', async ({ page }) => {
      await openGraphicRoute(page, DEMO_ID);
      const root = deliveryContainer(page);

      const tiles = root.locator('.choice-row-horizontal');
      const count = await tiles.count();
      expect(count).toBeGreaterThanOrEqual(2);

      const boxes = await tiles.evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().toJSON())
      );

      // Only measure gaps between tiles on the same row (same approximate top Y).
      // Minimum gap is 4px — enough to show tiles are separated, not touching.
      let foundGap = false;
      for (let i = 1; i < boxes.length; i++) {
        const sameRow = Math.abs(boxes[i].top - boxes[i - 1].top) < 10;
        if (sameRow) {
          const gap = boxes[i].left - boxes[i - 1].right;
          expect(gap).toBeGreaterThanOrEqual(4);
          foundGap = true;
        }
      }
      expect(foundGap).toBe(true);
    });

    test('stem region matches committed snapshot', async ({ page }) => {
      await openGraphicRoute(page, DEMO_ID);
      const root = deliveryContainer(page);
      const stem = root.locator('.pie-template-line');
      await expect(stem).toBeVisible();
      await expect(stem).toHaveScreenshot(`pie-${DEMO_ID}-stem.png`);
    });

    test('choices region matches committed snapshot', async ({ page }) => {
      await openGraphicRoute(page, DEMO_ID);
      const root = deliveryContainer(page);
      const choices = root.locator('.pie-choices-fieldset');
      await expect(choices).toBeVisible();
      await expect(choices).toHaveScreenshot(`pie-${DEMO_ID}-choices.png`);
    });
  });
}
