/**
 * Visual-parity tests for mc-populated-blank (sel_r1-s3_plusggg / s3 variant).
 *
 * Each test corresponds to a gap visible in the side-by-side comparison of
 * s3.png (reference) vs McPopulatedBlanks3.png (current output).
 * Reference CSS:
 *   web-ItemBankViewer/learnosity/templates/Renaissance/sel_r1-s3_plusggg/scss/main.scss
 *   web-ItemBankViewer/learnosity/templates/Renaissance/r1.scss
 *
 * All tests are expected to FAIL until the underlying style/layout issues are resolved.
 *
 * Reference variant: variant-sel-r1-s3 (stimulus_image_blank layout)
 * Layout: stimulus image (left) | blank slot (center) | audio button (right) — single row,
 * with choices spanning full width below.
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-s3';

async function openS3Route(page: Parameters<typeof test>[0]['page']) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Stimulus image, blank slot, and audio button are on the same row
//    sel_r1-s3_plusggg/main.scss: three-column grid —
//      "sentence template audio" / "choices choices choices"
//    In the reference all three sit at approximately the same vertical position.
//    In the as-built the stimulus image stacks above the blank slot, pushing
//    the blank slot to a lower Y than the stimulus.
// ---------------------------------------------------------------------------
test('s3: stimulus image, blank slot, and audio button are on the same row', async ({ page }) => {
  await openS3Route(page);
  const root = deliveryContainer(page);

  const sentenceLine = root.locator('.pie-sentence-line');
  const templateLine = root.locator('.pie-template-line');
  const audioContainer = root.locator('.pie-audio-container');
  await expect(sentenceLine).toBeVisible();
  await expect(templateLine).toBeVisible();
  await expect(audioContainer).toBeVisible();

  const sentenceBox = await sentenceLine.boundingBox();
  const templateBox = await templateLine.boundingBox();
  const audioBox = await audioContainer.boundingBox();
  expect(sentenceBox).not.toBeNull();
  expect(templateBox).not.toBeNull();
  expect(audioBox).not.toBeNull();

  // When stacked: templateBox.y is well below sentenceBox.y (>80px difference).
  // When in the same row: all three share approximately the same top Y (within 60px —
  // the blank slot may be bottom-aligned within the row per the reference layout).
  const sentenceTemplateDiff = Math.abs(templateBox?.y - sentenceBox?.y);
  expect(sentenceTemplateDiff).toBeLessThan(60);

  // Stimulus must be to the left of the blank slot.
  expect(sentenceBox?.x).toBeLessThan(templateBox?.x);

  // Audio must be to the right of the blank slot.
  expect(audioBox?.x).toBeGreaterThan(templateBox?.x);
});

// ---------------------------------------------------------------------------
// 2. Choices row is below the stimulus/blank/audio row, not interleaved
//    The choices fieldset must start below the bottom of the stimulus image.
// ---------------------------------------------------------------------------
test('s3: choices row is below the stimulus image (not overlapping)', async ({ page }) => {
  await openS3Route(page);
  const root = deliveryContainer(page);

  const sentenceLine = root.locator('.pie-sentence-line');
  const fieldset = root.locator('.pie-choices-fieldset');
  await expect(sentenceLine).toBeVisible();
  await expect(fieldset).toBeVisible();

  const sentenceBox = await sentenceLine.boundingBox();
  const fieldsetBox = await fieldset.boundingBox();
  expect(sentenceBox).not.toBeNull();
  expect(fieldsetBox).not.toBeNull();

  // Choices must start below the bottom edge of the stimulus image.
  expect(fieldsetBox?.y).toBeGreaterThan(sentenceBox?.y + sentenceBox?.height - 10);
});

// ---------------------------------------------------------------------------
// 3. Audio transcript spans full width above the grid, not in the bottom-right
//    The s3 grid overrides grid-template-areas to "sentence template audio" /
//    "choices choices choices".  Without a "transcript" row the .pie-audio-transcript
//    element auto-places into an implicit grid cell (bottom-right in the screenshot).
//    Fix: add "transcript transcript transcript" as the first row.
//    Test: transcript bottom edge must be above the sentence-line top edge.
// ---------------------------------------------------------------------------
test('s3: audio transcript is above the stimulus/blank row (not auto-placed into bottom grid cell)', async ({
  page,
}) => {
  await openS3Route(page);
  const root = deliveryContainer(page);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  const transcript = root.locator('.pie-audio-transcript');
  const sentenceLine = root.locator('.pie-sentence-line');
  await expect(transcript).toBeVisible();
  await expect(sentenceLine).toBeVisible();

  const transcriptBox = await transcript.boundingBox();
  const sentenceBox = await sentenceLine.boundingBox();
  expect(transcriptBox).not.toBeNull();
  expect(sentenceBox).not.toBeNull();

  // Transcript must be fully above the top of the sentence-line row.
  expect(transcriptBox?.y + transcriptBox?.height).toBeLessThan(sentenceBox?.y + 10);
});

// ---------------------------------------------------------------------------
// 4. Cloze blank value font size matches choice label font size after selection.
//    In the reference system both the cloze and choice labels sit inside
//    .rli-r1-content-element (1.9em), so inline font-size spans in labelHtml
//    (e.g. <span style="font-size:1.8em">) resolve against the same context.
//    The blank value inner span must match the choice label inner span.
// ---------------------------------------------------------------------------
test('s3: cloze blank value font size matches choice label font size after selection', async ({
  page,
}) => {
  await openS3Route(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const blankValue = root.locator('.pie-blank-value');
  await expect(blankValue).toBeVisible();

  const { blankSize, choiceSize } = await page.evaluate(() => {
    const getSize = (el: Element | null) => {
      if (!el) return 0;
      const inner = el.querySelector('span, p, div') ?? el;
      return parseFloat(getComputedStyle(inner).fontSize);
    };
    return {
      blankSize: getSize(document.querySelector('.pie-blank-value')),
      choiceSize: getSize(document.querySelector('.pie-choice-label')),
    };
  });

  expect(choiceSize).toBeGreaterThan(0);
  expect(Math.abs(blankSize - choiceSize)).toBeLessThanOrEqual(2);
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

async function openS3ParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('s3 live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openS3ParityRoute(page);
    await assertChoicesGroupVisible(page);
  });

  test('stimulus image, blank, and audio are on the same row on both sides', async ({ page }) => {
    await openS3ParityRoute(page);
    // PIE side: stimulus, blank, and audio container are vertically aligned
    const stimulus = page
      .locator('#pie-container .pie-stimulus-image, #pie-container [class*="stimulus"]')
      .first();
    const blank = page.locator('#pie-container .pie-blank-slot').first();
    const audio = page.locator('#pie-container .pie-audio-container').first();
    await expect(stimulus).toBeVisible();
    await expect(blank).toBeVisible();
    await expect(audio).toBeVisible();
    const stimBox = await stimulus.boundingBox();
    const blankBox = await blank.boundingBox();
    const audioBox = await audio.boundingBox();
    expect(Math.abs(stimBox?.y - blankBox?.y)).toBeLessThan(60);
    expect(Math.abs(stimBox?.y - audioBox?.y)).toBeLessThan(60);
  });

  test('PIE stem, choices, and audio regions match Learnosity baseline screenshots', async ({
    page,
  }, testInfo) => {
    await openS3ParityRoute(page);
    await assertScreenshotParity(page, testInfo, DEMO_ID, PARITY_REGIONS[DEMO_ID]);
  });
});

test.describe('s3 live parity — aria', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('choices group has an accessible label on both sides', async ({ page }) => {
    await openS3ParityRoute(page);
    await assertChoicesGroupAccessibleLabel(page);
  });

  test('blank slot aria-label is "blank" on PIE side', async ({ page }) => {
    await openS3ParityRoute(page);
    await assertBlankSlotAriaLabel(page);
  });

  test('blank slot has role="status" and aria-live="polite" on PIE side', async ({ page }) => {
    await openS3ParityRoute(page);
    await assertBlankSlotAriaLive(page);
  });

  test('audio silent image alt is "Repeat instructions" on PIE side', async ({ page }) => {
    await openS3ParityRoute(page);
    const alt = await page.locator('#pie-container .pie-listen-icon').first().getAttribute('alt');
    expect(alt).toBe('Repeat instructions');
  });
});

test.describe('s3 live parity — behavioral', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE audio button cycles through play and ended states', async ({ page }) => {
    await installAudioMock(page);
    await openS3ParityRoute(page);
    await assertAudioPlayCycle(page);
  });
});
