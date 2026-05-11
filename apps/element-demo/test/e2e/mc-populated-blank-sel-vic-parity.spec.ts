/**
 * Visual-parity tests for mc-populated-blank (sel-vic variant).
 *
 * Each test corresponds to a gap visible in the side-by-side comparison of
 * sel_vic_reference.png (reference) vs McPopulatedBlankSelVic.png (current output).
 * Reference CSS:
 *   web-ItemBankViewer/learnosity/templates/Renaissance/sel_vic/scss/main.scss
 *   web-ItemBankViewer/learnosity/templates/Renaissance/vic.scss
 *
 * All tests are expected to FAIL until the underlying style/layout issues are resolved.
 *
 * Reference variant: variant-sel-vic (inline_sentence layout, has audio, vertical choices)
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-vic';

async function openSelVicRoute(page: Parameters<typeof test>[0]['page']) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// 1. Template and audio button are side-by-side (two-column grid)
//    sel_vic/main.scss: .sel-vic { display: grid; grid-template-columns: 75% 25% }
//    Currently the audio container stacks above the template (vertical layout).
//    In the reference both sit on the same row: sentence left ~75%, audio right ~25%.
// ---------------------------------------------------------------------------
test('sel-vic: template sentence and audio button are on the same row (two-column grid)', async ({
  page,
}) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  const audioContainer = root.locator('.pie-audio-container');
  await expect(templateLine).toBeVisible();
  await expect(audioContainer).toBeVisible();

  const templateBox = await templateLine.boundingBox();
  const audioBox = await audioContainer.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(audioBox).not.toBeNull();

  // When stacked: audioBox.y is noticeably above templateBox.y (audio renders first).
  // When side-by-side: both share approximately the same top Y (within 20px).
  const verticalDiff = Math.abs(templateBox?.y - audioBox?.y);
  expect(verticalDiff).toBeLessThan(20);

  // And they must not overlap horizontally — template is left of audio.
  expect(templateBox?.x).toBeLessThan(audioBox?.x);
});

// ---------------------------------------------------------------------------
// 2. Template sentence and blank slot are on the same line (no line break)
//    vic.scss: .rli-vic-answer uses inline flex — the <p> tag wrapping the
//    template text must not break to a new line before the blank slot.
//    Same root cause as sr-vic: <p> defaults to display:block.
// ---------------------------------------------------------------------------
test('sel-vic: blank slot stays inline within the template sentence (no line break)', async ({
  page,
}) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  const blankSlot = root.locator('.pie-blank-slot');
  await expect(templateLine).toBeVisible();
  await expect(blankSlot).toBeVisible();

  const templateBox = await templateLine.boundingBox();
  const blankBox = await blankSlot.boundingBox();
  expect(templateBox).not.toBeNull();
  expect(blankBox).not.toBeNull();

  // When blank wraps to a new line its top Y is significantly below the template top.
  // When inline both start at the same Y (within 10px).
  const verticalOffset = blankBox?.y - templateBox?.y;
  expect(verticalOffset).toBeLessThan(10);
});

// ---------------------------------------------------------------------------
// 3. Filled blank value text is red (#cc3333)
//    vic.scss: .rli-vic-cloze > .rli-vic-content-element { color: #cc3333 }
//    sel-vic inherits vic.scss. The filled-in answer text must be red.
//    Currently sel-vic.css has no color rule for .pie-blank-value.
// ---------------------------------------------------------------------------
test('sel-vic: filled blank value text color is #cc3333 (red)', async ({ page }) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const blankValue = root.locator('.pie-blank-value');
  await expect(blankValue).toBeVisible();

  await expect(blankValue).toHaveCSS('color', 'rgb(204, 51, 51)');
});

// ---------------------------------------------------------------------------
// 4. Choice rows are left-aligned with constrained width
//    sel_vic/main.scss: .sel-vic { max-width: 800px; margin: auto } and
//    vic.scss: .rli-vic-distractors { display: flex; flex-direction: column }
//    with .rli-vic-distractor { flex-direction: row-reverse; justify-content: start }
//    The choices fieldset should be no wider than 800px and left-aligned within
//    the constrained container.
//    Currently choice rows span the full viewport width.
// ---------------------------------------------------------------------------
test('sel-vic: choices fieldset width is at most 800px', async ({ page }) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  const fieldset = root.locator('.pie-choices-fieldset');
  await expect(fieldset).toBeVisible();

  const box = await fieldset.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width).toBeLessThanOrEqual(800);
});

// ---------------------------------------------------------------------------
// 5. Choice label text is left-aligned
//    vic.scss: .rli-vic-distractor { flex-direction: row-reverse; justify-content: start }
//    places radio on the right and text on the left — text is left-aligned.
//    Currently .choice-html uses text-align: center and justify-content: center.
// ---------------------------------------------------------------------------
test('sel-vic: choice label text is left-aligned', async ({ page }) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  const firstLabel = root
    .locator('.pie-choice:not(.pie-choice-horizontal) .pie-choice-label')
    .first();
  await expect(firstLabel).toBeVisible();

  const textAlign = await firstLabel.evaluate((el) => getComputedStyle(el).textAlign);
  expect(['left', 'start']).toContain(textAlign);
});

// ---------------------------------------------------------------------------
// 6. Selected choice row has full-width yellow background (#fcfcd3)
//    vic.scss: .rli-vic-selected { background-color: #fcfcd3 } on the row element.
//    Currently background is applied only to .pie-choice-label-wrap.
// ---------------------------------------------------------------------------
test('sel-vic: selected choice row has full-width yellow background (#fcfcd3)', async ({
  page,
}) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedRow = root.locator('.pie-choice.is-selected').first();
  await expect(selectedRow).toBeVisible();

  await expect(selectedRow).toHaveCSS('background-color', 'rgb(252, 252, 211)');
});

// ---------------------------------------------------------------------------
// 7. Hover background is applied to the full choice row (#f2f2f2)
//    vic.scss: .rli-vic-distractor:hover { background-color: #F2F2F2 } on the row.
//    Currently hover applies only to the inner .pie-choice-label-wrap with #ececec.
// ---------------------------------------------------------------------------
test('sel-vic: hovered unselected choice row background is #f2f2f2', async ({ page }) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

  const firstRow = root.locator('.pie-choice:not(.pie-choice-horizontal)').first();
  await expect(firstRow).toBeVisible();

  await firstRow.hover();
  await page.waitForTimeout(100);

  await expect(firstRow).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});

// ---------------------------------------------------------------------------
// 8. Audio transcript is sr-only by default; revealed by rli-with-audio-transcript
//    sel_vic/main.scss: .rli-with-audio-transcript .rli-vic-audio-transcript { display: flex }
//    The transcript is hidden until an ancestor carries .rli-with-audio-transcript.
// ---------------------------------------------------------------------------
test('sel-vic: audio transcript is sr-only by default', async ({ page }) => {
  await openSelVicRoute(page);
  const transcript = deliveryContainer(page).locator('.pie-audio-transcript');
  await expect(transcript).toBeAttached();
  await expect(transcript).toHaveClass(/sr-only/);
});

test('sel-vic: audio transcript becomes visible when rli-with-audio-transcript is added to an ancestor', async ({
  page,
}) => {
  await openSelVicRoute(page);
  const transcript = deliveryContainer(page).locator('.pie-audio-transcript');
  await expect(transcript).toHaveClass(/sr-only/);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  await expect(transcript).not.toHaveClass(/sr-only/);
  await expect(transcript).toBeVisible();
});

// ---------------------------------------------------------------------------
// 9. Audio transcript renders above the two-column grid (outside and above the
//    audio button / sentence row), not inside it.
//    Reference: sel_vic/src/question/index.js renders audioTranscript.render()
//    *before* the .sel-vic grid div, so it spans full width above both columns.
//    Currently the transcript may be placed inside the grid column alongside the
//    audio button, which means its bottom edge is at the same level as or below
//    the audio container's top edge.
// ---------------------------------------------------------------------------
test('sel-vic: audio transcript renders above the audio button (outside the two-column grid)', async ({
  page,
}) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  await page.evaluate(() => {
    document.querySelector('.demo-element-player')?.classList.add('rli-with-audio-transcript');
  });

  const transcript = root.locator('.pie-audio-transcript');
  const audioContainer = root.locator('.pie-audio-container');
  await expect(transcript).toBeVisible();
  await expect(audioContainer).toBeVisible();

  const transcriptBox = await transcript.boundingBox();
  const audioBox = await audioContainer.boundingBox();
  expect(transcriptBox).not.toBeNull();
  expect(audioBox).not.toBeNull();

  // Transcript bottom edge must be above the audio container top edge.
  expect(transcriptBox?.y + transcriptBox?.height).toBeLessThan(audioBox?.y);
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

async function openSelVicParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('sel-vic live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openSelVicParityRoute(page);
    await assertChoicesGroupVisible(page);
  });

  test('filled blank value is red (#cc3333) on PIE side', async ({ page }) => {
    await openSelVicParityRoute(page);
    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);
    const color = await page
      .locator('#pie-container .pie-blank-value')
      .first()
      .evaluate((el) => getComputedStyle(el).color);
    expect(color).toBe('rgb(204, 51, 51)');
  });

  test('transcript becomes visible on both sides when rli-with-audio-transcript is added to an ancestor', async ({
    page,
  }) => {
    await openSelVicParityRoute(page);
    await expect(page.locator('#pie-container .pie-audio-transcript')).toHaveClass(/sr-only/);

    await page.evaluate(() => {
      document.querySelector('#pie-container')?.classList.add('rli-with-audio-transcript');
      document.querySelector('#learnosity-container')?.classList.add('rli-with-audio-transcript');
    });

    await expect(page.locator('#pie-container .pie-audio-transcript')).not.toHaveClass(/sr-only/);
    const lrnTranscript = page
      .locator(
        '#learnosity-container [class*="audio-transcript"], #learnosity-container [class*="rli-vic-audio-transcript"]'
      )
      .first();
    await expect(lrnTranscript).toBeVisible();
  });

  test('PIE stem and choices regions match Learnosity baseline screenshots', async ({
    page,
  }, testInfo) => {
    await openSelVicParityRoute(page);
    await assertScreenshotParity(page, testInfo, DEMO_ID, PARITY_REGIONS[DEMO_ID]);
  });
});

test.describe('sel-vic live parity — aria', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('choices group has an accessible label on both sides', async ({ page }) => {
    await openSelVicParityRoute(page);
    await assertChoicesGroupAccessibleLabel(page);
  });

  test('blank slot aria-label is "blank" on PIE side', async ({ page }) => {
    await openSelVicParityRoute(page);
    await assertBlankSlotAriaLabel(page);
  });

  test('blank slot has role="status" and aria-live="polite" on PIE side', async ({ page }) => {
    await openSelVicParityRoute(page);
    await assertBlankSlotAriaLive(page, { expectAriaAtomic: true });
  });
});

test.describe('sel-vic live parity — behavioral', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE audio button cycles through play and ended states', async ({ page }) => {
    await installAudioMock(page);
    await openSelVicParityRoute(page);
    await assertAudioPlayCycle(page);
  });
});
