import { expect, test } from '@playwright/test';
import {
  deliveryContainer,
  getModelFromSource,
  switchRole,
  switchTab,
  waitForMathRendering,
} from './test-helpers';

const DEMO_ID = 'variant-sr-vic';
const ELEMENT_SCOPE = '.delivery-view .element-container';

async function getCheckedValue(page: Parameters<typeof test>[0]['page']) {
  const checked = deliveryContainer(page).locator('input[type="radio"]:checked').first();
  return checked.getAttribute('value');
}

async function getPlayerSession(page: Parameters<typeof test>[0]['page']) {
  return page.evaluate(() => {
    const player = document.querySelector('pie-element-player') as any;
    if (!player?.session || typeof player.session !== 'object') return null;
    return JSON.parse(JSON.stringify(player.session));
  });
}

async function openMpbRoute(page: Parameters<typeof test>[0]['page'], player: 'esm' | 'iife') {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=${player}`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

test.describe('mc-populated-blank correct-answer parity', () => {
  test('evaluate incorrect response (esm): show-correct toggles display without mutating session', async ({
    page,
  }) => {
    await openMpbRoute(page, 'esm');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    await switchTab(page, 'source');
    const sourceModel = await getModelFromSource(page);
    const correctChoiceId = sourceModel?.correctChoiceId as string;
    expect(correctChoiceId).toBeTruthy();
    await switchTab(page, 'deliver');

    const radioValues = await page
      .locator(`${ELEMENT_SCOPE} input[type="radio"]`)
      .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
    const incorrectChoiceId = radioValues.find((value) => value && value !== correctChoiceId);
    expect(incorrectChoiceId).toBeTruthy();

    await page
      .locator(`${ELEMENT_SCOPE} input[type="radio"][value="${incorrectChoiceId}"]`)
      .first()
      .check();
    await page.waitForTimeout(200);
    const sessionBefore = await getPlayerSession(page);
    expect(sessionBefore?.choiceId).toBe(incorrectChoiceId);

    await switchRole(page, 'instructor');

    const toggle = root.locator('[data-testid="show-correct-answer"]').first();
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText(/show correct answer/i);
    await expect(root.getByText(/show correct answer/i).first()).toBeVisible();

    const checkedBeforeToggle = await getCheckedValue(page);
    expect(checkedBeforeToggle).toBe(incorrectChoiceId);

    await toggle.click();
    await expect(toggle).toContainText(/hide correct answer/i);
    const checkedAfterToggle = await getCheckedValue(page);
    expect(checkedAfterToggle).toBe(correctChoiceId);

    const sessionAfterToggle = await getPlayerSession(page);
    expect(sessionAfterToggle?.choiceId).toBe(incorrectChoiceId);

    await toggle.click();
    await expect(toggle).toContainText(/show correct answer/i);
    const checkedAfterHide = await getCheckedValue(page);
    expect(checkedAfterHide).toBe(incorrectChoiceId);
  });

  test('evaluate correct response: show-correct toggle stays hidden', async ({ page }) => {
    await openMpbRoute(page, 'esm');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    await switchTab(page, 'source');
    const sourceModel = await getModelFromSource(page);
    const correctChoiceId = sourceModel?.correctChoiceId as string;
    expect(correctChoiceId).toBeTruthy();
    await switchTab(page, 'deliver');

    await page
      .locator(`${ELEMENT_SCOPE} input[type="radio"][value="${correctChoiceId}"]`)
      .first()
      .check();
    await page.waitForTimeout(200);

    await switchRole(page, 'instructor');

    await expect(root.locator('[data-testid="show-correct-answer"]')).toHaveCount(0);
    await expect(root.getByText(/show correct answer|hide correct answer/i)).toHaveCount(0);
  });

  test('evaluate unanswered response: missed correct choice is marked incorrect', async ({
    page,
  }) => {
    await openMpbRoute(page, 'esm');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    await switchTab(page, 'source');
    const sourceModel = await getModelFromSource(page);
    const correctChoiceId = sourceModel?.correctChoiceId as string;
    expect(correctChoiceId).toBeTruthy();
    await switchTab(page, 'deliver');

    // Leave response empty and switch to scorer/evaluate.
    await switchRole(page, 'instructor');

    const toggle = root.locator('[data-testid="show-correct-answer"]').first();
    await expect(toggle).toBeVisible();

    await expect(
      root.locator(`.pie-choice-incorrect input[type="radio"][value="${correctChoiceId}"]`)
    ).toHaveCount(1);
  });

  test('browse-style host intent: alwaysShowCorrect presents key while preserving session', async ({
    page,
  }) => {
    await openMpbRoute(page, 'esm');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    await switchTab(page, 'source');
    const sourceModel = await getModelFromSource(page);
    const correctChoiceId = sourceModel?.correctChoiceId as string;
    expect(correctChoiceId).toBeTruthy();
    await switchTab(page, 'deliver');

    const radioValues = await page
      .locator(`${ELEMENT_SCOPE} input[type="radio"]`)
      .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));
    const incorrectChoiceId = radioValues.find((value) => value && value !== correctChoiceId);
    expect(incorrectChoiceId).toBeTruthy();

    await page
      .locator(`${ELEMENT_SCOPE} input[type="radio"][value="${incorrectChoiceId}"]`)
      .first()
      .check();
    await page.waitForTimeout(200);

    const sessionBefore = await getPlayerSession(page);
    expect(sessionBefore?.choiceId).toBe(incorrectChoiceId);

    await page.evaluate(
      ({ correctId }) => {
        const player = document.querySelector('pie-element-player') as any;
        if (!player?.model) return;
        player.model = {
          ...player.model,
          mode: 'view',
          alwaysShowCorrect: true,
          correctChoiceId: correctId,
          responseCorrect: false,
          disabled: true,
        };
      },
      { correctId: correctChoiceId }
    );
    await page.waitForTimeout(200);

    const checkedWithBrowseIntent = await getCheckedValue(page);
    expect(checkedWithBrowseIntent).toBe(correctChoiceId);
    await expect(root.locator('[data-testid="show-correct-answer"]')).toHaveCount(0);

    const sessionAfter = await getPlayerSession(page);
    expect(sessionAfter?.choiceId).toBe(incorrectChoiceId);
  });

  test('iife scorer flow: delivery remains interactive-safe in evaluate path', async ({ page }) => {
    await openMpbRoute(page, 'iife');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();

    const firstChoice = root.locator('input[type="radio"]').first();
    await expect(firstChoice).toBeVisible();
    await firstChoice.check();

    await switchRole(page, 'instructor');
    await expect(root).toBeVisible();

    const checked = await getCheckedValue(page);
    expect(checked).toBeTruthy();
    await expect(page.locator('.model-error')).toHaveCount(0);
  });
});
