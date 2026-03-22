import { test, expect } from '@playwright/test';
import {
  clickSvgCenter,
  deliveryContainer,
  interactOnce,
  openDeliverRoute,
} from './test-helpers';

const MULTIPLE_CHOICE_DEMOS = ['math-algebra-quadratic', 'basic-checkbox', 'radio-simple'] as const;
const NUMBER_LINE_DEMOS = [undefined, 'basic-points'] as const;

test.describe('Demo variants coverage', () => {
  test('multiple-choice demos: each demo accepts input and exposes session panel data', async ({
    page,
  }) => {
    for (const demoId of MULTIPLE_CHOICE_DEMOS) {
      await openDeliverRoute(page, 'multiple-choice', demoId);
      const root = deliveryContainer(page);
      await expect(root).toBeVisible();

      const byValue = root.locator('label[data-value], input[type="radio"], input[type="checkbox"]').first();
      await expect(byValue).toBeVisible();
      await byValue.click({ force: true });
      const sessionPanel = page.locator('[data-testid="session-panel-content"]').first();
      await expect(sessionPanel).toContainText(/\{|\[/);
    }
  });

  test('number-line demos: default and basic-points both render and gather', async ({ page }) => {
    for (const demoId of NUMBER_LINE_DEMOS) {
      await openDeliverRoute(page, 'number-line', demoId);
      const root = deliveryContainer(page);
      await expect(root).toBeVisible();

      await clickSvgCenter(root, page).catch(async () => {
        await interactOnce(page, root);
      });
      const sessionPanel = page.locator('[data-testid="session-panel-content"]').first();
      await expect(sessionPanel).toContainText(/\{|\[/);
    }
  });
});
