/**
 * MathJax passes over an author view leave its rich-text editors alone, so an edit saves the TeX
 * the field was authored with. ProseMirror reads DOM changes in an editor back into its document:
 * math typeset inside one was saved as MathJax's output text on the next blur.
 */

import { expect, test, type Locator, type Page } from '@playwright/test';
import { getModelFromSource, switchTab } from './test-helpers';

const ELEMENT = 'multiple-choice';
const DEMO_ID = 'math-algebra-quadratic';
const PROMPT_TEX = '\\(ax^2 + bx + c = 0\\)';
const EDIT = ' (edited)';

/** Types at the end of a field; a click alone puts the caret wherever it lands, possibly in the TeX. */
async function appendText(page: Page, field: Locator, text: string) {
  await field.click();
  await field.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  });
  await page.keyboard.type(text);
}

test.describe('author view math in rich-text editors', () => {
  for (const strategy of ['esm', 'iife'] as const) {
    test(`an edit keeps the prompt's TeX (player=${strategy})`, async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto(`/${ELEMENT}/author?demo=${DEMO_ID}&player=${strategy}`);
      const prompt = page
        .locator('pie-element-player [contenteditable="true"]', { hasText: 'Algebra Question' })
        .first();
      await prompt.waitFor({ timeout: 60_000 });

      // One awaited pass of the page's renderer over the author view, as the player and
      // self-typesetting configure elements run it, so the check does not depend on their timing.
      // The probe beside the editors shows the pass typeset math.
      await page.locator('pie-element-player .element-player-host').evaluate(async (container) => {
        const probe = document.createElement('p');
        probe.dataset.testid = 'math-probe';
        probe.textContent = '\\(x^2\\)';
        container.append(probe);
        await (window as any)['@pie-lib/math-rendering'].renderMath(container);
      });
      await expect(page.getByTestId('math-probe').locator('mjx-container')).toHaveCount(1);
      await expect.soft(prompt).toContainText(PROMPT_TEX);

      await page.evaluate(() => {
        document.querySelector('pie-element-player')?.addEventListener('model-changed', (event) => {
          (window as any).__committedModel = (event as CustomEvent).detail;
        });
      });
      await appendText(page, prompt, EDIT);
      await prompt.blur();
      await page.waitForFunction(
        (text) => (window as any).__committedModel?.prompt?.includes(text),
        EDIT.trim()
      );

      await switchTab(page, 'source');
      const model = await getModelFromSource(page);
      expect(model?.prompt).toContain(EDIT.trim());
      expect(model?.prompt).toContain(PROMPT_TEX);
    });
  }
});
