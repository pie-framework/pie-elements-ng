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
  const sentenceTemplateDiff = Math.abs(templateBox!.y - sentenceBox!.y);
  expect(sentenceTemplateDiff).toBeLessThan(60);

  // Stimulus must be to the left of the blank slot.
  expect(sentenceBox!.x).toBeLessThan(templateBox!.x);

  // Audio must be to the right of the blank slot.
  expect(audioBox!.x).toBeGreaterThan(templateBox!.x);
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
  expect(fieldsetBox!.y).toBeGreaterThan(sentenceBox!.y + sentenceBox!.height - 10);
});

// ---------------------------------------------------------------------------
// Live side-by-side parity (requires LEARNOSITY_CONSUMER_KEY)
// ---------------------------------------------------------------------------

import { installAudioMock, triggerAudioEvent } from './audio-mock';

const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openS3ParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('s3 live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openS3ParityRoute(page);
    await expect(page.locator('#pie-container [role="radiogroup"]')).toBeVisible();
    await expect(page.locator('#learnosity-container [role="group"], #learnosity-container [role="radiogroup"]').first()).toBeVisible();
  });

  test('stimulus image, blank, and audio are on the same row on both sides', async ({ page }) => {
    await openS3ParityRoute(page);
    // PIE side: stimulus, blank, and audio container are vertically aligned
    const stimulus = page.locator('#pie-container .pie-stimulus-image, #pie-container [class*="stimulus"]').first();
    const blank = page.locator('#pie-container .pie-blank-slot').first();
    const audio = page.locator('#pie-container .pie-audio-container').first();
    await expect(stimulus).toBeVisible();
    await expect(blank).toBeVisible();
    await expect(audio).toBeVisible();
    const stimBox = await stimulus.boundingBox();
    const blankBox = await blank.boundingBox();
    const audioBox = await audio.boundingBox();
    expect(Math.abs(stimBox!.y - blankBox!.y)).toBeLessThan(60);
    expect(Math.abs(stimBox!.y - audioBox!.y)).toBeLessThan(60);
  });
});

test.describe('s3 live parity — aria', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('choices group has an accessible label on both sides', async ({ page }) => {
    await openS3ParityRoute(page);
    const pieGroup = page.locator('#pie-container [role="radiogroup"]');
    const pieLabelledBy = await pieGroup.getAttribute('aria-labelledby');
    const pieAriaLabel = await pieGroup.getAttribute('aria-label');
    expect(pieLabelledBy || pieAriaLabel).toBeTruthy();
    const lrnAriaLabel = await page.locator('#learnosity-container [role="group"], #learnosity-container [role="radiogroup"]').first().getAttribute('aria-label');
    expect(lrnAriaLabel).toBeTruthy();
  });

  test('blank slot aria-label is "blank" on PIE side', async ({ page }) => {
    await openS3ParityRoute(page);
    const label = await page.locator('#pie-container .pie-blank-slot').getAttribute('aria-label');
    expect(label).toBe('blank');
  });

  test('blank slot has role="status" and aria-live="polite" on PIE side', async ({ page }) => {
    await openS3ParityRoute(page);
    const blank = page.locator('#pie-container .pie-blank-slot');
    await expect(blank).toHaveAttribute('role', 'status');
    await expect(blank).toHaveAttribute('aria-live', 'polite');
  });

  test('audio silent image alt is "Repeat instructions" on PIE side', async ({ page }) => {
    await openS3ParityRoute(page);
    const alt = await page.locator('#pie-container .pie-listen-icon').first().getAttribute('alt');
    expect(alt).toBe('Repeat instructions');
  });
});

test.describe('s3 live parity — behavioral', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE audio button switches to playing image on play event', async ({ page }) => {
    await installAudioMock(page);
    await openS3ParityRoute(page);
    const silentImg = page.locator('#pie-container .pie-listen-icon').first();
    const playingImg = page.locator('#pie-container .pie-listen-icon').nth(1);
    await expect(silentImg).toHaveClass(/listen-active/);
    await triggerAudioEvent(page, 'play');
    await page.waitForTimeout(100);
    await expect(playingImg).toHaveClass(/listen-active/);
  });
});
