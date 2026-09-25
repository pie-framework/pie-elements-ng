import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  deliveryContainer,
  evaluateSignal,
  getSessionState,
  interactOnce,
  openDeliverRoute,
  switchToEvaluate,
  waitForSessionMutation,
  mountedElementSelector,
} from './test-helpers';

const ELEMENTS = [
  'match',
  'matrix',
  'likert',
  'inline-dropdown',
  'select-text',
  'ebsr',
  'math-templated',
  'math-inline',
] as const;

async function interactStructured(page: Page, element: string, root: Locator) {
  if (element === 'match' || element === 'matrix' || element === 'likert' || element === 'ebsr') {
    const radioOrCheckbox = root.locator('input[type="radio"], input[type="checkbox"]').first();
    if (await radioOrCheckbox.isVisible().catch(() => false)) {
      await radioOrCheckbox.click({ force: true });
      return;
    }
  }

  if (element === 'ebsr') {
    const host = root.locator(mountedElementSelector()).first();
    if (await host.isVisible().catch(() => false)) {
      const box = await host.boundingBox();
      if (box) {
        await page.mouse.click(
          box.x + Math.min(40, box.width / 2),
          box.y + Math.min(40, box.height / 2)
        );
        return;
      }
    }
  }

  if (element === 'inline-dropdown') {
    const combobox = root.locator('[role="combobox"], button[aria-haspopup="listbox"]').first();
    if (await combobox.isVisible().catch(() => false)) {
      await combobox.click({ force: true });
      const option = page.locator('[role="option"], li[role="option"]').first();
      if (await option.isVisible().catch(() => false)) {
        await option.click({ force: true });
        return;
      }
    }
  }

  if (element === 'select-text') {
    // Hidden sample tokens precede the selectable ones.
    const token = root
      .locator('.tokenRootClass, [data-indexkey]')
      .filter({ visible: true })
      .first();
    if (await token.isVisible().catch(() => false)) {
      await token.click({ force: true });
      return;
    }
  }

  if (element === 'math-inline' || element === 'math-templated') {
    const mq = root.locator('.mq-editable-field').first();
    if (await mq.isVisible().catch(() => false)) {
      await mq.click();
      await page.keyboard.type('1');
      return;
    }
  }

  await interactOnce(page, root).catch(async () => {
    if (element === 'ebsr') {
      await expect(root).toBeVisible();
      return;
    }
    throw new Error('No interactive control found for structured interaction');
  });
}

test.describe('Phase 2: Structured and matching interactions', () => {
  for (const element of ELEMENTS) {
    test(`${element}: interaction path mutates session and evaluate renders`, async ({ page }) => {
      await openDeliverRoute(page, element);
      const root = deliveryContainer(page);
      await expect(root).toBeVisible();

      const before = await getSessionState(page);
      await interactStructured(page, element, root);
      let after = await waitForSessionMutation(page, before, 10_000);
      if (JSON.stringify(after ?? {}) === JSON.stringify(before ?? {})) {
        await interactOnce(page, root);
        after = await waitForSessionMutation(page, before, 8_000);
      }
      expect(JSON.stringify(after ?? {})).not.toBe(JSON.stringify(before ?? {}));
      expect(await getSessionState(page)).not.toBeNull();

      await switchToEvaluate(page);
      await expect(root).toBeVisible();
      if (element === 'math-inline') {
        // math-inline puts its correct-answer toggle in a tooltip on the response.
        await root.locator('.static-math').first().hover();
        await expect(page.getByText('Show correct answer')).toBeVisible({ timeout: 15_000 });
        return;
      }
      await expect(evaluateSignal(root)).toBeVisible({ timeout: 15_000 });
    });
  }
});
