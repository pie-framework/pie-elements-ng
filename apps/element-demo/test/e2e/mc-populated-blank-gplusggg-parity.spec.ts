/**
 * Visual-parity tests for mc-populated-blank (sel_r1-_gplusggg variant).
 *
 * Each test corresponds to a difference visible in the side-by-side comparison of
 * _gReference.png (reference) vs _gMcPopulatedBlank.png (current output).
 * Reference CSS: web-ItemBankViewer/learnosity/templates/Renaissance/r1.scss
 *
 * All tests are expected to FAIL until the underlying style issues are resolved.
 *
 * Reference variant: variant-sel-r1-gplusggg (audio_blank_only layout, horizontal choices)
 * Template: "{{blank}} <span>four</span>" — blank first, stem word trailing
 * Item: 11b4d9be-a79e-48c3-9e58-84f5be3dbb0f
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-gplusggg';

async function openGplusgggRoute(page: Page) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Audio/Listen button is in the top-right corner
//    r1.scss: .rli-r1-instructions { align-items: flex-end } — audio button
//    sits at the right edge of the component.
//    Currently the button is rendered top-left because the variant CSS
//    (sel-r1-gplusggg.css) is missing position:absolute / top:1rem / right:1rem
//    on .pie-audio-container.
// ---------------------------------------------------------------------------
test('gplusggg: audio button is to the right of the template line midpoint', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const audioContainer = root.locator('.pie-audio-container');
  const templateLine = root.locator('.pie-template-line');

  await expect(audioContainer).toBeVisible();
  await expect(templateLine).toBeVisible();

  const audioBox = await audioContainer.boundingBox();
  const templateBox = await templateLine.boundingBox();

  expect(audioBox).not.toBeNull();
  expect(templateBox).not.toBeNull();

  const templateMidX = templateBox!.x + templateBox!.width / 2;
  expect(audioBox!.x).toBeGreaterThan(templateMidX);
});

test('gplusggg: audio button top is above or level with the template line top', async ({
  page,
}) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const audioContainer = root.locator('.pie-audio-container');
  const templateLine = root.locator('.pie-template-line');

  await expect(audioContainer).toBeVisible();
  await expect(templateLine).toBeVisible();

  const audioBox = await audioContainer.boundingBox();
  const templateBox = await templateLine.boundingBox();

  expect(audioBox).not.toBeNull();
  expect(templateBox).not.toBeNull();

  expect(audioBox!.y).toBeLessThanOrEqual(templateBox!.y + 10);
});

// ---------------------------------------------------------------------------
// 2. Selected choice tile background is light yellow (#fcfcd3)
//    r1.scss: .rli-r1-selected { background-color: #fcfcd3 }
//    Currently the variant CSS does not set --mpb-choice-selected-bg,
//    so the tile shows no background on selection.
// ---------------------------------------------------------------------------
test('gplusggg: selected choice tile background is light yellow (#fcfcd3)', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedTile = root.locator('.choice-row-horizontal.is-selected .choice-tile').first();
  await expect(selectedTile).toBeVisible();

  await expect(selectedTile).toHaveCSS('background-color', 'rgb(252, 252, 211)');
});

// ---------------------------------------------------------------------------
// 3. Unselected (non-hover) choice tile background is transparent or white
//    r1.scss: .rli-r1-distractor has no background-color by default.
// ---------------------------------------------------------------------------
test('gplusggg: unselected choice tile background is transparent or white', async ({ page }) => {
  await openGplusgggRoute(page);
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
// 4. Hovered unselected tile background is #f2f2f2
//    r1.scss: .rli-r1-distractor:hover { background-color: #f2f2f2 }
//    Currently the variant CSS does not set --mpb-choice-hover-bg.
// ---------------------------------------------------------------------------
test('gplusggg: hovered unselected tile background is #f2f2f2', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  await firstTile.hover();
  await page.waitForTimeout(100);

  await expect(firstTile).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});

// ---------------------------------------------------------------------------
// 5. Gap between adjacent choice tiles is at least 16px
//    r1.scss: .rli-r1-distractors { justify-content: space-between }
//    Currently --mpb-choice-group-gap is not set for this variant, so tiles
//    may sit flush against each other.
// ---------------------------------------------------------------------------
test('gplusggg: gap between adjacent choice tiles is at least 16px', async ({ page }) => {
  await openGplusgggRoute(page);
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
// 6. Blank slot underline is 6px
//    r1.scss: .rli-r1-cloze { border-bottom: 6px solid }
// ---------------------------------------------------------------------------
test('gplusggg: blank slot underline is 6px', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const blank = root.locator('.pie-blank-slot');
  await expect(blank).toBeVisible();

  const borderWidth = await blank.evaluate((el) =>
    parseFloat(getComputedStyle(el).borderBottomWidth)
  );

  expect(borderWidth).toBe(6);
});
