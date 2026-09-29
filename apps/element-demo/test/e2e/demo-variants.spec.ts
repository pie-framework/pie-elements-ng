import { test, expect } from '@playwright/test';
import {
  clickNumberLineTick,
  deliveryContainer,
  getSessionState,
  openDeliverRoute,
  waitForSessionMutation,
} from './test-helpers';

const MULTIPLE_CHOICE_DEMOS = ['math-algebra-quadratic', 'basic-checkbox', 'radio-simple'] as const;
const NUMBER_LINE_DEMOS = [undefined, 'basic-points'] as const;

test.describe('Demo variants coverage', () => {
  test('multiple-choice demos: each demo accepts input and records it in the session', async ({
    page,
  }) => {
    for (const demoId of MULTIPLE_CHOICE_DEMOS) {
      await openDeliverRoute(page, 'multiple-choice', demoId);
      const root = deliveryContainer(page);
      await expect(root).toBeVisible();

      const byValue = root
        .locator('label[data-value], input[type="radio"], input[type="checkbox"]')
        .first();
      await expect(byValue).toBeVisible();
      await byValue.click({ force: true });
      await expect.poll(async () => (await getSessionState(page))?.value ?? []).toHaveLength(1);
    }
  });

  test('number-line demos: default and basic-points both render and gather', async ({ page }) => {
    for (const demoId of NUMBER_LINE_DEMOS) {
      await openDeliverRoute(page, 'number-line', demoId);
      const root = deliveryContainer(page);
      await expect(root).toBeVisible();

      const before = await getSessionState(page);
      await clickNumberLineTick(page, root);
      const after = await waitForSessionMutation(page, before);
      expect(JSON.stringify(after ?? {})).not.toBe(JSON.stringify(before ?? {}));
    }
  });
});
