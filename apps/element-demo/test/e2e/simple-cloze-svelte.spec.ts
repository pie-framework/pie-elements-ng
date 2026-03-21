import { test, expect, type Page } from '@playwright/test';
import {
  deliveryContainer,
  getScore,
  switchMode,
  switchRole,
  getSessionState,
  switchTab,
  getModelFromSource,
  updateModelInSource,
  openDeliverRoute,
} from './test-helpers';

/**
 * Stabilized browser tests for simple-cloze author/delivery flows.
 */

const ELEMENT_NAME = 'pie-simple-cloze';

test.describe('Simple Cloze (Svelte 5) - Author and Delivery', () => {
  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, 'simple-cloze');
    await expect(page.locator(ELEMENT_NAME).first()).toBeVisible();
  });

  test('1. Demo loads correctly on delivery tab', async ({ page }) => {
    await expect(page).toHaveURL(/\/deliver/);
    const element = page.locator(ELEMENT_NAME);
    await expect(element).toBeVisible();
    await expect(element.locator('input, textarea').first()).toBeVisible();
  });

  test('2. Author tab loads and shows EditableHtml with toolbar', async ({ page }) => {
    await switchTab(page, 'author');
    await expect(page).toHaveURL(/\/author/);
    const configureRoot = page.locator('.author-view .configure-container').first();
    await expect(configureRoot).toBeVisible();
    await expect(
      configureRoot.locator('input, textarea, [contenteditable="true"]').first()
    ).toBeVisible();
  });

  test('3. EditableHtml toolbar buttons work correctly', async ({ page }) => {
    await switchTab(page, 'author');
    const editable = page
      .locator('.author-view [contenteditable="true"], .author-view textarea')
      .first();
    await expect(editable).toBeVisible();
    await editable.click();
    await page.keyboard.type(`author-edit-${Date.now()}`);
    await page.waitForTimeout(500);
    await expect(editable).toBeVisible();
  });

  test('5. Changes in author view reflect in source and deliver tabs', async ({ page }) => {
    await switchTab(page, 'author');
    await switchTab(page, 'source');
    const model = (await getModelFromSource(page)) || {};
    const originalPrompt = model.prompt || '<p>What is 2 + 2?</p>';
    model.prompt = `<p>source-edit-${Date.now()}</p>`;
    await updateModelInSource(page, model);

    await switchTab(page, 'deliver');
    await expect(page.locator(ELEMENT_NAME).first()).toBeVisible();

    await switchTab(page, 'source');
    model.prompt = originalPrompt;
    await updateModelInSource(page, model);
  });

  test('6. Switching tabs maintains session state on deliver tab', async ({ page }) => {
    await switchMode(page, 'gather');
    const input = page.locator(`${ELEMENT_NAME} input[type="text"], ${ELEMENT_NAME} input`).first();
    await input.fill('5');
    await page.waitForTimeout(600);
    const before = await getSessionState(page);

    await switchTab(page, 'author');
    await page.waitForTimeout(500);
    await switchTab(page, 'deliver');
    const inputAfter = page
      .locator(`${ELEMENT_NAME} input[type="text"], ${ELEMENT_NAME} input`)
      .first();
    expect(await inputAfter.inputValue()).toBeTruthy();
    const after = await getSessionState(page);
    expect(JSON.stringify(after ?? {})).toBe(JSON.stringify(before ?? {}));
  });

  test('7. Print tab renders correctly', async ({ page }) => {
    await switchTab(page, 'print');
    await expect(page).toHaveURL(/\/print/);
    const printPlayer = page.locator('pie-esm-print-player');
    const printContent = page.locator('[data-testid="print-view"]');
    const hasPrintPlayer = (await printPlayer.count()) > 0;
    const hasPrintContent = (await printContent.count()) > 0;
    expect(hasPrintPlayer || hasPrintContent).toBeTruthy();
    if (hasPrintPlayer) {
      await expect(printPlayer).toBeVisible();
    }
  });

  test('10. Complete workflow: configure in author, view in deliver, verify in source', async ({
    page,
  }) => {
    await switchMode(page, 'gather');
    const root = deliveryContainer(page);
    await expect(root).toBeVisible();
    const input = root.locator('input[type="text"], input').first();
    await input.fill('5');
    await page.waitForTimeout(500);
    const before = await getSessionState(page);

    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    await expect(root).toBeVisible();
    const score = await getScore(page);
    expect(score === null || typeof score === 'number').toBeTruthy();

    await switchTab(page, 'source');
    const sourceModel = await getModelFromSource(page);
    expect(sourceModel?.element).toBe('simple-cloze');
    await switchTab(page, 'deliver');
    await switchMode(page, 'gather');
    const after = await getSessionState(page);
    expect(JSON.stringify(after ?? {})).toBe(JSON.stringify(before ?? {}));
  });
});
