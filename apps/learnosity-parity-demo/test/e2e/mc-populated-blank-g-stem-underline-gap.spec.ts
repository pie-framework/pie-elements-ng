/**
 * PIE-793: in text-only sel_r1-g_plusggg blanks the placed answer sits on its
 * underline beside the stem token. As in Learnosity (PIE-1128), the answer's
 * 150px content box is centred in the 160px cloze with an 8px bottom margin,
 * which lifts it 4px above the stem token, and the blank keeps one 160px box
 * whether empty or filled.
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

async function openDemo(page: Page, demoId: string) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(demoId)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

async function placeFirstChoice(page: Page) {
  await deliveryContainer(page).locator('input[type="radio"]').first().check();
  await page.waitForTimeout(150);
}

async function openWithFirstChoicePlaced(page: Page, demoId: string) {
  await openDemo(page, demoId);
  await placeFirstChoice(page);
}

/** Glyph boxes of the stem token and the placed answer, and the top of the underline. */
function measure(page: Page) {
  return page.evaluate(() => {
    const glyphBox = (root: Element) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let text = walker.nextNode();
      while (text && !text.textContent?.trim()) text = walker.nextNode();
      const range = document.createRange();
      range.selectNodeContents(text as Text);
      return range.getBoundingClientRect();
    };
    const line = document.querySelector('.pie-template-line') as HTMLElement;
    const slot = line.querySelector('.pie-blank-slot') as HTMLElement;
    const stem = [...line.querySelectorAll('span:not([class])')].find((s) => !slot.contains(s));
    return {
      stemBottom: glyphBox(stem as Element).bottom,
      answerBottom: glyphBox(slot.querySelector('.pie-blank-value') as Element).bottom,
      underlineTop:
        slot.getBoundingClientRect().bottom - parseFloat(getComputedStyle(slot).borderBottomWidth),
    };
  });
}

for (const demoId of ['variant-sel-r1-g-stem', 'variant-sel-r1-g-stem-es']) {
  test(`${demoId}: the placed answer sits on its underline`, async ({ page }) => {
    await openWithFirstChoicePlaced(page, demoId);
    const { answerBottom, underlineTop } = await measure(page);
    // ~26px; ~79px when the answer sits at the top of a 156px box.
    expect(underlineTop - answerBottom).toBeLessThan(30);
  });

  test(`${demoId}: the placed answer sits 4px above the stem token`, async ({ page }) => {
    await openWithFirstChoicePlaced(page, demoId);
    const { answerBottom, stemBottom } = await measure(page);
    expect(stemBottom - answerBottom).toBeCloseTo(4, 0);
  });
}

test('variant-sel-r1-g-stem-graphic: the image blank keeps its 160px box, empty and filled', async ({
  page,
}) => {
  await openDemo(page, 'variant-sel-r1-g-stem-graphic');
  const slotHeight = () =>
    deliveryContainer(page)
      .locator('.pie-blank-slot')
      .evaluate((el) => el.getBoundingClientRect().height);
  expect(await slotHeight()).toBe(160);
  await placeFirstChoice(page);
  expect(await slotHeight()).toBe(160);
});
