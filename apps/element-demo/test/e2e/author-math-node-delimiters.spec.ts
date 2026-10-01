/**
 * A math node saves its TeX in `\(…\)` beside `data-raw`, as the legacy editors do, whichever math
 * renderer the authoring page installed. Under a page renderer without `wrapMath`, as the demo
 * player installs for both strategies, it was saved bare. A span saved without `data-raw`, or with
 * delimiters in it, saves bare TeX in `data-raw` and one pair of delimiters.
 */

import { expect, test } from '@playwright/test';
import {
  editAuthorField,
  getModelFromSource,
  switchTab,
  updateModelInSource,
} from './test-helpers';

const ELEMENT = 'multiple-choice';
const DEMO_ID = 'math-algebra-quadratic';
const EDIT = ' (edited)';

// A node saved bare, one saved as the legacy editors save it, one without `data-raw` and one
// with delimiters in `data-raw`.
const PROMPT =
  '<p>Bare <span data-latex="" data-raw="x^2">x^2</span> and wrapped ' +
  '<span data-latex="" data-raw="y+1">\\(y+1\\)</span>, ' +
  '<span data-latex="">\\(z-1\\)</span> and ' +
  '<span data-latex="" data-raw="\\(w/2\\)">\\(w/2\\)</span></p>';

test.describe('author view math nodes', () => {
  for (const strategy of ['esm', 'iife'] as const) {
    test(`an edit saves math nodes in \\(…\\) (player=${strategy})`, async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto(`/${ELEMENT}/source?demo=${DEMO_ID}&player=${strategy}`);
      await page.locator('[data-testid="source-editor"]').waitFor({ timeout: 60_000 });
      const model = await getModelFromSource(page);
      await updateModelInSource(page, { ...model, prompt: PROMPT });

      await switchTab(page, 'author');
      const prompt = page
        .locator('pie-element-player [contenteditable="true"]', { hasText: 'Bare' })
        .first();
      await prompt.waitFor({ timeout: 60_000 });
      await editAuthorField(page, prompt, 'prompt', EDIT);

      await switchTab(page, 'source');
      const saved = (await getModelFromSource(page))?.prompt;
      expect(saved).toContain('<span data-latex="" data-raw="x^2">\\(x^2\\)</span>');
      expect(saved).toContain('<span data-latex="" data-raw="y+1">\\(y+1\\)</span>');
      expect(saved).toContain('<span data-latex="" data-raw="z-1">\\(z-1\\)</span>');
      expect(saved).toContain('<span data-latex="" data-raw="w/2">\\(w/2\\)</span>');
    });
  }
});
