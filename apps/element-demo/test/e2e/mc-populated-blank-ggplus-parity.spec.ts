/**
 * Visual-parity tests for mc-populated-blank (sel_r1-_ggplusggg / ggplus variant).
 *
 * Each test corresponds to a gap visible in the side-by-side comparison of
 * _gg.png (reference) vs McPopulatedBlank_gg.png (current output).
 * Reference CSS:
 *   web-ItemBankViewer/learnosity/templates/Renaissance/r1.scss
 *
 * All tests are expected to FAIL until the underlying style/layout issues are resolved.
 *
 * Reference variant: variant-sel-r1-ggplus (token_sequence layout, horizontal choices)
 * Template: "<p>{{blank}} <span>m</span> <span>n</span></p>" — blank first, tokens trailing
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-ggplus';

async function openGgplusRoute(page: Parameters<typeof test>[0]['page']) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Blank slot and trailing tokens ("m", "n") are on the same horizontal line
//    r1.scss: the stem area uses flex-direction:row so the blank and all inline
//    tokens sit on one line.
//    The template "<p>{{blank}} <span>m</span> <span>n</span></p>" wraps in a
//    block-level <p>, causing the blank slot to render below the trailing tokens.
// ---------------------------------------------------------------------------
test('ggplus: blank slot and trailing tokens are on the same line (no line break)', async ({
  page,
}) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  const blankSlot = root.locator('.pie-blank-slot');
  await expect(templateLine).toBeVisible();
  await expect(blankSlot).toBeVisible();

  const templateBox = await templateLine.boundingBox();
  const blankBox = await blankSlot.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(blankBox).not.toBeNull();

  // When broken: blank top-Y is a full line height below the template (~100px+).
  // When inline: 3em font creates a natural ~35px baseline offset — use 50px
  // as the threshold to distinguish inline from a true line break.
  const verticalOffset = Math.abs(blankBox!.y - templateBox!.y);
  expect(verticalOffset).toBeLessThan(50);
});

// ---------------------------------------------------------------------------
// 2. Blank slot underline is 6px
//    r1.scss: .rli-r1-cloze { border-bottom: 6px solid }
//    The token_sequence layout profile uses blankUnderlineWideWidthPx which
//    must be 6 for r1-family variants.
// ---------------------------------------------------------------------------
test('ggplus: blank slot underline is 6px', async ({ page }) => {
  await openGgplusRoute(page);
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
test('ggplus: selected choice tile background is yellow (#fcfcd3)', async ({ page }) => {
  await openGgplusRoute(page);
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
test('ggplus: hovered unselected choice tile background is #f2f2f2', async ({ page }) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);

  await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  await firstTile.hover();
  await page.waitForTimeout(100);

  await expect(firstTile).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});
