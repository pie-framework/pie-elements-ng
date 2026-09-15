/**
 * Regression test for CONTOOL-3159 (item 021a4255-c675-43a2-8b4f-94e2768143a2).
 *
 * The item is an all-text sel_r1-s3_plusggg (stimulus_image_blank) item: the stem
 * ("9, 8,") is a flattened image in .pie-sentence-line, and the blank's selected
 * choice ("7") carries an author font-size override (font-size:3em) via an unclassed
 * <span> in labelHtml — the exact shape real Learnosity data uses.
 *
 * Root cause, part 1: cqt-css/sel-r1-base.css's `.pie-template-line span:not([class])`
 * rule (mirroring Learnosity's .rli-r1-content-element box for stem tokens) has no
 * depth limit, so it also matches the unclassed <span> ClozeMarker.svelte renders for
 * the *selected answer* inside .pie-blank-value, forcing it to min-height:150px;
 * line-height:89px. A plain (non-flex) span renders that single line top-anchored
 * when min-height exceeds its natural line height, pinning the answer text near the
 * top of the blank with a large gap below it.
 *
 * Root cause, part 2: question.css's `.rli-s3-cloze-container { justify-content:end }`
 * bottom-anchors the answer text against the underline — it does not center it.
 * ClozeMarker.svelte's shared `.cloze-marker { align-items:center }` rule centers
 * instead, which (once part 1 is fixed and the text renders at its natural size)
 * still leaves it floating above the underline instead of sitting right above it,
 * matching where the sentence image's own (bottom-anchored) content sits.
 *
 * Expected fix: the selected answer's text sits flush against the bottom of the
 * blank (right above the underline), not centered or pinned to the top.
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-s3-cloze-baseline';

async function openClozeBaselineRoute(page: Page) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

async function selectChoiceAndMeasure(page: Page) {
  const root = deliveryContainer(page);
  await root.locator('input[type="radio"]').nth(1).check(); // distractor_2 ("7")
  await page.waitForTimeout(150);

  return page.evaluate(() => {
    const blankSlot = document.querySelector('.pie-blank-slot') as HTMLElement;
    const valueSpan = document.querySelector('.pie-blank-value span') as HTMLElement;
    const textNode = valueSpan.firstChild as Text;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const glyphRect = range.getBoundingClientRect();
    const slotRect = blankSlot.getBoundingClientRect();

    // The "content box" excludes the underline border and its padding — the space
    // the answer text should be centered within.
    const borderBottomWidth = parseFloat(getComputedStyle(blankSlot).borderBottomWidth);
    const paddingBottom = parseFloat(getComputedStyle(blankSlot).paddingBottom);
    const contentBottom = slotRect.bottom - borderBottomWidth - paddingBottom;

    return {
      slotTop: slotRect.top,
      contentBottom,
      glyphTop: glyphRect.top,
      glyphBottom: glyphRect.bottom,
    };
  });
}

test('cloze-baseline: selected answer text sits flush against the bottom of the blank, not centered or pinned to the top', async ({
  page,
}) => {
  await openClozeBaselineRoute(page);

  const { contentBottom, glyphBottom } = await selectChoiceAndMeasure(page);

  const gapBelow = contentBottom - glyphBottom;

  // Pre-fix (part 1): the answer span was forced top-anchored by an overreaching CSS
  // selector (gapBelow ~60px). Pre-fix (part 2): centering left it floating ~35-50px
  // above the underline instead of flush against it. Fixed: gapBelow ~0-2px.
  expect(gapBelow).toBeLessThan(10);
});
