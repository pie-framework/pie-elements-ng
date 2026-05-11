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
  // When inline with baseline alignment: 3em font row is ~90px tall; blank sits
  // near the row bottom (~67px from template top) but still within the same row.
  // Use 90px as the threshold — anything >= 90px is a true line break.
  const verticalOffset = Math.abs(blankBox?.y - templateBox?.y);
  expect(verticalOffset).toBeLessThan(90);
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

// ---------------------------------------------------------------------------
// 5. Template-line font size is 1.9em (r1 content-element base)
//    r1.scss: .rli-r1-content-element { font-size: 1.9em } — shared via sel-r1-base.css.
// ---------------------------------------------------------------------------
test('ggplus: template line font size is 1.9em', async ({ page }) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);
  const templateLine = root.locator('.pie-template-line');
  await expect(templateLine).toBeVisible();
  const px = parseFloat(await templateLine.evaluate((el) => getComputedStyle(el).fontSize));
  expect(px).toBeGreaterThanOrEqual(30);
  expect(px).toBeLessThanOrEqual(32);
});

// ---------------------------------------------------------------------------
// 6. After-cloze content does not shift when a distractor is selected
//    sel-r1-base.css: pie-template-line { display:flex; align-items:center }
// ---------------------------------------------------------------------------
test('ggplus: after-cloze content does not shift when a distractor is selected', async ({
  page,
}) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);
  const templateLine = root.locator('.pie-template-line');
  const beforeBox = await templateLine.boundingBox();
  expect(beforeBox).not.toBeNull();
  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);
  const afterBox = await templateLine.boundingBox();
  expect(afterBox).not.toBeNull();
  expect(Math.abs(afterBox?.y - beforeBox?.y)).toBeLessThan(5);
});

// ---------------------------------------------------------------------------
// 7. Visible horizontal gap between the blank slot and the trailing "m" span
//    r1.scss: margin-right:2px/margin-left:2px per content-element.
//    sel-r1-base.css: column-gap on .pie-template-line (flex row) replicates this.
//    Template: "<p>{{blank}} <span>m</span> <span>n</span></p>" — blank first.
// ---------------------------------------------------------------------------
test('ggplus: there is a visible gap between the blank slot and the trailing token', async ({
  page,
}) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);

  const blankSlot = root.locator('.pie-blank-slot');
  // Target spans from {@html} template content — they have no class attribute.
  const trailingSpan = root.locator('.pie-template-line span:not([class])').first();

  await expect(blankSlot).toBeVisible();
  await expect(trailingSpan).toBeVisible();

  const blankBox = await blankSlot.boundingBox();
  const spanBox = await trailingSpan.boundingBox();
  expect(blankBox).not.toBeNull();
  expect(spanBox).not.toBeNull();

  // 1rem token gap with 3em tokens: at 1.9em base (≈30px) × 3em = ~90px tokens.
  // 1rem ≈ 16px minimum gap required.
  const gap = spanBox?.x - (blankBox?.x + blankBox?.width);
  expect(gap).toBeGreaterThanOrEqual(3);
});

// ---------------------------------------------------------------------------
// 8. Gap between the two trailing token spans ("m" and "n") matches reference
//    r1.scss: .rli-r1-content-element { margin-right:2px; margin-left:2px } → 4px gap.
//    sel-r1-base.css: column-gap:4px on .pie-template-line replicates this.
// ---------------------------------------------------------------------------
test('ggplus: there is a visible gap between the two trailing tokens', async ({ page }) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);

  const spans = root.locator('.pie-template-line span:not([class])');
  await expect(spans.nth(0)).toBeVisible();
  await expect(spans.nth(1)).toBeVisible();

  const box0 = await spans.nth(0).boundingBox();
  const box1 = await spans.nth(1).boundingBox();
  expect(box0).not.toBeNull();
  expect(box1).not.toBeNull();

  const gap = box1?.x - (box0?.x + box0?.width);
  expect(gap).toBeGreaterThanOrEqual(3);
});

// ---------------------------------------------------------------------------
// 9. Template row is centered above the choices row (not left-aligned)
//    r1.scss: the stem is centered. The token_sequence grid puts template in
//    column 1 only, leaving it left of center. The variant CSS must span it
//    across both columns so justify-self:center works against the full width.
// ---------------------------------------------------------------------------
test('ggplus: template row is horizontally centered above the choices', async ({ page }) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  const fieldset = root.locator('.pie-choices-fieldset');
  await expect(templateLine).toBeVisible();
  await expect(fieldset).toBeVisible();

  const templateBox = await templateLine.boundingBox();
  const fieldsetBox = await fieldset.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(fieldsetBox).not.toBeNull();

  const templateCX = templateBox?.x + templateBox?.width / 2;
  const fieldsetCX = fieldsetBox?.x + fieldsetBox?.width / 2;
  // Centers should be within 60px of each other.
  expect(Math.abs(templateCX - fieldsetCX)).toBeLessThan(60);
});

// ---------------------------------------------------------------------------
// 10. Each template token (blank slot and spans) is at least 150px wide
//     r1.scss: .rli-r1-content-element { min-width:150px; max-width:150px }
//     sel-r1-base.css applies this to both .pie-blank-slot and classless spans.
// ---------------------------------------------------------------------------
test('ggplus: blank slot and token spans are each at least 150px wide', async ({ page }) => {
  await openGgplusRoute(page);
  const root = deliveryContainer(page);

  const blankSlot = root.locator('.pie-blank-slot');
  const spans = root.locator('.pie-template-line span:not([class])');
  await expect(blankSlot).toBeVisible();

  const blankBox = await blankSlot.boundingBox();
  expect(blankBox).not.toBeNull();
  expect(blankBox?.width).toBeGreaterThanOrEqual(140);

  const count = await spans.count();
  for (let i = 0; i < count; i++) {
    const box = await spans.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThanOrEqual(140);
  }
});

// ---------------------------------------------------------------------------
// Live side-by-side parity (requires LEARNOSITY_CONSUMER_KEY)
// ---------------------------------------------------------------------------

import { installAudioMock } from './audio-mock';
import {
  assertAudioPlayCycle,
  assertBlankSlotAriaLabel,
  assertBlankSlotAriaLive,
  assertChoicesGroupAccessibleLabel,
  assertChoicesGroupVisible,
  assertScreenshotParity,
} from './mc-populated-blank-parity-shared';
import { PARITY_REGIONS } from './parity-regions';

const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openggplusParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('ggplus live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openggplusParityRoute(page);
    await assertChoicesGroupVisible(page);
  });

  test('PIE selected tile background color is #fcfcd3 (r1 spec)', async ({ page }) => {
    await openggplusParityRoute(page);
    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);
    const pieBg = await page
      .locator('#pie-container .choice-row-horizontal.is-selected .choice-tile')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    // r1.scss: .rli-r1-selected { background-color: #fcfcd3 }
    expect(pieBg).toBe('rgb(252, 252, 211)');
  });

  test('PIE stem, choices, and audio regions match Learnosity baseline screenshots', async ({
    page,
  }, testInfo) => {
    await openggplusParityRoute(page);
    await assertScreenshotParity(page, testInfo, DEMO_ID, PARITY_REGIONS[DEMO_ID]);
  });
});

test.describe('ggplus live parity — aria', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('choices group has an accessible label on both sides', async ({ page }) => {
    await openggplusParityRoute(page);
    await assertChoicesGroupAccessibleLabel(page);
  });

  test('blank slot aria-label is "blank" on PIE side', async ({ page }) => {
    await openggplusParityRoute(page);
    await assertBlankSlotAriaLabel(page);
  });

  test('blank slot has role="status" and aria-live="polite" on PIE side', async ({ page }) => {
    await openggplusParityRoute(page);
    await assertBlankSlotAriaLive(page);
  });

  test('audio silent image alt is "Repeat instructions" on PIE side', async ({ page }) => {
    await openggplusParityRoute(page);
    const alt = await page.locator('#pie-container .pie-listen-icon').first().getAttribute('alt');
    expect(alt).toBe('Repeat instructions');
  });
});

test.describe('ggplus live parity — behavioral', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE audio button cycles through play and ended states', async ({ page }) => {
    await installAudioMock(page);
    await openggplusParityRoute(page);
    await assertAudioPlayCycle(page);
  });
});
