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
  const verticalDiff = Math.abs(templateBox!.y - audioBox!.y);
  expect(verticalDiff).toBeLessThan(20);

  // And they must not overlap horizontally — template is left of audio.
  expect(templateBox!.x).toBeLessThan(audioBox!.x);
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
  const verticalOffset = blankBox!.y - templateBox!.y;
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
  expect(box!.width).toBeLessThanOrEqual(800);
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
// 8. Audio transcript is visible (showVisibleTranscript: true for sel-vic)
//    sel_vic/main.scss: .rli-with-audio-transcript .rli-vic-audio-transcript { display: flex }
//    The sel-vic model has showVisibleTranscript: true, so the transcript must
//    be visible (not sr-only hidden).
// ---------------------------------------------------------------------------
test('sel-vic: audio transcript is visible when showVisibleTranscript is true', async ({
  page,
}) => {
  await openSelVicRoute(page);
  const root = deliveryContainer(page);

  const transcript = root.locator('.pie-audio-transcript');
  await expect(transcript).toBeVisible();
});
