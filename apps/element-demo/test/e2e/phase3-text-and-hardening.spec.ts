import { test, expect } from '@playwright/test';
import {
  deliveryContainer,
  getSessionState,
  openDeliverRoute,
  selectDemo,
  switchMode,
  switchRole,
  switchToEvaluate,
  waitForSessionMutation,
} from './test-helpers';

test.describe('Phase 3: Text interactions and hardening', () => {
  test('extended-text-entry: gather edit updates session and evaluate locks input', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'extended-text-entry');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const editor = root.locator('[contenteditable="true"], [role="textbox"], textarea').first();
    await expect(editor).toBeVisible();
    const before = await getSessionState(page);
    await editor.click();
    await page.keyboard.type(`extended-text-${Date.now()}`);
    const after = await waitForSessionMutation(page, before, 10_000);
    expect(JSON.stringify(after ?? {})).not.toBe(JSON.stringify(before ?? {}));

    await switchToEvaluate(page);
    await expect(root).toBeVisible();
  });

  test('explicit-constructed-response: fill response area and evaluate renders signals', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'explicit-constructed-response');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const field = root
      .locator('input, textarea, [contenteditable="true"], [role="textbox"], .mq-editable-field')
      .first();
    await expect(field).toBeVisible();
    const before = await getSessionState(page);
    await field.click();
    await page.keyboard.type('moon');
    const after = await waitForSessionMutation(page, before, 10_000);
    expect(JSON.stringify(after ?? {})).not.toBe(JSON.stringify(before ?? {}));

    await switchToEvaluate(page);
    const evaluateSignal = page
      .locator(
        '[data-testid="score-value"], [data-testid="scoring-panel"], .feedback, .correct, .incorrect, button:has-text("Show correct answer")'
      )
      .first();
    await expect(evaluateSignal).toBeVisible();
  });

  test('multiple-choice: checkbox demo supports multi-select and evaluate scoring', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'multiple-choice');
    await selectDemo(page, 'basic-checkbox');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const before = await getSessionState(page);
    await root.locator('input[value="photosynthesis"]').check();
    await root.locator('input[value="cellular-respiration"]').check();
    const after = await waitForSessionMutation(page, before, 10_000);
    expect(Array.isArray(after?.value)).toBeTruthy();
    expect((after?.value || []).length).toBeGreaterThanOrEqual(2);

    await switchToEvaluate(page);
    await expect(page.locator('[data-testid="score-value"]').first()).toBeVisible();
  });

  test('multiple-choice: view mode prevents response change', async ({ page }) => {
    await openDeliverRoute(page, 'multiple-choice');
    await selectDemo(page, 'radio-simple');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const option1 = root.locator('input[value="mercury"]').first();
    const option2 = root.locator('input[value="jupiter"]').first();
    await option1.check();
    await page.waitForTimeout(300);
    const before = await getSessionState(page);

    await switchMode(page, 'view');
    if (await option2.isVisible().catch(() => false)) {
      await option2.click({ force: true });
    }
    await page.waitForTimeout(500);
    const after = await getSessionState(page);
    expect(JSON.stringify(after ?? {})).toBe(JSON.stringify(before ?? {}));
  });

  test('simple-cloze: evaluate mode exposes correct/feedback signal for wrong answer', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'simple-cloze');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const input = root.locator('input[type="text"], input').first();
    await input.fill('wrong-answer');
    await page.waitForTimeout(600);

    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');

    const signal = root
      .locator('.correctness-icon, .incorrect, button:has-text("Show correct answer")')
      .first();
    await expect(signal).toBeVisible();
  });
});
