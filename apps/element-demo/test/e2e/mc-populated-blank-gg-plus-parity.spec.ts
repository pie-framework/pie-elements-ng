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

  // When broken: blank top-Y is a full line height below the template (~100px+).
  // When inline: 3em font creates a natural ~35px baseline offset — use 50px
  // as the threshold to distinguish inline from a true line break.
  const verticalOffset = blankBox!.y - templateBox!.y;
  expect(verticalOffset).toBeLessThan(50);
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

// ---------------------------------------------------------------------------
// Live side-by-side parity (requires LEARNOSITY_CONSUMER_KEY)
// ---------------------------------------------------------------------------

import { installAudioMock, triggerAudioEvent } from './audio-mock';

const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openggplusParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('gg-plus live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openggplusParityRoute(page);
    await expect(page.locator('#pie-container [role="radiogroup"]')).toBeVisible();
    await expect(page.locator('#learnosity-container [role="group"], #learnosity-container [role="radiogroup"]').first()).toBeVisible();
  });

  test('selected tile background color matches between PIE and Learnosity', async ({ page }) => {
    await openggplusParityRoute(page);
    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);
    const pieBg = await page.locator('#pie-container .choice-row-horizontal.is-selected .choice-tile').first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.locator('#learnosity-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);
    const lrnBg = await page.locator('#learnosity-container [class*="selected"], #learnosity-container [class*="rli-r1-selected"]').first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(pieBg).toBe(lrnBg);
  });
});

test.describe('gg-plus live parity — aria', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('choices group has an accessible label on both sides', async ({ page }) => {
    await openggplusParityRoute(page);
    const pieGroup = page.locator('#pie-container [role="radiogroup"]');
    const pieLabelledBy = await pieGroup.getAttribute('aria-labelledby');
    const pieAriaLabel = await pieGroup.getAttribute('aria-label');
    expect(pieLabelledBy || pieAriaLabel).toBeTruthy();
    const lrnAriaLabel = await page.locator('#learnosity-container [role="group"], #learnosity-container [role="radiogroup"]').first().getAttribute('aria-label');
    expect(lrnAriaLabel).toBeTruthy();
  });

  test('blank slot aria-label is "blank" on PIE side', async ({ page }) => {
    await openggplusParityRoute(page);
    const label = await page.locator('#pie-container .pie-blank-slot').getAttribute('aria-label');
    expect(label).toBe('blank');
  });

  test('blank slot has role="status" and aria-live="polite" on PIE side', async ({ page }) => {
    await openggplusParityRoute(page);
    const blank = page.locator('#pie-container .pie-blank-slot');
    await expect(blank).toHaveAttribute('role', 'status');
    await expect(blank).toHaveAttribute('aria-live', 'polite');
  });

  test('audio silent image alt is "Repeat instructions" on PIE side', async ({ page }) => {
    await openggplusParityRoute(page);
    const alt = await page.locator('#pie-container .pie-listen-icon').first().getAttribute('alt');
    expect(alt).toBe('Repeat instructions');
  });
});

test.describe('gg-plus live parity — behavioral', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE audio button switches to playing image on play event', async ({ page }) => {
    await installAudioMock(page);
    await openggplusParityRoute(page);
    const silentImg = page.locator('#pie-container .pie-listen-icon').first();
    const playingImg = page.locator('#pie-container .pie-listen-icon').nth(1);
    await expect(silentImg).toHaveClass(/listen-active/);
    await triggerAudioEvent(page, 'play');
    await page.waitForTimeout(100);
    await expect(playingImg).toHaveClass(/listen-active/);
  });

  test('PIE audio button returns to silent on ended', async ({ page }) => {
    await installAudioMock(page);
    await openggplusParityRoute(page);
    await triggerAudioEvent(page, 'play');
    await page.waitForTimeout(100);
    await triggerAudioEvent(page, 'ended');
    await page.waitForTimeout(100);
    await expect(page.locator('#pie-container .pie-listen-icon').first()).toHaveClass(/listen-active/);
  });
});
