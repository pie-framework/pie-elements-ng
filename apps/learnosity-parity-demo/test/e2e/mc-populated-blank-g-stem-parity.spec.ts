/**
 * Visual-parity tests for mc-populated-blank (sel_r1-g_plusggg / g-stem variant).
 *
 * Each test corresponds to a gap visible in the side-by-side comparison of
 * g_plusggg.png (reference) vs McPopulatedBlankg_.png (current output).
 * Reference CSS:
 *   web-ItemBankViewer/learnosity/templates/Renaissance/sel_r1-g_plusggg/scss/main.scss
 *   web-ItemBankViewer/learnosity/templates/Renaissance/r1.scss
 *
 * All tests are expected to FAIL until the underlying style/layout issues are resolved.
 *
 * Reference variant: variant-sel-r1-g-stem (token_sequence layout, horizontal choices)
 * Template: "<p><span>will</span> {{blank}}</p>" — stem token left, blank right
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';
import {
  assertChoicesGroupVisible,
  assertScreenshotParity,
} from './mc-populated-blank-parity-shared';
import { PARITY_REGIONS } from './parity-regions';

const DEMO_ID = 'variant-sel-r1-g-stem';

async function openGStemRoute(page: Parameters<typeof test>[0]['page']) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Stem token ("will") and blank slot are on the same horizontal line
//    r1.scss: the stem area uses flex-direction:row so all inline tokens and
//    the blank sit on one line.
//    The template "<p><span>will</span> {{blank}}</p>" wraps the stem in a
//    block-level <p>, causing "will" to occupy its own line and pushing the
//    blank slot below it.
// ---------------------------------------------------------------------------
test('g-stem: stem token and blank slot are on the same line (no line break)', async ({ page }) => {
  await openGStemRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  const blankSlot = root.locator('.pie-blank-slot');
  await expect(templateLine).toBeVisible();
  await expect(blankSlot).toBeVisible();

  // The first text node / span inside the template renders the stem token.
  // When inline: the stem span and the blank slot share the same Y (within 10px).
  // When broken: the blank top-Y is significantly below the template top-Y.
  const templateBox = await templateLine.boundingBox();
  const blankBox = await blankSlot.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(blankBox).not.toBeNull();

  const verticalOffset = blankBox?.y - templateBox?.y;
  expect(verticalOffset).toBeLessThan(20);
});

// ---------------------------------------------------------------------------
// 2. Blank slot underline is 6px
//    r1.scss: .rli-r1-cloze { border-bottom: 6px solid }
//    The token_sequence layout profile preset currently sets
//    blankUnderlineWideWidthPx: 4, but the r1 reference requires 6px.
// ---------------------------------------------------------------------------
test('g-stem: blank slot underline is 6px', async ({ page }) => {
  await openGStemRoute(page);
  const root = deliveryContainer(page);

  const blankSlot = root.locator('.pie-blank-slot');
  await expect(blankSlot).toBeVisible();

  const borderWidth = await blankSlot.evaluate((el) =>
    parseFloat(getComputedStyle(el).borderBottomWidth)
  );

  expect(borderWidth).toBe(6);
});

// ---------------------------------------------------------------------------
// 3. Selected choice tile background is yellow (#fcfcd3)
//    r1.scss: .rli-r1-selected { background-color: #fcfcd3 }
//    The component exposes --mpb-choice-selected-bg (checked first) and
//    --pie-correct-answer-choice-selected-bg (checked second). The latter is
//    set by the rootStyle inline binding and overrides the variant CSS value,
//    so the variant must set --mpb-choice-selected-bg directly to win.
// ---------------------------------------------------------------------------
test('g-stem: selected choice tile background is yellow (#fcfcd3)', async ({ page }) => {
  await openGStemRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedTile = root.locator('.choice-row-horizontal.is-selected .choice-tile').first();
  await expect(selectedTile).toBeVisible();

  await expect(selectedTile).toHaveCSS('background-color', 'rgb(252, 252, 211)');
});

// ---------------------------------------------------------------------------
// 4. Hovered unselected tile background is #f2f2f2
//    r1.scss: .rli-r1-distractor:hover { background-color: #f2f2f2 }
//    Same CSS-variable precedence issue as selected: --mpb-choice-hover-bg
//    must be set in the variant CSS to override the inline rootStyle binding.
// ---------------------------------------------------------------------------
test('g-stem: hovered unselected choice tile background is #f2f2f2', async ({ page }) => {
  await openGStemRoute(page);
  const root = deliveryContainer(page);

  await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  await firstTile.hover();
  await page.waitForTimeout(100);

  await expect(firstTile).toHaveCSS('background-color', 'rgb(242, 242, 242)');
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

test.describe('g-stem live parity — visual', () => {
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
