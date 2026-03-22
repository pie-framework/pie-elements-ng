import { test, expect, type Page } from '@playwright/test';
import {
  deliveryContainer,
  getModelFromSource,
  openDeliverRoute,
  switchTab,
  updateModelInSource,
} from './test-helpers';

type SourcePropagationCase = {
  element: string;
  demoId?: string;
};

const SOURCE_PROPAGATION_CASES: SourcePropagationCase[] = [
  { element: 'multiple-choice', demoId: 'math-algebra-quadratic' },
  { element: 'simple-cloze' },
  { element: 'explicit-constructed-response' },
];

function cloneModel<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function applyPromptMarker(model: any, marker: string) {
  const next = cloneModel(model || {});
  next.prompt = `<p>${marker}</p>`;
  return next;
}

async function assertDeliveryRendersAfterApply(page: Page) {
  const root = deliveryContainer(page);
  await expect(root).toBeVisible();
  await expect(page.locator('.model-error').first()).not.toBeVisible();
}

test.describe('Phase 4: Source/author propagation', () => {
  for (const item of SOURCE_PROPAGATION_CASES) {
    test(`${item.element}: source apply propagates model changes to delivery`, async ({ page }) => {
      await openDeliverRoute(page, item.element, item.demoId);
      await switchTab(page, 'source');

      const original = await getModelFromSource(page);
      expect(original).toBeTruthy();

      const marker = `prop-source-${item.element}-${Date.now()}`;
      const mutated = applyPromptMarker(original, marker);
      await updateModelInSource(page, mutated);

      const updated = await getModelFromSource(page);
      expect(JSON.stringify(updated ?? {})).toContain(marker);

      await switchTab(page, 'deliver');
      await assertDeliveryRendersAfterApply(page);

      await switchTab(page, 'source');
      await updateModelInSource(page, original);
    });
  }

  test('simple-cloze: author edits propagate to source and delivery', async ({ page }) => {
    await openDeliverRoute(page, 'simple-cloze');
    await switchTab(page, 'author');

    const marker = `prop-author-cloze-${Date.now()}`;
    const editable = page
      .locator(
        '.author-view [contenteditable="true"], .author-view textarea, .author-view input[type="text"]'
      )
      .first();
    await expect(editable).toBeVisible();
    await editable.click();
    await page.keyboard.press('Meta+A').catch(() => {});
    await page.keyboard.type(marker);
    await page.waitForTimeout(1200);

    await switchTab(page, 'source');
    const sourceModel = await getModelFromSource(page);
    expect(JSON.stringify(sourceModel ?? {})).toContain(marker);

    await switchTab(page, 'deliver');
    await assertDeliveryRendersAfterApply(page);
  });
});
