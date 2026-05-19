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
import {
  assertChoicesGroupVisible,
  assertScreenshotParity,
} from './mc-populated-blank-parity-shared';
import { PARITY_REGIONS } from './parity-regions';

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
// 6. Radio input sits away from the tile bottom edge
//    r1.scss: .rli-r1-distractor>input { padding: 20px } — browsers ignore
//    padding on radio inputs in getComputedStyle, so we test the visual gap
//    between the radio bottom edge and the tile bottom edge instead (>= 8px).
// ---------------------------------------------------------------------------
test('plusggg: radio input has at least 8px clearance from tile bottom edge', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const firstTile = root.locator('.choice-tile').first();
  const firstRadio = root.locator('.choice-radio-bottom').first();
  await expect(firstTile).toBeVisible();
  await expect(firstRadio).toBeVisible();

  const tileBox = await firstTile.boundingBox();
  const radioBox = await firstRadio.boundingBox();
  expect(tileBox).not.toBeNull();
  expect(radioBox).not.toBeNull();

  const clearance = tileBox?.y + tileBox?.height - (radioBox?.y + radioBox?.height);
  expect(clearance).toBeGreaterThanOrEqual(8);
});

// ---------------------------------------------------------------------------
// 7. Blank slot height
//    r1.scss: .rli-r1-cloze { height: 160px }
//    The blank slot container should be at least 160px tall.
// ---------------------------------------------------------------------------
test('plusggg: blank slot height is at least 160px', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const blank = root.locator('.pie-blank-slot');
  await expect(blank).toBeVisible();

  const box = await blank.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.height).toBeGreaterThanOrEqual(160);
});

// ---------------------------------------------------------------------------
// 8. Gap between blank slot and distractors group
//    r1.scss: .rli-r1-cloze { margin-bottom: 30px }
//    Distance between bottom of blank slot and top of first choice tile >= 30px.
// ---------------------------------------------------------------------------
test('plusggg: gap between blank slot and choice tiles is at least 30px', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const blank = root.locator('.pie-blank-slot');
  const firstTile = root.locator('.choice-row-horizontal').first();
  await expect(blank).toBeVisible();
  await expect(firstTile).toBeVisible();

  const blankBox = await blank.boundingBox();
  const tileBox = await firstTile.boundingBox();
  expect(blankBox).not.toBeNull();
  expect(tileBox).not.toBeNull();

  const gap = tileBox?.y - (blankBox?.y + blankBox?.height);
  expect(gap).toBeGreaterThanOrEqual(30);
});

// ---------------------------------------------------------------------------
// 9. Distractor tile minimum height
//    r1.scss: .rli-r1-distractor { min-height: 180px }
//    Each horizontal choice tile should be at least 180px tall.
// ---------------------------------------------------------------------------
test('plusggg: each choice tile is at least 180px tall', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const tiles = root.locator('.choice-row-horizontal');
  await expect(tiles).toHaveCount(3);

  const heights = await tiles.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height)
  );

  for (const h of heights) {
    expect(h).toBeGreaterThanOrEqual(180);
  }
});

// ---------------------------------------------------------------------------
// 10. Content element min-height inside tile
//     r1.scss: .rli-r1-content-element { min-height: 150px }
//     The text content area inside each tile should be at least 150px tall.
// ---------------------------------------------------------------------------
test('plusggg: choice tile content area is at least 150px tall', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const firstContent = root.locator('.choice-tile-content').first();
  await expect(firstContent).toBeVisible();

  const box = await firstContent.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.height).toBeGreaterThanOrEqual(150);
});

// ---------------------------------------------------------------------------
// 11. Hover background color on unselected tile
//     r1.scss: .rli-r1-distractor:hover { background-color: #f2f2f2 }
//     Port uses #ececec. Expected on hover: rgb(242, 242, 242).
// ---------------------------------------------------------------------------
test('plusggg: hovered unselected tile background is #f2f2f2', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  await firstTile.hover();
  await page.waitForTimeout(100);

  await expect(firstTile).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});

// ---------------------------------------------------------------------------
// 12. Distractors group is horizontally centered
//     r1.scss: .rli-r1-distractors { align-items: center } and the outer
//     container is centered. The choices fieldset mid-point should be within
//     20px of the viewport horizontal center.
// ---------------------------------------------------------------------------
test('plusggg: choice tiles are horizontally centered in the viewport', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const fieldset = root.locator('.pie-choices-fieldset');
  await expect(fieldset).toBeVisible();

  const [fieldsetBox, viewportWidth] = await Promise.all([
    fieldset.boundingBox(),
    page.evaluate(() => window.innerWidth),
  ]);
  expect(fieldsetBox).not.toBeNull();

  const fieldsetMidX = fieldsetBox?.x + fieldsetBox?.width / 2;
  const viewportMidX = viewportWidth / 2;

  expect(Math.abs(fieldsetMidX - viewportMidX)).toBeLessThanOrEqual(20);
});

// ---------------------------------------------------------------------------
// 13. Audio button is in the top-right corner
//     r1.scss: .rli-r1-instructions { align-items: flex-end } — the audio
//     button sits at the right edge of the component, above the choices.
// ---------------------------------------------------------------------------
test('plusggg: audio button is to the right of the blank slot', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  // The audio container spans ~875px with justify-content:flex-end; use the button itself
  // for horizontal position checks rather than the wide container.
  const listenButton = root.locator('.pie-listen-button');
  const templateLine = root.locator('.pie-template-line');

  await expect(listenButton).toBeVisible();
  await expect(templateLine).toBeVisible();

  const audioBox = await listenButton.boundingBox();
  const templateBox = await templateLine.boundingBox();

  expect(audioBox).not.toBeNull();
  expect(templateBox).not.toBeNull();

  // Listen button left edge must be to the right of the template line midpoint
  const templateMidX = templateBox?.x + templateBox?.width / 2;
  expect(audioBox?.x).toBeGreaterThan(templateMidX);
});

test('plusggg: audio button top is above or level with the blank slot top', async ({ page }) => {
  await openPlusgggRoute(page);
  const root = deliveryContainer(page);

  const audioContainer = root.locator('.pie-audio-container');
  const templateLine = root.locator('.pie-template-line');

  const audioBox = await audioContainer.boundingBox();
  const templateBox = await templateLine.boundingBox();

  expect(audioBox).not.toBeNull();
  expect(templateBox).not.toBeNull();

  // Audio button top should be at or above the template line top
  expect(audioBox?.y).toBeLessThanOrEqual(templateBox?.y + 10);
});

// ---------------------------------------------------------------------------
// Live side-by-side parity (requires LEARNOSITY_CONSUMER_KEY)
// ---------------------------------------------------------------------------

const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('plusggg live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openParityRoute(page);
    await assertChoicesGroupVisible(page);
  });

  test('PIE stem, choices, and audio regions match Learnosity baseline screenshots', async ({
    page,
  }, testInfo) => {
    await openParityRoute(page);
    await assertScreenshotParity(page, testInfo, DEMO_ID, PARITY_REGIONS[DEMO_ID]);
  });
});
