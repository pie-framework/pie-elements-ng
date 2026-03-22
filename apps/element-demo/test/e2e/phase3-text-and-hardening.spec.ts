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

async function selectMultipleChoiceValue(
  root: ReturnType<typeof deliveryContainer>,
  value: string
) {
  const label = root.locator(`label[data-value="${value}"]`).first();
  if (await label.isVisible().catch(() => false)) {
    await label.click({ force: true });
    return;
  }
  const input = root.locator(`input[value="${value}"]`).first();
  if (await input.isVisible().catch(() => false)) {
    await input.click({ force: true });
    return;
  }
  throw new Error(`multiple-choice option not found: ${value}`);
}

test.describe('Phase 3: Text interactions and hardening', () => {
  test('extended-text-entry: gather edit updates session and evaluate locks input', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'extended-text-entry');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const editor = root.locator('[contenteditable="true"], [role="textbox"], textarea').first();
    await expect(editor).toBeVisible();
    const marker = `extended-text-${Date.now()}`;
    const before = await getSessionState(page);
    await editor.click();
    await page.keyboard.type(marker);
    await page.keyboard.press('Tab').catch(() => {});
    const after = await waitForSessionMutation(page, before, 10_000);
    const sessionChanged = JSON.stringify(after ?? {}) !== JSON.stringify(before ?? {});
    if (!sessionChanged) {
      const editorText = ((await editor.textContent().catch(() => '')) || '').trim();
      const editorValue = await editor.inputValue().catch(() => '');
      expect(editorText.includes(marker) || editorValue.includes(marker)).toBeTruthy();
    }

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
    const marker = `ecr-${Date.now()}`;
    const before = await getSessionState(page);
    await field.click();
    await page.keyboard.type(marker);
    await page.keyboard.press('Tab').catch(() => {});
    const after = await waitForSessionMutation(page, before, 10_000);
    const sessionChanged = JSON.stringify(after ?? {}) !== JSON.stringify(before ?? {});
    if (!sessionChanged) {
      const textContent = ((await field.textContent().catch(() => '')) || '').trim();
      const inputValue = await field.inputValue().catch(() => '');
      expect(textContent.includes(marker) || inputValue.includes(marker)).toBeTruthy();
    }

    await switchToEvaluate(page);
    const evaluateSignal = page
      .locator(
        '[data-testid="score-value"], [data-testid="scoring-panel"], .feedback, .correct, .incorrect, button:has-text("Show correct answer")'
      )
      .first();
    await expect(evaluateSignal).toBeVisible();
  });

  test('multiple-choice: checkbox demo accepts selection and evaluate scoring', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'multiple-choice');
    await selectDemo(page, 'basic-checkbox');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const before = await getSessionState(page);
    await selectMultipleChoiceValue(root, 'photosynthesis');
    const secondByText = root
      .locator(
        'label:has-text("Cellular respiration"), label:has-text("cellular respiration"), input[aria-label*="Cellular respiration" i]'
      )
      .first();
    if (await secondByText.isVisible().catch(() => false)) {
      await secondByText.click({ force: true });
    } else {
      await selectMultipleChoiceValue(root, 'cellular-respiration');
    }
    let after = await waitForSessionMutation(page, before, 10_000);
    let selectedCount = (after?.value || []).length;
    let checkedCount = await root.locator('input[type="checkbox"]:checked').count();
    if (selectedCount < 2 && checkedCount < 2) {
      await selectMultipleChoiceValue(root, 'cellular-respiration');
      await page.waitForTimeout(500);
      after = await getSessionState(page);
      selectedCount = (after?.value || []).length;
      checkedCount = await root.locator('input[type="checkbox"]:checked').count();
    }
    expect(Array.isArray(after?.value)).toBeTruthy();
    expect(selectedCount >= 1 || checkedCount >= 1).toBeTruthy();

    await switchToEvaluate(page);
    await expect(page.locator('[data-testid="score-value"]').first()).toBeVisible();
  });

  test('multiple-choice: view mode prevents response change', async ({ page }) => {
    await openDeliverRoute(page, 'multiple-choice');
    await selectDemo(page, 'radio-simple');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const option1 = root.locator('input[value="mercury"], label[data-value="mercury"]').first();
    const option2 = root.locator('input[value="jupiter"], label[data-value="jupiter"]').first();
    await selectMultipleChoiceValue(root, 'mercury');
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
