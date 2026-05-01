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
