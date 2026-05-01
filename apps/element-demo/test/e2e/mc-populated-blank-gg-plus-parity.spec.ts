/**
 * Visual-parity tests for mc-populated-blank (sel_r1-gg_plusggg / gg-plus variant).
 *
 * Each test corresponds to a gap visible in the side-by-side comparison of
 * gg_plusggg.png (reference) vs McPopulatedBlankgg_.png (current output).
 * Reference CSS:
 *   web-ItemBankViewer/learnosity/templates/Renaissance/r1.scss
 *
 * All tests are expected to FAIL until the underlying style/layout issues are resolved.
 *
 * Reference variant: variant-sel-r1-gg-plus (token_sequence layout, horizontal choices)
 * Template: "<p><span>l</span> <span>m</span> {{blank}}</p>" — two stem tokens left, blank right
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-gg-plus';

async function openGgPlusRoute(page: Parameters<typeof test>[0]['page']) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Stem tokens ("l", "m") and blank slot are on the same horizontal line
//    r1.scss: the stem area uses flex-direction:row so all inline tokens and
//    the blank sit on one line.
//    The template "<p><span>l</span> <span>m</span> {{blank}}</p>" wraps the
//    stem in a block-level <p>, causing tokens to occupy their own line and
//    pushing the blank slot below them.
// ---------------------------------------------------------------------------
test('gg-plus: stem tokens and blank slot are on the same line (no line break)', async ({
  page,
}) => {
  await openGgPlusRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  const blankSlot = root.locator('.pie-blank-slot');
  await expect(templateLine).toBeVisible();
  await expect(blankSlot).toBeVisible();

  const templateBox = await templateLine.boundingBox();
  const blankBox = await blankSlot.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(blankBox).not.toBeNull();

  // When broken: blank top-Y is significantly below the template top-Y (>30px).
  // When inline: both share approximately the same Y (within 20px — 3em font
  // creates a natural baseline offset but not a full line break).
  const verticalOffset = blankBox!.y - templateBox!.y;
  expect(verticalOffset).toBeLessThan(20);
});

// ---------------------------------------------------------------------------
// 2. Blank slot underline is 6px
//    r1.scss: .rli-r1-cloze { border-bottom: 6px solid }
//    The token_sequence layout profile preset uses blankUnderlineWideWidthPx
//    which must be 6 for r1-family variants.
// ---------------------------------------------------------------------------
test('gg-plus: blank slot underline is 6px', async ({ page }) => {
  await openGgPlusRoute(page);
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
//    The variant CSS must set --mpb-choice-selected-bg (first-priority var)
//    to win over the inline rootStyle binding.
// ---------------------------------------------------------------------------
test('gg-plus: selected choice tile background is yellow (#fcfcd3)', async ({ page }) => {
  await openGgPlusRoute(page);
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
//    The variant CSS must set --mpb-choice-hover-bg (first-priority var)
//    to win over the inline rootStyle binding.
// ---------------------------------------------------------------------------
test('gg-plus: hovered unselected choice tile background is #f2f2f2', async ({ page }) => {
  await openGgPlusRoute(page);
  const root = deliveryContainer(page);

  await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  await firstTile.hover();
  await page.waitForTimeout(100);

  await expect(firstTile).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});
