/**
 * Regression test for CONTOOL-3159.
 *
 * The live sel_r1-g_plusggg item (56fabceb-801f-4d3c-8495-e30081b6f75d) supplies
 * choice images as 150x150 SVGs through the model's `imageUrl`/`imageAlt` contract
 * (ChoiceRow.svelte's dedicated image path — `class="object-contain pie-choice-image"`).
 * That path capped images with `style="max-height:var(--mpb-choice-image-max-height, 5rem)"`
 * (5rem = 80px), so a 150x150 asset was squeezed down to 80x80 — visibly "too small".
 *
 * The `variant-sel-r1-g-stem-graphic` fixture used by the existing graphic-parity spec
 * never exercised this path: its choices carry raw `<img>` markup in `labelHtml`, not
 * `imageUrl`, so ChoiceRow's dedicated image styling (and its cap) never applied. Hence
 * this gap went undetected. `variant-sel-r1-image-cap-150` closes it by using the same
 * imageUrl/imageAlt shape real Learnosity graphic items map to.
 *
 * Expected fix: images up to 150x150 render at their full natural size (not shrunk below
 * it); images larger than 150x150 get capped down to fit within 150x150.
 *
 * A related gap: the same choice image, once selected, is shown again inside the cloze
 * blank (ClozeMarker.svelte, `.pie-blank-image`). That path capped with a *different*
 * variable (`--mpb-selected-image-max-height, 4rem` = 64px) and no matching max-width,
 * so the selected image rendered at a different (and distorted, non-square) size than
 * the same image in the choice tile. The fix reuses the choice image's own
 * `--mpb-choice-image-max-width`/`--mpb-choice-image-max-height` vars for the blank
 * image too, so the two can never drift apart again.
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-image-cap-150';

async function openImageCapRoute(page: Page) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
  await page.waitForFunction(
    () => {
      const imgs = Array.from(
        document.querySelectorAll('.pie-choice-image')
      ) as HTMLImageElement[];
      return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0);
    },
    { timeout: 30_000 }
  );
}

test('image-cap-150: choice image natural size is 150x150 (fixture sanity check)', async ({
  page,
}) => {
  await openImageCapRoute(page);
  const root = deliveryContainer(page);

  const naturalSizes = await root
    .locator('.pie-choice-image')
    .evaluateAll((imgs) =>
      (imgs as HTMLImageElement[]).map((img) => ({
        w: img.naturalWidth,
        h: img.naturalHeight,
      }))
    );

  expect(naturalSizes.length).toBeGreaterThanOrEqual(1);
  for (const size of naturalSizes) {
    expect(size.w).toBe(150);
    expect(size.h).toBe(150);
  }
});

test('image-cap-150: a 150x150 choice image renders at its full 150x150 size, not shrunk', async ({
  page,
}) => {
  await openImageCapRoute(page);
  const root = deliveryContainer(page);

  const firstImage = root.locator('.pie-choice-image').first();
  await expect(firstImage).toBeVisible();

  const box = await firstImage.boundingBox();
  expect(box).not.toBeNull();

  // The pre-fix default (--mpb-choice-image-max-height: 5rem = 80px) squeezed this
  // down to 80x80 via object-contain. Post-fix it should render at its natural 150x150.
  expect(box?.width).toBeGreaterThanOrEqual(148);
  expect(box?.width).toBeLessThanOrEqual(150);
  expect(box?.height).toBeGreaterThanOrEqual(148);
  expect(box?.height).toBeLessThanOrEqual(150);
});

test('image-cap-150: the selected choice image renders the same size in the cloze blank as in the distractor tile', async ({
  page,
}) => {
  await openImageCapRoute(page);
  const root = deliveryContainer(page);

  const choiceBox = await root.locator('.pie-choice-image').first().boundingBox();
  expect(choiceBox).not.toBeNull();

  await root.locator('input[type="radio"]').first().check();

  const blankImage = root.locator('.pie-blank-image').first();
  await expect(blankImage).toBeVisible();
  const blankBox = await blankImage.boundingBox();
  expect(blankBox).not.toBeNull();

  // Pre-fix: the blank image used --mpb-selected-image-max-height (4rem = 64px) with no
  // matching max-width, so it rendered at a different, distorted (non-square) size than
  // the 150x150 choice tile image. Post-fix both share the same cap and render identically.
  expect(blankBox?.width).toBe(choiceBox?.width);
  expect(blankBox?.height).toBe(choiceBox?.height);
});
