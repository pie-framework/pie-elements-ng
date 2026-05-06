/**
 * Visual-parity tests for mc-populated-blank (sr-vic variant).
 *
 * Each test corresponds to a gap visible in the side-by-side comparison of
 * sr_vic.png (reference) vs McPopulatedBlankAsBuilt.png (current output).
 * Reference CSS: web-ItemBankViewer/learnosity/templates/Renaissance/vic.scss
 *
 * All tests are expected to FAIL until the underlying style/layout issues are resolved.
 *
 * Reference variant: variant-sr-vic (inline_sentence layout, vertical choices)
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sr-vic';

async function openSrVicRoute(page: Parameters<typeof test>[0]['page']) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Template sentence and blank slot are on the same line
//    vic.scss: .rli-vic-answer wraps sentence and cloze in inline flex so the
//    blank stays inline within the sentence text.
//    Current issue: the <p> tag inside the template HTML is rendered as a
//    block element, pushing the blank slot to a new line.
// ---------------------------------------------------------------------------
test('sr-vic: blank slot stays inline within the template sentence (no line break)', async ({
  page,
}) => {
  await openSrVicRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  const blankSlot = root.locator('.pie-blank-slot');
  await expect(templateLine).toBeVisible();
  await expect(blankSlot).toBeVisible();

  const templateBox = await templateLine.boundingBox();
  const blankBox = await blankSlot.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(blankBox).not.toBeNull();

  // When blank wraps: the <p> before it occupies one full line (~20px at 16px
  // font / 123% line-height), so blankBox.y - templateBox.y ≈ 20px.
  // When inline (correct): both start at the same Y, so difference ≈ 0.
  const verticalOffset = blankBox!.y - templateBox!.y;
  expect(verticalOffset).toBeLessThan(10);
});

// ---------------------------------------------------------------------------
// 2. Filled blank value text is red (#cc3333)
//    vic.scss: .rli-vic-cloze > .rli-vic-content-element { color: #cc3333 }
//    The filled-in answer text inside the blank slot should be rendered in red.
//    Current sr-vic.css has no color override for .pie-blank-value.
// ---------------------------------------------------------------------------
test('sr-vic: filled blank value text color is #cc3333 (red)', async ({ page }) => {
  await openSrVicRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const blankValue = root.locator('.pie-blank-value');
  await expect(blankValue).toBeVisible();

  await expect(blankValue).toHaveCSS('color', 'rgb(204, 51, 51)');
});

// ---------------------------------------------------------------------------
// 3. Selected choice row background is full-width yellow (#fcfcd3)
//    vic.scss: .rli-vic-selected { background-color: #fcfcd3 } is applied to
//    the whole distractor row element, covering radio + label together.
//    Currently background is applied only to .pie-choice-label-wrap, and uses
//    grey (#f1f1f1) as the default, not yellow (#fcfcd3).
// ---------------------------------------------------------------------------
test('sr-vic: selected choice row has full-width yellow background (#fcfcd3)', async ({ page }) => {
  await openSrVicRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedRow = root.locator('.pie-choice.is-selected').first();
  await expect(selectedRow).toBeVisible();

  // Background must be on the row itself (covering radio + label),
  // not only on the inner .pie-choice-label-wrap.
  await expect(selectedRow).toHaveCSS('background-color', 'rgb(252, 252, 211)');
});

// ---------------------------------------------------------------------------
// 4. Choice label text is left-aligned
//    vic.scss: distractor label text sits immediately right of the radio input
//    with no centering. Current .choice-html uses text-align: center and
//    justify-content: center, so text floats to the centre of the label area.
// ---------------------------------------------------------------------------
test('sr-vic: choice label text is left-aligned', async ({ page }) => {
  await openSrVicRoute(page);
  const root = deliveryContainer(page);

  const firstLabel = root
    .locator('.pie-choice:not(.pie-choice-horizontal) .pie-choice-label')
    .first();
  await expect(firstLabel).toBeVisible();

  const textAlign = await firstLabel.evaluate((el) => getComputedStyle(el).textAlign);

  expect(['left', 'start']).toContain(textAlign);
});

// ---------------------------------------------------------------------------
// 5. Hover background is applied to the full choice row (#f2f2f2)
//    vic.scss: .rli-vic-distractor:hover { background-color: #F2F2F2 }
//    Currently hover background (#ececec) is applied to .pie-choice-label-wrap,
//    not the row, and uses the wrong colour.
// ---------------------------------------------------------------------------
test('sr-vic: hovered unselected choice row background is #f2f2f2', async ({ page }) => {
  await openSrVicRoute(page);
  const root = deliveryContainer(page);

  await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

  const firstRow = root.locator('.pie-choice:not(.pie-choice-horizontal)').first();
  await expect(firstRow).toBeVisible();

  await firstRow.hover();
  await page.waitForTimeout(100);

  // Background must be on the row itself, not only the inner label wrapper.
  await expect(firstRow).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});

// ---------------------------------------------------------------------------
// Live side-by-side parity (requires LEARNOSITY_CONSUMER_KEY)
// ---------------------------------------------------------------------------

import {
  assertBlankSlotAriaLabel,
  assertBlankSlotAriaLive,
  assertChoicesGroupAccessibleLabel,
  assertChoicesGroupVisible,
} from './mc-populated-blank-parity-shared';

const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openSrVicParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('sr-vic live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openSrVicParityRoute(page);
    await assertChoicesGroupVisible(page);
  });

  test('filled blank value is red (#cc3333) on PIE side', async ({ page }) => {
    await openSrVicParityRoute(page);
    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);
    const color = await page
      .locator('#pie-container .pie-blank-value')
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(204, 51, 51)');
  });

  test('audio transcript is sr-only (not visibly rendered) on PIE side', async ({ page }) => {
    await openSrVicParityRoute(page);
    const transcript = page.locator('#pie-container .pie-audio-transcript');
    // sr-vic uses showVisibleTranscript: false — transcript should be sr-only or absent
    const isVisible = await transcript.isVisible().catch(() => false);
    if (isVisible) {
      const clip = await transcript.evaluate((el) => getComputedStyle(el).clip);
      // sr-only uses clip: rect(0,0,0,0)
      expect(clip).toMatch(/rect\(0/);
    }
  });
});

test.describe('sr-vic live parity — aria', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('choices group has an accessible label on both sides', async ({ page }) => {
    await openSrVicParityRoute(page);
    await assertChoicesGroupAccessibleLabel(page);
  });

  test('blank slot aria-label is "blank" on PIE side', async ({ page }) => {
    await openSrVicParityRoute(page);
    await assertBlankSlotAriaLabel(page);
  });

  test('blank slot has role="status" and aria-live="polite" on PIE side', async ({ page }) => {
    await openSrVicParityRoute(page);
    await assertBlankSlotAriaLive(page);
  });
});
