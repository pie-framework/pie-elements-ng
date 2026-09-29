/**
 * With the Listen button, inline_sentence lays out as a grid. What renders before
 * the stem, the Cambium SEL passage in the prompt and the show-correct-answer
 * toggle, takes the full-width row above it, and an `iat-align-center` title is
 * centred.
 */

import { type Page, expect, test } from '@playwright/test';
import { waitForMathRendering } from './test-helpers';

const DEMO = 'variant-sel-r1-g-inline-sentence-audio';

async function open(page: Page, mode: 'gather' | 'evaluate') {
  const role = mode === 'gather' ? 'student' : 'instructor';
  await page.goto(`/mc-populated-blank/deliver?mode=${mode}&role=${role}&demo=${DEMO}&player=esm`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector(`[data-testid="role-${role}"]`, { timeout: 20_000 });
  await waitForMathRendering(page);
}

async function boxes(page: Page, selectors: Record<string, string>) {
  return page.evaluate((entries) => {
    const out: Record<string, { top: number; bottom: number; left: number; right: number }> = {};
    for (const [key, selector] of Object.entries(entries)) {
      const { top, bottom, left, right } = (
        document.querySelector(selector) as HTMLElement
      ).getBoundingClientRect();
      out[key] = { top, bottom, left, right };
    }
    return out;
  }, selectors);
}

test('an inline_sentence passage sits above the stem, its title centred', async ({ page }) => {
  await open(page, 'gather');
  const layout = await boxes(page, {
    prompt: '.pie-prompt',
    template: '.pie-template-line',
    audio: '.pie-audio-container',
  });
  const titleAlign = await page
    .locator('.pie-prompt .iat-align-center')
    .evaluate((el) => getComputedStyle(el).textAlign);

  expect(layout.prompt.bottom).toBeLessThanOrEqual(layout.template.top);
  expect(layout.prompt.left).toBeLessThanOrEqual(layout.template.left);
  expect(layout.prompt.right).toBeGreaterThanOrEqual(layout.audio.right - 1);
  expect(titleAlign).toBe('center');
});

test('the show-correct-answer toggle sits above the stem, below the passage', async ({ page }) => {
  await open(page, 'evaluate');
  await page.waitForSelector('[data-testid="show-correct-answer"]');
  const layout = await boxes(page, {
    prompt: '.pie-prompt',
    toggle: '[data-testid="show-correct-answer"]',
    template: '.pie-template-line',
  });

  expect(layout.prompt.bottom).toBeLessThanOrEqual(layout.toggle.top);
  expect(layout.toggle.bottom).toBeLessThanOrEqual(layout.template.top);
});
