/**
 * Selected-state screenshot parity for mc-populated-blank.
 *
 * Captures stem and choices regions after the student selects the first choice.
 * Covers all 14 text + graphic delivery variants (excludes ES and evaluate modes).
 * Audio transcript is intentionally excluded — its rendering is unchanged by selection.
 *
 * Snapshot names: pie-${variantId}-stem-selected.png
 *                 pie-${variantId}-choices-selected.png
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const TEXT_VARIANTS = [
  'variant-sel-r1-plusggg',
  'variant-sr-vic',
  'variant-sel-vic',
  'variant-sel-r1-gplusggg',
  'variant-sel-r1-g-stem',
  'variant-sel-r1-gg-plus',
  'variant-sel-r1-ggplus',
  'variant-sel-r1-s3',
] as const;

const GRAPHIC_VARIANTS = [
  'variant-sel-r1-plusggg-graphic',
  'variant-sel-r1-gplusggg-graphic',
  'variant-sel-r1-gg-plus-graphic',
  'variant-sel-r1-ggplus-graphic',
  'variant-sel-r1-g-stem-graphic',
  'variant-sel-r1-s3-graphic',
] as const;

const GRAPHIC_SET = new Set<string>(GRAPHIC_VARIANTS);

async function openRoute(page: Page, demoId: string) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(demoId)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);

  if (GRAPHIC_SET.has(demoId)) {
    await page.waitForFunction(
      () => {
        const imgs = Array.from(
          document.querySelectorAll('.pie-choice img')
        ) as HTMLImageElement[];
        return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
      },
      { timeout: 30_000 }
    );
  }
}

for (const demoId of [...TEXT_VARIANTS, ...GRAPHIC_VARIANTS]) {
  test.describe(demoId, () => {
    test('stem region matches snapshot after first choice selected', async ({ page }) => {
      await openRoute(page, demoId);
      const root = deliveryContainer(page);

      await root.locator('input[type="radio"]').first().check();
      await page.waitForTimeout(150);

      const stem = root.locator('.pie-template-line');
      await expect(stem).toBeVisible();
      await expect(stem).toHaveScreenshot(`pie-${demoId}-stem-selected.png`);
    });

    test('choices region matches snapshot after first choice selected', async ({ page }) => {
      await openRoute(page, demoId);
      const root = deliveryContainer(page);

      await root.locator('input[type="radio"]').first().check();
      await page.waitForTimeout(150);

      const choices = root.locator('.pie-choices-fieldset');
      await expect(choices).toBeVisible();
      await expect(choices).toHaveScreenshot(`pie-${demoId}-choices-selected.png`);
    });
  });
}
