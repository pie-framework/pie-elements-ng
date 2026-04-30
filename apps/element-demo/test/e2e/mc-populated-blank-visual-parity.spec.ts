/**
 * Visual-parity tests for mc-populated-blank (plusggg / gplusggg variants).
 *
 * Each test corresponds to an annotated gap in the PIEOneer LSY-vs-PIE
 * comparison screenshot. Expected values are sourced from the upstream
 * Renaissance r1.scss. All tests are expected to FAIL until the underlying
 * layout/style issues are resolved.
 *
 * Reference variant: variant-sel-r1-plusggg (audio_blank_only layout, horizontal choices)
 * Reference CSS: web-ItemBankViewer/learnosity/templates/Renaissance/r1.scss
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-plusggg';
const ELEMENT_SCOPE = '.delivery-view .element-container';

async function openPlusgggRoute(page: Parameters<typeof test>[0]['page']) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Space between distractors
//    r1.scss: .rli-r1-distractors uses justify-content: space-between at >=850px.
//    The minimum visible gap between adjacent tiles should be at least 16px.
// ---------------------------------------------------------------------------
test('plusggg: gap between adjacent choice tiles is at least 16px', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const tiles = root.locator('.choice-row-horizontal');
  await expect(tiles).toHaveCount(3);

  const boxes = await tiles.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().toJSON())
  );

  const gap01 = boxes[1].left - boxes[0].right;
  const gap12 = boxes[2].left - boxes[1].right;

  expect(gap01).toBeGreaterThanOrEqual(16);
  expect(gap12).toBeGreaterThanOrEqual(16);
});

// ---------------------------------------------------------------------------
// 2. Font size of choice label content
//    r1.scss: .rli-r1-content-element { font-size: 1.9em; line-height: 89px }
//    Computed font-size on the inner span should be >= 28px (1.8em × 16px base).
// ---------------------------------------------------------------------------
test('plusggg: choice label font-size is at least 28px', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const firstLabel = root.locator('.pie-choice-label').first();
  await expect(firstLabel).toBeVisible();

  const computedFontSize = await firstLabel.evaluate((el) => {
    const inner = el.querySelector('span') ?? el;
    return parseFloat(getComputedStyle(inner).fontSize);
  });

  expect(computedFontSize).toBeGreaterThanOrEqual(28);
});

// ---------------------------------------------------------------------------
// 3. Cloze marker (blank underline) thickness
//    r1.scss: .rli-r1-cloze { border-bottom: 6px solid }
//    Port currently uses 4px for audio_blank_only; expected is 6px.
// ---------------------------------------------------------------------------
test('plusggg: blank slot underline is 6px', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const blank = root.locator('.pie-blank-slot');
  await expect(blank).toBeVisible();

  const borderWidth = await blank.evaluate((el) =>
    parseFloat(getComputedStyle(el).borderBottomWidth)
  );

  expect(borderWidth).toBe(6);
});

// ---------------------------------------------------------------------------
// 4. Space between cloze underline edges and the filled-in text
//    r1.scss: .rli-r1-cloze { padding-bottom: 4px } — visible gap between
//    text and the underline bottom edge. The blank slot should have at least
//    4px bottom padding so the text doesn't sit flush on the underline.
// ---------------------------------------------------------------------------
test('plusggg: blank slot has at least 4px bottom padding', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  // Populate the blank so the padding is visible.
  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const blank = root.locator('.pie-blank-slot');
  const paddingBottom = await blank.evaluate((el) =>
    parseFloat(getComputedStyle(el).paddingBottom)
  );

  expect(paddingBottom).toBeGreaterThanOrEqual(4);
});

// ---------------------------------------------------------------------------
// 5a. Color of unselected (non-hover) choice tile
//    r1.scss: .rli-r1-distractor has no background-color by default.
//    Unselected tiles must be transparent or white.
// ---------------------------------------------------------------------------
test('plusggg: unselected choice tile background is transparent or white', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  const bg = await firstTile.evaluate((el) => getComputedStyle(el).backgroundColor);

  const isTransparentOrWhite =
    bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || bg === 'rgb(255, 255, 255)';
  expect(isTransparentOrWhite).toBe(true);
});

// ---------------------------------------------------------------------------
// 5b. Color of selected choice tile
//    r1.scss: .rli-r1-selected { background-color: #fcfcd3 }  (light yellow)
//    Port currently uses #f1f1f1 (grey). Expected: rgb(252, 252, 211).
// ---------------------------------------------------------------------------
test('plusggg: selected choice tile background is light yellow (#fcfcd3)', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedTile = root.locator('.choice-row-horizontal.is-selected .choice-tile').first();
  await expect(selectedTile).toBeVisible();

  await expect(selectedTile).toHaveCSS('background-color', 'rgb(252, 252, 211)');
});

// ---------------------------------------------------------------------------
// 6. Radio input padding (margin between radio and tile border)
//    r1.scss: .rli-r1-distractor>input { padding: 20px }
//    The radio input should have at least 16px padding so it sits away from
//    the bottom edge of the tile.
// ---------------------------------------------------------------------------
test('plusggg: radio input has at least 16px padding', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const firstRadio = root.locator('.choice-radio-bottom').first();
  await expect(firstRadio).toBeVisible();

  const padding = await firstRadio.evaluate((el) =>
    parseFloat(getComputedStyle(el).paddingBottom)
  );

  expect(padding).toBeGreaterThanOrEqual(16);
});
