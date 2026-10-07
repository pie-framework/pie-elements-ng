/**
 * sel-r1-base.css gives each unclassed stem span the CQT's 150px token box.
 * An inline_sentence stem is prose, as in the Cambium SEL passage items, and the
 * box stacked it a word or two per line; token_sequence stems keep the box.
 */

import { type Page, expect, test } from '@playwright/test';
import { waitForMathRendering } from './test-helpers';

async function openDemo(page: Page, demoId: string) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(demoId)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

async function stemBox(page: Page, demoId: string) {
  await openDemo(page, demoId);
  return page.evaluate(() => {
    const line = document.querySelector('.pie-template-line') as HTMLElement;
    const slot = line.querySelector('.pie-blank-slot');
    const stem = [...line.querySelectorAll('span:not([class])')].find((s) => !slot?.contains(s));
    const { width, height } = (stem as HTMLElement).getBoundingClientRect();
    return {
      width,
      height,
      lineHeight: parseFloat(getComputedStyle(stem as HTMLElement).lineHeight),
    };
  });
}

test('an inline_sentence r1 stem stays on one line', async ({ page }) => {
  const stem = await stemBox(page, 'variant-sel-r1-g-inline-sentence');
  expect(stem.width).toBeGreaterThan(150);
  expect(stem.height).toBeLessThan(2 * stem.lineHeight);
});

test('a token_sequence r1 stem keeps the 150px token box', async ({ page }) => {
  const stem = await stemBox(page, 'variant-sel-r1-g-stem');
  expect(stem.width).toBe(150);
  expect(stem.lineHeight).toBe(89);
});

// The demo's choices differ in width, and an inline_sentence blank has no fixed size.
test('an inline_sentence blank and the choices below it hold still as choices fill it', async ({
  page,
}) => {
  await openDemo(page, 'variant-sel-r1-g-inline-sentence');
  const boxes = () =>
    page.evaluate(() =>
      ['.pie-blank-slot', '.pie-choices'].map((selector) => {
        const { x, y, width, height } = (
          document.querySelector(selector) as HTMLElement
        ).getBoundingClientRect();
        return [x, y, width, height].map(Math.round);
      })
    );
  const empty = await boxes();
  const radios = page.locator('.pie-choices input[type="radio"]');
  for (let i = 0; i < (await radios.count()); i++) {
    await radios.nth(i).check();
    expect(await boxes()).toEqual(empty);
  }
});
