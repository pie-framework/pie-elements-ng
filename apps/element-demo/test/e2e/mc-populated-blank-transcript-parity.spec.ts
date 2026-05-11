/**
 * Transcript visibility parity tests for mc-populated-blank.
 *
 * Reference: web-ItemBankViewer/learnosity/templates/Renaissance/sel_r1-_plusggg/
 * The reference renders the transcript text when .rli-with-audio-transcript is
 * present on an ancestor element — not via a model flag.
 *
 * Transcript visibility is driven entirely by the player-level ancestor class.
 * There is no model-flag path — showVisibleTranscript on the model is ignored.
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-plusggg';
const TRANSCRIPT_TEXT = 'The word is look. Pick the correct spelling of the word look.';

async function openRoute(page: Parameters<typeof test>[0]['page'], demo = DEMO_ID) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(demo)}&player=esm`
  );
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// rli-with-audio-transcript ancestor class trigger (the bug case)
// ---------------------------------------------------------------------------

test('plusggg: transcript is sr-only without rli-with-audio-transcript ancestor', async ({
  page,
}) => {
  await openRoute(page);
  const root = deliveryContainer(page);
  const transcript = root.locator('.pie-audio-transcript');
  await expect(transcript).toBeAttached();
  await expect(transcript).toHaveClass(/sr-only/);
});

test('plusggg: adding rli-with-audio-transcript to ancestor makes transcript visible', async ({
  page,
}) => {
  await openRoute(page);
  const root = deliveryContainer(page);
  const transcript = root.locator('.pie-audio-transcript');

  // Baseline: hidden
  await expect(transcript).toHaveClass(/sr-only/);

  // Add the class to the .demo-element-player ancestor (same as the toolbar checkbox does)
  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  await expect(transcript).not.toHaveClass(/sr-only/);
  await expect(transcript).toBeVisible();
});

test('plusggg: removing rli-with-audio-transcript from ancestor hides transcript again', async ({
  page,
}) => {
  await openRoute(page);
  const root = deliveryContainer(page);
  const transcript = root.locator('.pie-audio-transcript');

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });
  await expect(transcript).not.toHaveClass(/sr-only/);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.remove('rli-with-audio-transcript');
  });
  await expect(transcript).toHaveClass(/sr-only/);
});

test('plusggg: transcript contains the correct text when made visible via ancestor class', async ({
  page,
}) => {
  await openRoute(page);
  const root = deliveryContainer(page);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  const transcript = root.locator('.pie-audio-transcript');
  await expect(transcript).toContainText(TRANSCRIPT_TEXT);
});

// ---------------------------------------------------------------------------
// Visible transcript layout assertions (ancestor class path)
// ---------------------------------------------------------------------------

test('plusggg: transcript is visible when rli-with-audio-transcript is on an ancestor', async ({
  page,
}) => {
  await openRoute(page);
  const root = deliveryContainer(page);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  const transcript = root.locator('.pie-audio-transcript');
  await expect(transcript).toBeVisible();
  await expect(transcript).not.toHaveClass(/sr-only/);
});

test('plusggg: transcript text is center-aligned when visible', async ({ page }) => {
  await openRoute(page);
  const root = deliveryContainer(page);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  const transcript = root.locator('.pie-audio-transcript');
  await expect(transcript).toHaveCSS('text-align', 'center');
});

test('plusggg: transcript renders above the choice tiles when visible', async ({ page }) => {
  await openRoute(page);
  const root = deliveryContainer(page);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  const transcript = root.locator('.pie-audio-transcript');
  const firstChoice = root.locator('.pie-choice').first();

  const transcriptBox = await transcript.boundingBox();
  const choiceBox = await firstChoice.boundingBox();

  expect(transcriptBox).not.toBeNull();
  expect(choiceBox).not.toBeNull();
  expect(transcriptBox!.y + transcriptBox!.height).toBeLessThan(choiceBox!.y);
});

// ---------------------------------------------------------------------------
// Cross-variant: transcript hidden by default, revealed by rli-with-audio-transcript
// Covers all variants that have audio + a transcript string.
// ---------------------------------------------------------------------------

// sr-vic is excluded: it has no audio component and therefore no transcript.
// Only SEL variants have audio + transcript.
const AUDIO_TRANSCRIPT_VARIANTS: Array<{ demoId: string; label: string }> = [
  { demoId: 'variant-sel-r1-plusggg', label: 'plusggg' },
  { demoId: 'variant-sel-vic', label: 'sel-vic' },
  { demoId: 'variant-sel-r1-gplusggg', label: 'gplusggg' },
  { demoId: 'variant-sel-r1-g-stem', label: 'g-stem' },
  { demoId: 'variant-sel-r1-gg-plus', label: 'gg-plus' },
  { demoId: 'variant-sel-r1-ggplus', label: 'ggplus' },
  { demoId: 'variant-sel-r1-s3', label: 's3' },
  { demoId: 'variant-sel-r1-plusggg-graphic', label: 'plusggg-graphic' },
  { demoId: 'variant-sel-r1-gplusggg-graphic', label: 'gplusggg-graphic' },
  { demoId: 'variant-sel-r1-gg-plus-graphic', label: 'gg-plus-graphic' },
  { demoId: 'variant-sel-r1-ggplus-graphic', label: 'ggplus-graphic' },
  { demoId: 'variant-sel-r1-g-stem-graphic', label: 'g-stem-graphic' },
  { demoId: 'variant-sel-r1-s3-graphic', label: 's3-graphic' },
];

for (const { demoId, label } of AUDIO_TRANSCRIPT_VARIANTS) {
  test(`${label}: transcript is sr-only by default (no rli-with-audio-transcript ancestor)`, async ({
    page,
  }) => {
    await openRoute(page, demoId);
    const transcript = deliveryContainer(page).locator('.pie-audio-transcript');
    await expect(transcript).toBeAttached();
    await expect(transcript).toHaveClass(/sr-only/);
  });

  test(`${label}: transcript becomes visible when rli-with-audio-transcript is added to an ancestor`, async ({
    page,
  }) => {
    await openRoute(page, demoId);
    const transcript = deliveryContainer(page).locator('.pie-audio-transcript');

    await expect(transcript).toHaveClass(/sr-only/);

    await page.evaluate(() => {
      document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
    });

    await expect(transcript).not.toHaveClass(/sr-only/);
    await expect(transcript).toBeVisible();
  });

  test(`${label}: transcript returns to sr-only when rli-with-audio-transcript is removed`, async ({
    page,
  }) => {
    await openRoute(page, demoId);
    const transcript = deliveryContainer(page).locator('.pie-audio-transcript');

    await page.evaluate(() => {
      document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
    });
    await expect(transcript).not.toHaveClass(/sr-only/);

    await page.evaluate(() => {
      document.querySelector('.demo-element-player')?.classList.remove('rli-with-audio-transcript');
    });
    await expect(transcript).toHaveClass(/sr-only/);
  });

  test(`${label}: transcript top is at or above all other question content when visible`, async ({
    page,
  }) => {
    await openRoute(page, demoId);
    const root = deliveryContainer(page);

    await page.evaluate(() => {
      document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
    });

    const transcript = root.locator('.pie-audio-transcript');
    await expect(transcript).toBeVisible();

    const transcriptBox = await transcript.boundingBox();
    expect(transcriptBox).not.toBeNull();

    // The transcript must be the topmost element — its top Y must be at or above
    // all other visible content. The audio container may share the same grid row
    // (token_sequence: 'transcript audio'), so we allow it to start above the
    // transcript bottom but not above the transcript top.
    const otherSelectors = ['.pie-template-line', '.pie-choices-fieldset', '.pie-sentence-line'];
    for (const sel of otherSelectors) {
      const el = root.locator(sel).first();
      if (!(await el.isVisible())) continue;
      const box = await el.boundingBox();
      if (!box) continue;
      expect(box.y).toBeGreaterThanOrEqual(transcriptBox!.y - 5);
    }
  });

  test(`${label}: transcript region matches committed snapshot when visible`, async ({ page }) => {
    await openRoute(page, demoId);
    const root = deliveryContainer(page);

    await page.evaluate(() => {
      document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
    });

    const transcript = root.locator('.pie-audio-transcript');
    await expect(transcript).toBeVisible();
    await expect(transcript).toHaveScreenshot(`pie-${demoId}-transcript.png`);
  });
}
